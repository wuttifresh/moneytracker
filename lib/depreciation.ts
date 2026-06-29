export type Depreciation = {
  annual: number;
  accumulated: number;
  current: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;
const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Straight-line depreciation (display projection from Decimal inputs).
 * usefulLifeYears null/<=0 means the asset does not depreciate.
 * Current value never drops below the salvage value.
 */
export function computeDepreciation(
  purchaseValue: number,
  salvageValue: number,
  usefulLifeYears: number | null,
  purchaseDate: Date,
  asOf: Date = new Date(),
): Depreciation {
  if (!usefulLifeYears || usefulLifeYears <= 0) {
    return { annual: 0, accumulated: 0, current: round2(purchaseValue) };
  }
  const depreciable = Math.max(0, purchaseValue - salvageValue);
  const annual = depreciable / usefulLifeYears;
  const yearsElapsed = Math.max(0, (asOf.getTime() - purchaseDate.getTime()) / MS_PER_YEAR);
  const accumulated = Math.min(annual * yearsElapsed, depreciable);
  const current = purchaseValue - accumulated;
  return {
    annual: round2(annual),
    accumulated: round2(accumulated),
    current: round2(current),
  };
}
