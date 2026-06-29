import type { TxType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type CategoryDTO = {
  id: string;
  name: string;
  type: TxType;
  icon: string | null;
  color: string | null;
};

type DefaultCategory = {
  name: string;
  type: TxType;
  icon: string;
  color: string;
};

/** Seeded once per user on first use (Thai-language defaults). */
const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: 'อาหาร', type: 'expense', icon: 'UtensilsCrossed', color: '#f87171' },
  { name: 'เดินทาง', type: 'expense', icon: 'Car', color: '#60a5fa' },
  { name: 'ช้อปปิ้ง', type: 'expense', icon: 'ShoppingBag', color: '#f472b6' },
  { name: 'บิล/ค่าน้ำค่าไฟ', type: 'expense', icon: 'ReceiptText', color: '#fbbf24' },
  { name: 'บันเทิง', type: 'expense', icon: 'Film', color: '#a78bfa' },
  { name: 'สุขภาพ', type: 'expense', icon: 'HeartPulse', color: '#34d399' },
  { name: 'ที่พัก', type: 'expense', icon: 'Home', color: '#fb923c' },
  { name: 'อื่นๆ', type: 'expense', icon: 'MoreHorizontal', color: '#94a3b8' },
  { name: 'เงินเดือน', type: 'income', icon: 'Wallet', color: '#34d399' },
  { name: 'โบนัส', type: 'income', icon: 'Gift', color: '#22d3ee' },
  { name: 'รายได้เสริม', type: 'income', icon: 'Briefcase', color: '#818cf8' },
  { name: 'การลงทุน', type: 'income', icon: 'TrendingUp', color: '#2dd4bf' },
  { name: 'อื่นๆ', type: 'income', icon: 'MoreHorizontal', color: '#94a3b8' },
];

/** Create the default category set the first time a user has none. */
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return;
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
  });
}

export async function getCategories(
  userId: string,
  type?: TxType,
): Promise<CategoryDTO[]> {
  const rows = await prisma.category.findMany({
    where: { userId, deletedAt: null, ...(type ? { type } : {}) },
    orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, type: true, icon: true, color: true },
  });
  return rows;
}
