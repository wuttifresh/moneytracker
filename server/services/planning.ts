import { prisma } from '@/lib/prisma';
import { monthRange } from './transactions';

export type BudgetRow = {
  categoryId: string;
  name: string;
  icon: string | null;
  color: string | null;
  budget: number | null;
  spent: number;
  pct: number; // 0-100+ (of budget); 0 when no budget
  over: boolean;
};

export type BudgetOverview = {
  rows: BudgetRow[];
  totalBudget: number;
  totalSpent: number;
  overCount: number;
};

export async function getBudgetOverview(
  userId: string,
  year: number,
  month: number,
): Promise<BudgetOverview> {
  const { start, end } = monthRange(year, month);

  const [categories, budgets, grouped] = await Promise.all([
    prisma.category.findMany({
      where: { userId, deletedAt: null, type: 'expense' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, icon: true, color: true },
    }),
    prisma.budget.findMany({ where: { userId } }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, deletedAt: null, type: 'expense', date: { gte: start, lt: end } },
      _sum: { amount: true },
    }),
  ]);

  const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.amount.toNumber()]));
  const spentMap = new Map(
    grouped.map((g) => [g.categoryId, g._sum.amount?.toNumber() ?? 0]),
  );

  let totalBudget = 0;
  let totalSpent = 0;
  let overCount = 0;

  const rows: BudgetRow[] = categories.map((c) => {
    const budget = budgetMap.get(c.id) ?? null;
    const spent = spentMap.get(c.id) ?? 0;
    if (budget !== null) totalBudget += budget;
    totalSpent += spent;
    const over = budget !== null && spent > budget;
    if (over) overCount += 1;
    return {
      categoryId: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      budget,
      spent,
      pct: budget && budget > 0 ? Math.round((spent / budget) * 100) : 0,
      over,
    };
  });

  return {
    rows,
    totalBudget: Math.round(totalBudget * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    overCount,
  };
}

export type GoalDTO = {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  target: number;
  current: number;
  pct: number;
  deadline: string | null;
  note: string | null;
};

export async function getGoals(userId: string): Promise<GoalDTO[]> {
  const rows = await prisma.savingGoal.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((g) => {
    const target = g.targetAmount.toNumber();
    const current = g.currentAmount.toNumber();
    return {
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount.toString(),
      currentAmount: g.currentAmount.toString(),
      target,
      current,
      pct: target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0,
      deadline: g.deadline ? g.deadline.toISOString() : null,
      note: g.note,
    };
  });
}
