'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { addSavingsSchema, goalSchema } from '@/lib/validations/planning';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Set, update, or clear (empty/0) the monthly budget for a category. */
export async function setBudget(
  categoryId: string,
  amount: string,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!category) return { formError: 'ไม่พบหมวดหมู่นี้' };

  const trimmed = amount.trim();
  if (trimmed === '' || Number(trimmed) === 0) {
    await prisma.budget.deleteMany({ where: { userId, categoryId } });
    revalidatePath('/planning');
    return { success: true };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { fieldErrors: { amount: ['จำนวนเงินไม่ถูกต้อง'] } };
  }

  await prisma.budget.upsert({
    where: { userId_categoryId: { userId, categoryId } },
    create: { userId, categoryId, amount: trimmed },
    update: { amount: trimmed },
  });
  revalidatePath('/planning');
  return { success: true };
}

export async function createGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = goalSchema.safeParse({
    name: formData.get('name'),
    targetAmount: formData.get('targetAmount'),
    currentAmount: formData.get('currentAmount') ?? '',
    deadline: formData.get('deadline') ?? '',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, targetAmount, currentAmount, deadline, note } = parsed.data;
  await prisma.savingGoal.create({
    data: {
      userId,
      name,
      targetAmount,
      currentAmount: currentAmount ? currentAmount : '0',
      deadline: deadline ? new Date(deadline) : null,
      note: note ? note : null,
    },
  });
  revalidatePath('/planning');
  return { success: true };
}

export async function updateGoal(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.savingGoal.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบเป้าหมายนี้' };

  const parsed = goalSchema.safeParse({
    name: formData.get('name'),
    targetAmount: formData.get('targetAmount'),
    currentAmount: formData.get('currentAmount') ?? '',
    deadline: formData.get('deadline') ?? '',
    note: formData.get('note') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, targetAmount, currentAmount, deadline, note } = parsed.data;
  await prisma.savingGoal.update({
    where: { id },
    data: {
      name,
      targetAmount,
      currentAmount: currentAmount ? currentAmount : '0',
      deadline: deadline ? new Date(deadline) : null,
      note: note ? note : null,
    },
  });
  revalidatePath('/planning');
  return { success: true };
}

export async function addSavings(
  goalId: string,
  amount: string,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = addSavingsSchema.safeParse({ amount });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const res = await prisma.savingGoal.updateMany({
    where: { id: goalId, userId, deletedAt: null },
    data: { currentAmount: { increment: new Prisma.Decimal(parsed.data.amount) } },
  });
  if (res.count === 0) return { formError: 'ไม่พบเป้าหมายนี้' };
  revalidatePath('/planning');
  return { success: true };
}

export async function deleteGoal(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.savingGoal.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบเป้าหมายนี้' };
  revalidatePath('/planning');
  return { success: true };
}
