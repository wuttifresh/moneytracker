import { prisma } from '@/lib/prisma';

export type DebtDTO = {
  id: string;
  name: string;
  debtType: string | null;
  lender: string | null;
  principal: string;
  balance: string | null;
  annualRate: string;
  minPayment: string | null;
  dueDay: number | null;
  termMonths: number;
  startDate: string;
  endDate: string | null;
  note: string | null;
};

export type DebtWithProgress = DebtDTO & { paidCount: number };
export type DebtDetail = DebtDTO & { payments: Record<number, string> };

type Dec = { toString(): string };

type DebtRow = {
  id: string;
  name: string;
  debtType: string | null;
  lender: string | null;
  principal: Dec;
  balance: Dec | null;
  annualRate: Dec;
  minPayment: Dec | null;
  dueDay: number | null;
  termMonths: number;
  startDate: Date;
  endDate: Date | null;
  note: string | null;
};

function toDTO(d: DebtRow): DebtDTO {
  return {
    id: d.id,
    name: d.name,
    debtType: d.debtType,
    lender: d.lender,
    principal: d.principal.toString(),
    balance: d.balance ? d.balance.toString() : null,
    annualRate: d.annualRate.toString(),
    minPayment: d.minPayment ? d.minPayment.toString() : null,
    dueDay: d.dueDay,
    termMonths: d.termMonths,
    startDate: d.startDate.toISOString(),
    endDate: d.endDate ? d.endDate.toISOString() : null,
    note: d.note,
  };
}

export async function listDebts(userId: string): Promise<DebtWithProgress[]> {
  const rows = await prisma.debt.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { payments: true } } },
  });
  return rows.map((d) => ({ ...toDTO(d), paidCount: d._count.payments }));
}

export async function getDebt(
  userId: string,
  id: string,
): Promise<DebtDetail | null> {
  const d = await prisma.debt.findFirst({
    where: { id, userId, deletedAt: null },
    include: { payments: { select: { installmentNo: true, amount: true } } },
  });
  if (!d) return null;
  const payments: Record<number, string> = {};
  for (const p of d.payments) payments[p.installmentNo] = p.amount.toString();
  return { ...toDTO(d), payments };
}
