import { prisma } from '@/lib/prisma';

export const CREDIT_CARD_TYPE = 'บัตรเครดิต';

export type DebtDTO = {
  id: string;
  name: string;
  debtType: string | null;
  lender: string | null;
  principal: string;
  balance: string | null;
  annualRate: string | null;
  minPayment: string | null;
  dueDay: number | null;
  termMonths: number | null;
  startDate: string;
  endDate: string | null;
  note: string | null;
};

export type DebtStatementDTO = {
  id: string;
  statementMonth: string;
  fullBalance: string;
  minPayment: string;
  dueDate: string | null;
  note: string | null;
};

export type DebtWithProgress = DebtDTO & {
  paidCount: number;
  latestStatement: DebtStatementDTO | null;
  previousStatement: DebtStatementDTO | null;
};
export type DebtDetail = DebtDTO & {
  paidInstallments: number[];
  statements: DebtStatementDTO[];
};

type Dec = { toString(): string };

type DebtRow = {
  id: string;
  name: string;
  debtType: string | null;
  lender: string | null;
  principal: Dec;
  balance: Dec | null;
  annualRate: Dec | null;
  minPayment: Dec | null;
  dueDay: number | null;
  termMonths: number | null;
  startDate: Date;
  endDate: Date | null;
  note: string | null;
};

type DebtStatementRow = {
  id: string;
  statementMonth: Date;
  fullBalance: Dec;
  minPayment: Dec;
  dueDate: Date | null;
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
    annualRate: d.annualRate ? d.annualRate.toString() : null,
    minPayment: d.minPayment ? d.minPayment.toString() : null,
    dueDay: d.dueDay,
    termMonths: d.termMonths,
    startDate: d.startDate.toISOString(),
    endDate: d.endDate ? d.endDate.toISOString() : null,
    note: d.note,
  };
}

function toStatementDTO(s: DebtStatementRow): DebtStatementDTO {
  return {
    id: s.id,
    statementMonth: s.statementMonth.toISOString(),
    fullBalance: s.fullBalance.toString(),
    minPayment: s.minPayment.toString(),
    dueDate: s.dueDate ? s.dueDate.toISOString() : null,
    note: s.note,
  };
}

export async function listDebts(userId: string): Promise<DebtWithProgress[]> {
  const rows = await prisma.debt.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { payments: true } },
      // Latest two statements only — enough to show the current balance and
      // the trend vs. the previous billing cycle without loading full history.
      statements: { orderBy: { statementMonth: 'desc' }, take: 2 },
    },
  });
  return rows.map((d) => ({
    ...toDTO(d),
    paidCount: d._count.payments,
    latestStatement: d.statements[0] ? toStatementDTO(d.statements[0]) : null,
    previousStatement: d.statements[1] ? toStatementDTO(d.statements[1]) : null,
  }));
}

export async function getDebt(
  userId: string,
  id: string,
): Promise<DebtDetail | null> {
  const d = await prisma.debt.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      payments: { select: { installmentNo: true } },
      statements: { orderBy: { statementMonth: 'desc' } },
    },
  });
  if (!d) return null;
  return {
    ...toDTO(d),
    paidInstallments: d.payments.map((p) => p.installmentNo),
    statements: d.statements.map(toStatementDTO),
  };
}
