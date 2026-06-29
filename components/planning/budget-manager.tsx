'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryPill } from '@/components/transactions/category-pill';
import { setBudget } from '@/server/actions/planning';
import { formatTHB } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { BudgetRow } from '@/server/services/planning';

function Row({ row }: { row: BudgetRow }) {
  const [value, setValue] = useState(row.budget != null ? String(row.budget) : '');
  const [pending, start] = useTransition();
  const router = useRouter();

  function save() {
    start(async () => {
      await setBudget(row.categoryId, value);
      router.refresh();
    });
  }

  const pct = Math.min(100, row.pct);
  const barColor = row.over
    ? 'bg-expense'
    : row.pct >= 80
      ? 'bg-amber-500'
      : 'bg-income';

  return (
    <li className="space-y-2 p-3">
      <div className="flex items-center justify-between gap-3">
        <CategoryPill name={row.name} icon={row.icon} color={row.color} />
        <div className="flex items-center gap-2">
          <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
            ใช้ {formatTHB(row.spent)}
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="decimal"
            placeholder="ตั้งงบ"
            className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-right text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50"
          >
            บันทึก
          </button>
        </div>
      </div>
      {row.budget != null && (
        <div>
          <div className="h-2 overflow-hidden rounded bg-secondary">
            <div
              className={cn('h-full transition-all', barColor)}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-muted-foreground">
              {row.pct}% ของงบ {formatTHB(row.budget)}
            </span>
            {row.over && (
              <span className="font-medium text-expense">
                เกินงบ {formatTHB(row.spent - row.budget)}
              </span>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function BudgetManager({ rows }: { rows: BudgetRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        ยังไม่มีหมวดหมู่รายจ่าย
      </p>
    );
  }
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {rows.map((r) => (
        <Row key={r.categoryId} row={r} />
      ))}
    </ul>
  );
}
