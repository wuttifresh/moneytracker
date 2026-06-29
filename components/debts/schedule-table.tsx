'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toggleInstallment } from '@/server/actions/debts';
import { formatAmount } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ScheduleRow } from '@/lib/amortization';

function PaidToggle({
  debtId,
  no,
  paid,
}: {
  debtId: string;
  no: number;
  paid: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={paid ? 'ยกเลิกการชำระ' : 'ทำเครื่องหมายชำระแล้ว'}
      aria-pressed={paid}
      onClick={() =>
        start(async () => {
          await toggleInstallment(debtId, no);
          router.refresh();
        })
      }
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md border transition-colors disabled:opacity-50',
        paid
          ? 'border-income bg-income text-white'
          : 'border-border text-transparent hover:bg-secondary',
      )}
    >
      <Check className="h-4 w-4" />
    </button>
  );
}

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  month: 'short',
  year: 'numeric',
});

export function ScheduleTable({
  debtId,
  rows,
  startDate,
  paidInstallments,
}: {
  debtId: string;
  rows: ScheduleRow[];
  startDate: string;
  paidInstallments: number[];
}) {
  const paidSet = new Set(paidInstallments);
  const start = new Date(startDate);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-3 font-medium">งวด</th>
            <th className="p-3 font-medium">เดือน</th>
            <th className="p-3 text-right font-medium">ค่างวด</th>
            <th className="hidden p-3 text-right font-medium sm:table-cell">
              เงินต้น
            </th>
            <th className="hidden p-3 text-right font-medium sm:table-cell">
              ดอกเบี้ย
            </th>
            <th className="p-3 text-right font-medium">คงเหลือ</th>
            <th className="p-3 text-center font-medium">จ่าย</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const paid = paidSet.has(r.no);
            const month = new Date(
              start.getFullYear(),
              start.getMonth() + (r.no - 1),
              1,
            );
            return (
              <tr
                key={r.no}
                className={cn(
                  'border-b border-border last:border-0',
                  paid && 'bg-income/5',
                )}
              >
                <td className="p-3 text-muted-foreground">{r.no}</td>
                <td className="p-3">{dateFmt.format(month)}</td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {formatAmount(r.payment)}
                </td>
                <td className="hidden p-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {formatAmount(r.principal)}
                </td>
                <td className="hidden p-3 text-right tabular-nums text-expense sm:table-cell">
                  {formatAmount(r.interest)}
                </td>
                <td className="p-3 text-right tabular-nums text-muted-foreground">
                  {formatAmount(r.balance)}
                </td>
                <td className="p-3">
                  <div className="flex justify-center">
                    <PaidToggle debtId={debtId} no={r.no} paid={paid} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
