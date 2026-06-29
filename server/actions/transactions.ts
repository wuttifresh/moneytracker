'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/validations/transaction';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

type CheckResult =
  | { error: NonNullable<ActionState> }
  | { data: TransactionInput };

function revalidate() {
  revalidatePath('/');
  revalidatePath('/transactions');
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Validate input + confirm the chosen category belongs to the user. */
async function parseAndCheck(
  userId: string,
  formData: FormData,
): Promise<CheckResult> {
  const parsed = transactionSchema.safeParse({
    type: formData.get('type'),
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    date: formData.get('date'),
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) {
    return { error: { fieldErrors: fieldErrorsFrom(parsed.error) } };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId, deletedAt: null },
    select: { id: true, type: true },
  });
  if (!category) {
    return { error: { fieldErrors: { categoryId: ['ไม่พบหมวดหมู่นี้'] } } };
  }
  if (category.type !== parsed.data.type) {
    return {
      error: { fieldErrors: { categoryId: ['ประเภทไม่ตรงกับหมวดหมู่'] } },
    };
  }
  return { data: parsed.data };
}

export async function createTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const result = await parseAndCheck(userId, formData);
  if ('error' in result) return result.error;
  const { type, amount, categoryId, date, note } = result.data;

  await prisma.transaction.create({
    data: {
      userId,
      categoryId,
      type,
      amount,
      date: new Date(date),
      note: note ? note : null,
    },
  });
  revalidate();
  return { success: true };
}

export async function updateTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  // Ownership check before mutating.
  const existing = await prisma.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบรายการนี้' };

  const result = await parseAndCheck(userId, formData);
  if ('error' in result) return result.error;
  const { type, amount, categoryId, date, note } = result.data;

  await prisma.transaction.update({
    where: { id },
    data: {
      categoryId,
      type,
      amount,
      date: new Date(date),
      note: note ? note : null,
    },
  });
  revalidate();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  // Soft delete, scoped to the owner.
  const res = await prisma.transaction.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบรายการนี้' };
  revalidate();
  return { success: true };
}
