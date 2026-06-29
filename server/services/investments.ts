import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type InvestmentDTO = {
  id: string;
  name: string;
  kind: string | null;
  units: string;
  costPerUnit: string;
  currentPrice: string;
  note: string | null;
  cost: number; // display values (computed with Decimal, then formatted)
  value: number;
  gain: number;
  gainPct: number;
};

export type PortfolioSummary = {
  holdings: InvestmentDTO[];
  totalCost: number;
  totalValue: number;
  totalGain: number;
  totalGainPct: number;
};

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

export async function getPortfolio(userId: string): Promise<PortfolioSummary> {
  const rows = await prisma.investment.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  let totalCost = D(0);
  let totalValue = D(0);

  const holdings: InvestmentDTO[] = rows.map((r) => {
    // True decimal arithmetic (no float) for money math.
    const cost = r.units.times(r.costPerUnit);
    const value = r.units.times(r.currentPrice);
    const gain = value.minus(cost);
    const gainPct = cost.isZero()
      ? D(0)
      : gain.dividedBy(cost).times(100);

    totalCost = totalCost.plus(cost);
    totalValue = totalValue.plus(value);

    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      units: r.units.toString(),
      costPerUnit: r.costPerUnit.toString(),
      currentPrice: r.currentPrice.toString(),
      note: r.note,
      cost: cost.toNumber(),
      value: value.toNumber(),
      gain: gain.toNumber(),
      gainPct: gainPct.toNumber(),
    };
  });

  const totalGain = totalValue.minus(totalCost);
  const totalGainPct = totalCost.isZero()
    ? 0
    : totalGain.dividedBy(totalCost).times(100).toNumber();

  return {
    holdings,
    totalCost: totalCost.toNumber(),
    totalValue: totalValue.toNumber(),
    totalGain: totalGain.toNumber(),
    totalGainPct,
  };
}
