'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { debtSchema } from '@/lib/validations/debt';
import { buildSchedule } from '@/lib/amortization';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parse(formData: FormData) {
  return debtSchema.safeParse({
    name: formData.get('name'),
    debtType: formData.get('debtType') ?? '',
    lender: formData.get('lender') ?? '',
    principal: formData.get('principal'),
    balance: formData.get('balance') ?? '',
    annualRate: formData.get('annualRate'),
    minPayment: formData.get('minPayment') ?? '',
    dueDay: formData.get('dueDay') ?? '',
    termMonths: formData.get('termMonths'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') ?? '',
    note: formData.get('note') ?? '',
  });
}

/** Build the Prisma data payload shared by create and update. */
function toData(d: ReturnType<typeof debtSchema.parse>) {
  return {
    name: d.name,
    debtType: d.debtType ?? null,
    lender: d.lender ?? null,
    principal: d.principal,
    balance: d.balance ?? null,
    annualRate: d.annualRate ?? null,
    minPayment: d.minPayment ?? null,
    dueDay: d.dueDay ?? null,
    termMonths: d.termMonths ?? null,
    startDate: new Date(d.startDate),
    endDate: d.endDate ? new Date(d.endDate) : null,
    note: d.note ? d.note : null,
  };
}

export async function createDebt(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.debt.create({
    data: { userId, ...toData(parsed.data) },
  });
  revalidatePath('/debts');
  return { success: true };
}

export async function updateDebt(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.debt.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบรายการหนี้นี้' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.debt.update({
    where: { id },
    data: toData(parsed.data),
  });
  revalidatePath('/debts');
  revalidatePath(`/debts/${id}`);
  return { success: true };
}

export async function deleteDebt(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.debt.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบรายการหนี้นี้' };
  revalidatePath('/debts');
  return { success: true };
}

/**
 * Toggle whether an installment is marked paid. The amount is recomputed
 * server-side from the debt's schedule (never trusted from the client).
 */
export async function toggleInstallment(
  debtId: string,
  installmentNo: number,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const debt = await prisma.debt.findFirst({
    where: { id: debtId, userId, deletedAt: null },
  });
  if (!debt) return { formError: 'ไม่พบรายการหนี้นี้' };
  if (debt.termMonths == null) {
    return { formError: 'หนี้นี้ไม่มีจำนวนงวด จึงไม่มีตารางตัดชำระ' };
  }
  if (installmentNo < 1 || installmentNo > debt.termMonths) {
    return { formError: 'งวดไม่ถูกต้อง' };
  }

  const existing = await prisma.debtPayment.findUnique({
    where: { debtId_installmentNo: { debtId, installmentNo } },
    select: { id: true },
  });

  if (existing) {
    await prisma.debtPayment.delete({ where: { id: existing.id } });
  } else {
    const schedule = buildSchedule(
      Number(debt.principal),
      Number(debt.annualRate ?? 0),
      debt.termMonths,
    );
    const row = schedule.rows.find((r) => r.no === installmentNo);
    await prisma.debtPayment.create({
      data: {
        userId,
        debtId,
        installmentNo,
        amount: row ? row.payment.toFixed(2) : '0',
      },
    });
  }
  revalidatePath(`/debts/${debtId}`);
  revalidatePath('/debts');
  return { success: true };
}
