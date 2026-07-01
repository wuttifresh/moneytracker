'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { billSchema } from '@/lib/validations/bill';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parse(formData: FormData) {
  return billSchema.safeParse({
    name: formData.get('name'),
    billType: formData.get('billType') ?? '',
    amount: formData.get('amount'),
    dueDay: formData.get('dueDay'),
    note: formData.get('note') ?? '',
  });
}

/** Build the Prisma data payload shared by create and update. */
function toData(d: ReturnType<typeof billSchema.parse>) {
  return {
    name: d.name,
    billType: d.billType ?? null,
    amount: d.amount,
    dueDay: d.dueDay,
    note: d.note ? d.note : null,
  };
}

export async function createBill(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.bill.create({
    data: { userId, ...toData(parsed.data) },
  });
  revalidatePath('/bills');
  return { success: true };
}

export async function updateBill(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.bill.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบรายการบิลนี้' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.bill.update({
    where: { id },
    data: toData(parsed.data),
  });
  revalidatePath('/bills');
  return { success: true };
}

export async function deleteBill(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.bill.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบรายการบิลนี้' };
  revalidatePath('/bills');
  return { success: true };
}

/**
 * Toggle whether a bill is marked paid for a given year/month. The amount
 * is recorded from the bill's current amount (never trusted from the client).
 */
export async function toggleBillPaid(
  billId: string,
  year: number,
  month: number,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const bill = await prisma.bill.findFirst({
    where: { id: billId, userId, deletedAt: null },
  });
  if (!bill) return { formError: 'ไม่พบรายการบิลนี้' };
  if (month < 1 || month > 12) return { formError: 'เดือนไม่ถูกต้อง' };

  const existing = await prisma.billPayment.findUnique({
    where: { billId_year_month: { billId, year, month } },
    select: { id: true },
  });

  if (existing) {
    await prisma.billPayment.delete({ where: { id: existing.id } });
  } else {
    await prisma.billPayment.create({
      data: { userId, billId, year, month, amount: bill.amount },
    });
  }
  revalidatePath('/bills');
  return { success: true };
}
