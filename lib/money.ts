const THB = new Intl.NumberFormat('th-TH', {
  style: 'currency',
  currency: 'THB',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PLAIN = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Money is stored as Prisma Decimal and transported as a decimal string.
 * These formatters are for DISPLAY only — never do arithmetic on the result.
 */
export function formatTHB(value: number | string): string {
  return THB.format(typeof value === 'string' ? Number(value) : value);
}

export function formatAmount(value: number | string): string {
  return PLAIN.format(typeof value === 'string' ? Number(value) : value);
}
