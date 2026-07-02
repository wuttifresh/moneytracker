'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { deleteDebtStatement } from '@/server/actions/debt-statements';
import { formatTHB } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { DebtStatementDTO } from '@/server/services/debts';

const monthFmt = new Intl.DateTimeFormat('th-TH', {
  month: 'short',
  year: 'numeric',
});
const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });

function DeltaBadge({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.005) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        เท่าเดิม
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium',
        up ? 'text-expense' : 'text-income',
      )}
    >
      {up ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )}
      {up ? '+' : ''}
      {formatTHB(delta)}
    </span>
  );
}

function DeleteStatementButton({
  debtId,
  statementId,
}: {
  debtId: string;
  statementId: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบรอบบิลนี้"
      onClick={() => {
        if (!window.confirm('ต้องการลบรอบบิลนี้หรือไม่?')) return;
        start(async () => {
          await deleteDebtStatement(debtId, statementId);
          router.refresh();
        });
      }}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

/**
 * Revolving-balance history for a credit card debt: one row per billing
 * cycle, newest first, with the change vs. the previous cycle so a jump
 * caused by new spending is visible instead of looking like bad data entry.
 */
export function StatementTable({
  debtId,
  statements,
}: {
  debtId: string;
  statements: DebtStatementDTO[];
}) {
  if (statements.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        ยังไม่มีรอบบิล — กด “เพิ่มรอบบิล” ทุกครั้งที่ได้ใบแจ้งหนี้ใหม่
        เพื่อติดตามยอดหนี้ที่เปลี่ยนไป
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="p-3 font-medium">รอบบิล</th>
            <th className="p-3 text-right font-medium">ยอดเต็ม</th>
            <th className="p-3 text-right font-medium">เปลี่ยนแปลง</th>
            <th className="hidden p-3 text-right font-medium sm:table-cell">
              ขั้นต่ำ
            </th>
            <th className="hidden p-3 text-left font-medium sm:table-cell">
              ครบกำหนด
            </th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {statements.map((s, i) => {
            const older = statements[i + 1];
            const delta = older
              ? Number(s.fullBalance) - Number(older.fullBalance)
              : 0;
            return (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  {monthFmt.format(new Date(s.statementMonth))}
                  {s.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.note}
                    </p>
                  )}
                </td>
                <td className="p-3 text-right font-medium tabular-nums">
                  {formatTHB(s.fullBalance)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {older ? <DeltaBadge delta={delta} /> : '—'}
                </td>
                <td className="hidden p-3 text-right tabular-nums text-muted-foreground sm:table-cell">
                  {formatTHB(s.minPayment)}
                </td>
                <td className="hidden p-3 text-left tabular-nums text-muted-foreground sm:table-cell">
                  {s.dueDate ? dateFmt.format(new Date(s.dueDate)) : '—'}
                </td>
                <td className="p-3">
                  <div className="flex justify-end">
                    <DeleteStatementButton debtId={debtId} statementId={s.id} />
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
