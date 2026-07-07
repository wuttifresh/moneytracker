'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, X } from 'lucide-react';
import {
  recordInstallmentPayment,
  removeInstallmentPayment,
} from '@/server/actions/debts';
import { formatAmount } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { ScheduleRow } from '@/lib/amortization';

/**
 * Lets the user note the actual amount paid for a given month — e.g. the
 * plan says 6,500 but they really paid 7,637 in August and 5,937 in
 * September. The plan's calculated payment is only used as the starting
 * value when recording a new entry.
 */
function PaymentCell({
  debtId,
  no,
  scheduledAmount,
  paidAmount,
}: {
  debtId: string;
  no: number;
  scheduledAmount: number;
  paidAmount: string | undefined;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const paid = paidAmount !== undefined;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setValue(paidAmount ?? scheduledAmount.toFixed(2));
    setError(null);
    setEditing(true);
  }

  function save() {
    const amount = value.trim();
    start(async () => {
      const res = await recordInstallmentPayment(debtId, no, amount);
      if (res?.formError) {
        setError(res.formError);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    start(async () => {
      await removeInstallmentPayment(debtId, no);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') setEditing(false);
            }}
            disabled={pending}
            className="w-24 rounded-md border border-border bg-background px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            aria-label="บันทึกยอด"
            disabled={pending}
            onClick={save}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-income bg-income text-white disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="ยกเลิก"
            disabled={pending}
            onClick={() => setEditing(false)}
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-secondary disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <p className="text-xs text-expense">{error}</p>}
      </div>
    );
  }

  if (paid) {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <span className="font-medium tabular-nums">
          {formatAmount(paidAmount)}
        </span>
        <button
          type="button"
          aria-label="แก้ไขยอด"
          disabled={pending}
          onClick={startEdit}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="ยกเลิกการจ่าย"
          disabled={pending}
          onClick={remove}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={startEdit}
        className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
      >
        + บันทึกยอด
      </button>
    </div>
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
  payments,
}: {
  debtId: string;
  rows: ScheduleRow[];
  startDate: string;
  payments: Record<number, string>;
}) {
  const start = new Date(startDate);

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-3 font-medium">งวด</th>
            <th className="p-3 font-medium">เดือน</th>
            <th className="p-3 text-right font-medium">ค่างวด (แผน)</th>
            <th className="hidden p-3 text-right font-medium sm:table-cell">
              เงินต้น
            </th>
            <th className="hidden p-3 text-right font-medium sm:table-cell">
              ดอกเบี้ย
            </th>
            <th className="p-3 text-right font-medium">คงเหลือ</th>
            <th className="p-3 text-right font-medium">ยอดที่จ่ายจริง</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const paidAmount = payments[r.no];
            const paid = paidAmount !== undefined;
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
                <td className="p-3 text-right tabular-nums text-muted-foreground">
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
                  <PaymentCell
                    debtId={debtId}
                    no={r.no}
                    scheduledAmount={r.payment}
                    paidAmount={paidAmount}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
