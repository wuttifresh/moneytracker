import type { TxType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type TransactionDTO = {
  id: string;
  type: TxType;
  amount: string; // decimal string (no float arithmetic downstream)
  note: string | null;
  date: string; // ISO
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
};

export type TransactionFilter = {
  year: number;
  month: number; // 1-12
  type?: TxType;
  categoryId?: string;
};

export type DashboardData = {
  income: number;
  expense: number;
  balance: number;
  avgExpensePerDay: number;
  topCategory: { name: string; color: string | null; amount: number } | null;
  breakdown: { name: string; value: number; color: string }[];
  recent: TransactionDTO[];
};

/** [start, end) range for the given 1-based month. */
export function monthRange(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(year, month - 1, 1),
    end: new Date(year, month, 1),
  };
}

function whereForMonth(userId: string, filter: TransactionFilter) {
  const { start, end } = monthRange(filter.year, filter.month);
  return {
    userId,
    deletedAt: null,
    date: { gte: start, lt: end },
    ...(filter.type ? { type: filter.type } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
  };
}

export async function listTransactions(
  userId: string,
  filter: TransactionFilter,
): Promise<TransactionDTO[]> {
  const rows = await prisma.transaction.findMany({
    where: whereForMonth(userId, filter),
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { id: true, name: true, icon: true, color: true } },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: t.amount.toString(),
    note: t.note,
    date: t.date.toISOString(),
    category: t.category,
  }));
}

export async function getDashboardData(
  userId: string,
  year: number,
  month: number,
): Promise<DashboardData> {
  const { start, end } = monthRange(year, month);
  const baseWhere = { userId, deletedAt: null, date: { gte: start, lt: end } };

  const [incomeAgg, expenseAgg, grouped, recentRows] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...baseWhere, type: 'income' },
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { ...baseWhere, type: 'expense' },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...baseWhere, type: 'expense' },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: baseWhere,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: {
        category: { select: { id: true, name: true, icon: true, color: true } },
      },
    }),
  ]);

  const income = incomeAgg._sum.amount?.toNumber() ?? 0;
  const expense = expenseAgg._sum.amount?.toNumber() ?? 0;

  // Resolve category names/colours for the expense breakdown.
  const categoryIds = grouped.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const breakdown = grouped
    .map((g) => {
      const cat = catMap.get(g.categoryId);
      return {
        name: cat?.name ?? 'อื่นๆ',
        color: cat?.color ?? '#94a3b8',
        value: g._sum.amount?.toNumber() ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const top = breakdown[0];
  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === month - 1;
  const daysForAvg = isCurrentMonth
    ? now.getDate()
    : new Date(year, month, 0).getDate();

  return {
    income,
    expense,
    balance: income - expense,
    avgExpensePerDay: daysForAvg > 0 ? expense / daysForAvg : 0,
    topCategory: top
      ? { name: top.name, color: top.color, amount: top.value }
      : null,
    breakdown,
    recent: recentRows.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      note: t.note,
      date: t.date.toISOString(),
      category: t.category,
    })),
  };
}
