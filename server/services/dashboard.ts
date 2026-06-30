import { prisma } from '@/lib/prisma';
import { monthRange, type TransactionDTO } from './transactions';
import {
  ensureDefaultCategories,
  getCategories,
  type CategoryDTO,
} from './categories';
import { nextDueDate, daysUntil, DUE_SOON_DAYS } from '@/lib/debt-due';

export type UpcomingDue = {
  id: string;
  name: string;
  dueDate: string;
  daysUntil: number;
  minPayment: string | null;
};

export type DashboardView = {
  income: number;
  expense: number;
  balance: number;
  avgExpensePerDay: number;
  topCategory: { name: string; color: string | null; amount: number } | null;
  breakdown: { name: string; value: number; color: string }[];
  recent: TransactionDTO[];
  categories: CategoryDTO[];
  overBudgetCount: number;
  upcomingDues: UpcomingDue[];
};

type DebtDueRow = {
  id: string;
  name: string;
  dueDay: number | null;
  minPayment: { toString(): string } | null;
  termMonths: number;
  _count: { payments: number };
};

/**
 * Everything the dashboard needs in a SINGLE round-trip batch (instead of
 * several sequential queries). This matters a lot when the function and the
 * database are in different regions. The budget query is fault-tolerant so a
 * missing planning table never breaks the dashboard.
 */
export async function getDashboardView(
  userId: string,
  year: number,
  month: number,
): Promise<DashboardView> {
  const { start, end } = monthRange(year, month);
  const baseWhere = { userId, deletedAt: null, date: { gte: start, lt: end } };

  const [
    incomeAgg,
    expenseAgg,
    grouped,
    recentRows,
    categoriesRaw,
    budgets,
    debtsDue,
  ] = await Promise.all([
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
      prisma.category.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, type: true, icon: true, color: true },
      }),
      // Resilient: if the Budget table hasn't been migrated yet, treat as none.
      prisma.budget
        .findMany({ where: { userId } })
        .catch(() => [] as { categoryId: string; amount: { toNumber(): number } }[]),
      // Resilient: dueDay/minPayment are recent columns — tolerate pre-migration.
      prisma.debt
        .findMany({
          where: { userId, deletedAt: null, dueDay: { not: null } },
          select: {
            id: true,
            name: true,
            dueDay: true,
            minPayment: true,
            termMonths: true,
            _count: { select: { payments: true } },
          },
        })
        .catch(() => [] as DebtDueRow[]),
    ]);

  // First-ever load: seed default categories, then use them (rare path).
  let categories = categoriesRaw;
  if (categories.length === 0) {
    await ensureDefaultCategories(userId);
    categories = await getCategories(userId);
  }

  const income = incomeAgg._sum.amount?.toNumber() ?? 0;
  const expense = expenseAgg._sum.amount?.toNumber() ?? 0;

  const catById = new Map(categories.map((c) => [c.id, c]));
  const spentByCategory = new Map(
    grouped.map((g) => [g.categoryId, g._sum.amount?.toNumber() ?? 0]),
  );

  const breakdown = grouped
    .map((g) => {
      const cat = catById.get(g.categoryId);
      return {
        name: cat?.name ?? 'อื่นๆ',
        color: cat?.color ?? '#94a3b8',
        value: g._sum.amount?.toNumber() ?? 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  const top = breakdown[0];

  let overBudgetCount = 0;
  for (const b of budgets) {
    const spent = spentByCategory.get(b.categoryId) ?? 0;
    if (spent > b.amount.toNumber()) overBudgetCount += 1;
  }

  const now = new Date();

  // Debts approaching their monthly due day (skip fully-paid debts).
  const upcomingDues: UpcomingDue[] = debtsDue
    .filter((d) => d.dueDay != null && d._count.payments < d.termMonths)
    .map((d) => {
      const due = nextDueDate(d.dueDay as number, now);
      return {
        id: d.id,
        name: d.name,
        dueDate: due.toISOString(),
        daysUntil: daysUntil(due, now),
        minPayment: d.minPayment ? d.minPayment.toString() : null,
      };
    })
    .filter((d) => d.daysUntil <= DUE_SOON_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

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
    categories,
    overBudgetCount,
    upcomingDues,
  };
}
