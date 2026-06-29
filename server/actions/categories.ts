'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { categorySchema } from '@/lib/validations/transaction';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

function revalidate() {
  revalidatePath('/');
  revalidatePath('/transactions');
  revalidatePath('/categories');
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    icon: formData.get('icon') ?? '',
    color: formData.get('color') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, type, icon, color } = parsed.data;
  await prisma.category.create({
    data: {
      userId,
      name,
      type,
      icon: icon ? icon : null,
      color: color ? color : null,
    },
  });
  revalidate();
  return { success: true };
}

export async function updateCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.category.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบหมวดหมู่นี้' };

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    icon: formData.get('icon') ?? '',
    color: formData.get('color') ?? '',
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, type, icon, color } = parsed.data;
  await prisma.category.update({
    where: { id },
    data: {
      name,
      type,
      icon: icon ? icon : null,
      color: color ? color : null,
    },
  });
  revalidate();
  return { success: true };
}

/** Soft delete. Existing transactions keep their (now-archived) category. */
export async function deleteCategory(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.category.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบหมวดหมู่นี้' };
  revalidate();
  return { success: true };
}
