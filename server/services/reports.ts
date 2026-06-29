import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const MONTH_LABELS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

export type MonthlyPoint = {
  month: string;
  income: number;
  expense: number;
};

export type YearlyReport = {
  year: number;
  months: MonthlyPoint[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  breakdown: { name: string; value: number; color: string }[];
  hasData: boolean;
};

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export async function getYearlyReport(
  userId: string,
  year: number,
): Promise<YearlyReport> {
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const rows = await prisma.transaction.findMany({
    where: { userId, deletedAt: null, date: { gte: start, lt: end } },
    select: {
      type: true,
      amount: true,
      date: true,
      category: { select: { name: true, color: true } },
    },
  });

  const income = Array.from({ length: 12 }, () => D(0));
  const expense = Array.from({ length: 12 }, () => D(0));
  const byCategory = new Map<string, { value: Prisma.Decimal; color: string }>();

  for (const r of rows) {
    const m = r.date.getMonth();
    if (r.type === 'income') {
      income[m] = (income[m] ?? D(0)).plus(r.amount);
    } else {
      expense[m] = (expense[m] ?? D(0)).plus(r.amount);
      const key = r.category.name;
      const cur = byCategory.get(key);
      byCategory.set(key, {
        value: (cur?.value ?? D(0)).plus(r.amount),
        color: r.category.color ?? '#94a3b8',
      });
    }
  }

  const months: MonthlyPoint[] = MONTH_LABELS.map((label, i) => ({
    month: label,
    income: (income[i] ?? D(0)).toNumber(),
    expense: (expense[i] ?? D(0)).toNumber(),
  }));

  const totalIncome = income.reduce((s, d) => s.plus(d), D(0));
  const totalExpense = expense.reduce((s, d) => s.plus(d), D(0));

  const breakdown = [...byCategory.entries()]
    .map(([name, v]) => ({ name, value: v.value.toNumber(), color: v.color }))
    .sort((a, b) => b.value - a.value);

  return {
    year,
    months,
    totalIncome: totalIncome.toNumber(),
    totalExpense: totalExpense.toNumber(),
    balance: totalIncome.minus(totalExpense).toNumber(),
    breakdown,
    hasData: rows.length > 0,
  };
}
