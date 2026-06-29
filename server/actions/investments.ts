'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { investmentSchema } from '@/lib/validations/investment';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parse(formData: FormData) {
  return investmentSchema.safeParse({
    name: formData.get('name'),
    kind: formData.get('kind') ?? '',
    units: formData.get('units'),
    costPerUnit: formData.get('costPerUnit'),
    currentPrice: formData.get('currentPrice'),
    note: formData.get('note') ?? '',
  });
}

export async function createInvestment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, kind, units, costPerUnit, currentPrice, note } = parsed.data;
  await prisma.investment.create({
    data: {
      userId,
      name,
      kind: kind ? kind : null,
      units,
      costPerUnit,
      currentPrice,
      note: note ? note : null,
    },
  });
  revalidatePath('/investments');
  return { success: true };
}

export async function updateInvestment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.investment.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบสินทรัพย์นี้' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, kind, units, costPerUnit, currentPrice, note } = parsed.data;
  await prisma.investment.update({
    where: { id },
    data: {
      name,
      kind: kind ? kind : null,
      units,
      costPerUnit,
      currentPrice,
      note: note ? note : null,
    },
  });
  revalidatePath('/investments');
  return { success: true };
}

export async function deleteInvestment(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.investment.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบสินทรัพย์นี้' };
  revalidatePath('/investments');
  return { success: true };
}
