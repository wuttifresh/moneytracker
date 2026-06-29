import { prisma } from '@/lib/prisma';

export type DebtDTO = {
  id: string;
  name: string;
  principal: string;
  annualRate: string;
  termMonths: number;
  startDate: string;
  note: string | null;
};

export type DebtWithProgress = DebtDTO & { paidCount: number };
export type DebtDetail = DebtDTO & { paidInstallments: number[] };

type DebtRow = {
  id: string;
  name: string;
  principal: { toString(): string };
  annualRate: { toString(): string };
  termMonths: number;
  startDate: Date;
  note: string | null;
};

function toDTO(d: DebtRow): DebtDTO {
  return {
    id: d.id,
    name: d.name,
    principal: d.principal.toString(),
    annualRate: d.annualRate.toString(),
    termMonths: d.termMonths,
    startDate: d.startDate.toISOString(),
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
    include: { payments: { select: { installmentNo: true } } },
  });
  if (!d) return null;
  return {
    ...toDTO(d),
    paidInstallments: d.payments.map((p) => p.installmentNo),
  };
}
