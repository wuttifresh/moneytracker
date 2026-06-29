export type ScheduleRow = {
  no: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type Schedule = {
  monthly: number;
  totalPayment: number;
  totalInterest: number;
  rows: ScheduleRow[];
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Standard fixed-payment amortization (display projection only — authoritative
 * inputs are stored as Decimal). `annualRatePct` is a percent, e.g. 5.5.
 */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  termMonths: number,
): Schedule {
  const n = Math.max(1, Math.floor(termMonths));
  const r = annualRatePct / 100 / 12;
  const monthly =
    r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

  const rows: ScheduleRow[] = [];
  let balance = principal;
  let totalInterest = 0;
  let totalPayment = 0;

  for (let i = 1; i <= n; i++) {
    const interest = balance * r;
    let principalPortion = monthly - interest;
    let payment = monthly;
    if (i === n) {
      // Final installment clears any rounding remainder.
      principalPortion = balance;
      payment = balance + interest;
    }
    balance = Math.max(0, balance - principalPortion);
    totalInterest += interest;
    totalPayment += payment;
    rows.push({
      no: i,
      payment: round2(payment),
      principal: round2(principalPortion),
      interest: round2(interest),
      balance: round2(balance),
    });
  }

  return {
    monthly: round2(monthly),
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalInterest),
    rows,
  };
}
