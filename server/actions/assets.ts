'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { assetSchema, type AssetInput } from '@/lib/validations/asset';
import { fieldErrorsFrom, type ActionState } from '@/lib/forms';

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function parse(formData: FormData) {
  return assetSchema.safeParse({
    name: formData.get('name'),
    kind: formData.get('kind') ?? '',
    purchaseValue: formData.get('purchaseValue'),
    salvageValue: formData.get('salvageValue') ?? '',
    purchaseDate: formData.get('purchaseDate'),
    usefulLifeYears: formData.get('usefulLifeYears') ?? '',
    note: formData.get('note') ?? '',
  });
}

function toData(data: AssetInput) {
  return {
    name: data.name,
    kind: data.kind ? data.kind : null,
    purchaseValue: data.purchaseValue,
    salvageValue: data.salvageValue ? data.salvageValue : '0',
    purchaseDate: new Date(data.purchaseDate),
    usefulLifeYears: data.usefulLifeYears ? Number(data.usefulLifeYears) : null,
    note: data.note ? data.note : null,
  };
}

export async function createAsset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.asset.create({ data: { userId, ...toData(parsed.data) } });
  revalidatePath('/assets');
  return { success: true };
}

export async function updateAsset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const id = formData.get('id');
  if (typeof id !== 'string' || !id) return { formError: 'ข้อมูลไม่ถูกต้อง' };

  const existing = await prisma.asset.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return { formError: 'ไม่พบทรัพย์สินนี้' };

  const parsed = parse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  await prisma.asset.update({ where: { id }, data: toData(parsed.data) });
  revalidatePath('/assets');
  return { success: true };
}

export async function deleteAsset(id: string): Promise<ActionState> {
  const userId = await requireUserId();
  if (!userId) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const res = await prisma.asset.updateMany({
    where: { id, userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (res.count === 0) return { formError: 'ไม่พบทรัพย์สินนี้' };
  revalidatePath('/assets');
  return { success: true };
}
