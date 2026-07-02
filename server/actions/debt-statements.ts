'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { debtStatementSchema } from '@/lib/validations/debt-statement';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** First-of-month for the given yyyy-mm-dd/yyyy-mm input, avoiding TZ drift. */
function toStatementMonth(v: string): Date {
  const [y, m] = v.split('-').map(Number) as [number, number | undefined];
  return new Date(Date.UTC(y, (m ?? 1) - 1, 1));
}

function parse(formData: FormData) {
  return debtStatementSchema.safeParse({
    statementMonth: formData.get('statementMonth'),
    fullBalance: formData.get('fullBalance'),
    minPayment: formData.get('minPayment'),
    dueDate: formData.get('dueDate') ?? '',
    note: formData.get('note') ?? '',
  });
}

export async function createDebtStatement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const debtId = formData.get('debtId');
  if (typeof debtId !== 'string' || !debtId) {
    return { formError: 'ข้อมูลไม่ถูกต้อง' };
  }

  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!debt) return { formError: 'ไม่พบรายการหนี้นี้' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await prisma.debtStatement.create({
      data: {
        userId,
        debtId,
        statementMonth: toStatementMonth(parsed.data.statementMonth),
        fullBalance: parsed.data.fullBalance,
        minPayment: parsed.data.minPayment,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        note: parsed.data.note ? parsed.data.note : null,
      },
    });
  } catch {
    return { fieldErrors: { statementMonth: ['มีรอบบิลของเดือนนี้อยู่แล้ว'] } };
  }

  revalidatePath(`/debts/${debtId}`);
  revalidatePath('/debts');
  return { success: true };
}

export async function deleteDebtStatement(
  debtId: string,
  statementId: string,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.debtStatement.deleteMany({
    where: { id: statementId, debtId, userId },
  });
  if (res.count === 0) return { formError: 'ไม่พบรอบบิลนี้' };

  revalidatePath(`/debts/${debtId}`);
  revalidatePath('/debts');
  return { success: true };
}
