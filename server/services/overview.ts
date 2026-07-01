import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPortfolio } from './investments';
import { listAssets } from './assets';
import { getYearlyReport } from './reports';
import { nextDueDate, daysUntil, DUE_SOON_DAYS } from '@/lib/debt-due';

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export type UpcomingPayment = {
  id: string;
  name: string;
  dueDate: string;
  daysUntil: number;
  amount: number | null;
};

export type HealthTone = 'good' | 'warn' | 'bad';

export type FinancialOverview = {
  totalAssets: number;
  savings: number;
  stocks: number;
  funds: number;
  assetsValue: number;
  debtRemaining: number;
  netWorth: number;
  incomeThisMonth: number;
  score: number;
  grade: string;
  health: { title: string; desc: string; tone: HealthTone };
  monthlyIncome: { month: string; value: number }[];
  hasIncomeData: boolean;
  upcoming: UpcomingPayment[];
};

const FUND_RE = /กองทุน|fund|rmf|ssf|mutual/i;

function gradeFor(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/** Everything the financial-overview dashboard needs, in one batched read. */
export async function getFinancialOverview(
  userId: string,
): Promise<FinancialOverview> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  const [portfolio, assetSummary, savingsAgg, report, debts] = await Promise.all(
    [
      getPortfolio(userId),
      listAssets(userId),
      prisma.savingGoal.aggregate({
        _sum: { currentAmount: true },
        where: { userId, deletedAt: null },
      }),
      getYearlyReport(userId, year),
      prisma.debt.findMany({
        where: { userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          principal: true,
          balance: true,
          minPayment: true,
          dueDay: true,
          termMonths: true,
          _count: { select: { payments: true } },
        },
      }),
    ],
  );

  // Split investments into stock-like vs fund-like (Decimal-safe).
  let stocks = D(0);
  let funds = D(0);
  for (const h of portfolio.holdings) {
    if (h.kind && FUND_RE.test(h.kind)) funds = funds.plus(h.value);
    else stocks = stocks.plus(h.value);
  }

  const savings = savingsAgg._sum.currentAmount ?? D(0);
  const assetsValue = D(assetSummary.totalCurrent);

  // Outstanding debt: prefer the entered balance, else the principal.
  let debtRemaining = D(0);
  for (const d of debts) {
    debtRemaining = debtRemaining.plus(d.balance ?? d.principal);
  }

  const totalAssets = savings.plus(stocks).plus(funds).plus(assetsValue);
  const netWorth = totalAssets.minus(debtRemaining);

  const totalAssetsN = totalAssets.toNumber();
  const debtRemainingN = debtRemaining.toNumber();
  const savingsN = savings.toNumber();
  const stocksN = stocks.toNumber();
  const fundsN = funds.toNumber();
  const incomeThisMonth = report.months[month]?.income ?? 0;

  // Upcoming debt payments within the reminder window (not fully paid).
  const upcoming: UpcomingPayment[] = debts
    .filter((d) => d.dueDay != null && d._count.payments < d.termMonths)
    .map((d) => {
      const due = nextDueDate(d.dueDay as number, now);
      return {
        id: d.id,
        name: d.name,
        dueDate: due.toISOString(),
        daysUntil: daysUntil(due, now),
        amount: d.minPayment ? d.minPayment.toNumber() : null,
      };
    })
    .filter((u) => u.daysUntil <= DUE_SOON_DAYS)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  // Heuristic "financial health" score (a debt-free empty account starts at 80).
  let score = 60;
  const debtRatio = totalAssetsN > 0 ? debtRemainingN / totalAssetsN : 0;
  if (debtRemainingN <= 0) score += 20;
  else score -= Math.min(40, Math.round(debtRatio * 40));
  if (savingsN > 0) score += 5;
  if (incomeThisMonth > 0) score += 5;
  if (stocksN + fundsN > 0) score += 5;
  if (assetSummary.totalCurrent > 0) score += 5;
  score = Math.max(0, Math.min(100, score));

  let health: FinancialOverview['health'];
  if (debtRemainingN <= 0) {
    health = { title: 'ไม่มีหนี้สิน', desc: 'ยอดเยี่ยม! คุณปลอดหนี้', tone: 'good' };
  } else if (debtRatio > 0.6) {
    health = {
      title: 'หนี้สินค่อนข้างสูง',
      desc: 'ลองวางแผนลดหนี้เพื่อสุขภาพการเงินที่ดีขึ้น',
      tone: 'bad',
    };
  } else {
    health = {
      title: 'การเงินอยู่ในเกณฑ์ดี',
      desc: 'รักษาระดับการออมและควบคุมหนี้ต่อไป',
      tone: 'warn',
    };
  }

  return {
    totalAssets: totalAssetsN,
    savings: savingsN,
    stocks: stocksN,
    funds: fundsN,
    assetsValue: assetSummary.totalCurrent,
    debtRemaining: debtRemainingN,
    netWorth: netWorth.toNumber(),
    incomeThisMonth,
    score,
    grade: gradeFor(score),
    health,
    monthlyIncome: report.months.map((m) => ({
      month: m.month,
      value: m.income,
    })),
    hasIncomeData: report.months.some((m) => m.income > 0),
    upcoming,
  };
}
