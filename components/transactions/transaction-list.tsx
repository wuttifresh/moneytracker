'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Inbox } from 'lucide-react';
import { CategoryPill } from './category-pill';
import { TransactionModal } from './transaction-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { deleteTransaction } from '@/server/actions/transactions';
import { formatTHB } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { TransactionDTO } from '@/server/services/transactions';
import type { CategoryDTO } from '@/server/services/categories';

const dateFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function DeleteButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบรายการ"
      onClick={() => {
        if (!window.confirm('ต้องการลบรายการนี้หรือไม่?')) return;
        start(async () => {
          await deleteTransaction(id);
          router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function TransactionList({
  transactions,
  categories,
}: {
  transactions: TransactionDTO[];
  categories: CategoryDTO[];
}) {
  if (transactions.length === 0) {
    return <EmptyState icon={Inbox} title="ยังไม่มีรายการในเดือนนี้" />;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center gap-3 p-3">
          <div className="min-w-0 flex-1">
            <CategoryPill
              name={t.category.name}
              icon={t.category.icon}
              color={t.category.color}
            />
            {t.note && (
              <p className="ml-11 mt-0.5 truncate text-xs text-muted-foreground">
                {t.note}
              </p>
            )}
          </div>
          <div className="text-right">
            <div
              className={cn(
                'font-semibold tabular-nums',
                t.type === 'income' ? 'text-income' : 'text-expense',
              )}
            >
              {t.type === 'income' ? '+' : '-'}
              {formatTHB(t.amount)}
            </div>
            <div className="text-xs text-muted-foreground">
              {dateFmt.format(new Date(t.date))}
            </div>
          </div>
          <div className="flex items-center">
            <TransactionModal categories={categories} transaction={t} />
            <DeleteButton id={t.id} />
          </div>
        </li>
      ))}
    </ul>
  );
}
