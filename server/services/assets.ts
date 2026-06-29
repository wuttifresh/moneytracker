import { prisma } from '@/lib/prisma';
import { computeDepreciation } from '@/lib/depreciation';

export type AssetDTO = {
  id: string;
  name: string;
  kind: string | null;
  purchaseValue: string;
  salvageValue: string;
  purchaseDate: string;
  usefulLifeYears: number | null;
  note: string | null;
  currentValue: number;
  accumulatedDepreciation: number;
  annualDepreciation: number;
};

export type AssetSummary = {
  assets: AssetDTO[];
  totalPurchase: number;
  totalCurrent: number;
  totalDepreciation: number;
};

export async function listAssets(userId: string): Promise<AssetSummary> {
  const rows = await prisma.asset.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  let totalPurchase = 0;
  let totalCurrent = 0;

  const assets: AssetDTO[] = rows.map((r) => {
    const purchase = Number(r.purchaseValue);
    const dep = computeDepreciation(
      purchase,
      Number(r.salvageValue),
      r.usefulLifeYears,
      r.purchaseDate,
    );
    totalPurchase += purchase;
    totalCurrent += dep.current;
    return {
      id: r.id,
      name: r.name,
      kind: r.kind,
      purchaseValue: r.purchaseValue.toString(),
      salvageValue: r.salvageValue.toString(),
      purchaseDate: r.purchaseDate.toISOString(),
      usefulLifeYears: r.usefulLifeYears,
      note: r.note,
      currentValue: dep.current,
      accumulatedDepreciation: dep.accumulated,
      annualDepreciation: dep.annual,
    };
  });

  return {
    assets,
    totalPurchase: Math.round(totalPurchase * 100) / 100,
    totalCurrent: Math.round(totalCurrent * 100) / 100,
    totalDepreciation: Math.round((totalPurchase - totalCurrent) * 100) / 100,
  };
}
