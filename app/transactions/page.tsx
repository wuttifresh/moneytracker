import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { MonthFilter } from '@/components/transactions/month-filter';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { TransactionList } from '@/components/transactions/transaction-list';
import { auth } from '@/auth';
import {
  ensureDefaultCategories,
  getCategories,
} from '@/server/services/categories';
import { listTransactions } from '@/server/services/transactions';
import { formatTHB } from '@/lib/money';

type SearchParams = {
  year?: string;
  month?: string;
  type?: string;
  categoryId?: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  await ensureDefaultCategories(userId);

  const now = new Date();
  const year = Number(searchParams.year) || now.getFullYear();
  const month = Number(searchParams.month) || now.getMonth() + 1;
  const type =
    searchParams.type === 'income' || searchParams.type === 'expense'
      ? searchParams.type
      : undefined;
  const categoryId = searchParams.categoryId || undefined;

  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    listTransactions(userId, { year, month, type, categoryId }),
  ]);

  // Display-only totals for the current filter (amounts already rounded to 2dp).
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <AppShell title="รายรับ-รายจ่าย">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <MonthFilter
            year={year}
            month={month}
            type={type ?? ''}
            categoryId={categoryId ?? ''}
            categories={categories}
          />
          <div className="flex items-center gap-2">
            <Link
              href="/categories"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              หมวดหมู่
            </Link>
            <TransactionModal categories={categories} />
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span>
            รายรับ{' '}
            <b className="tabular-nums text-income">{formatTHB(income)}</b>
          </span>
          <span>
            รายจ่าย{' '}
            <b className="tabular-nums text-expense">{formatTHB(expense)}</b>
          </span>
          <span className="ml-auto text-muted-foreground">
            {transactions.length} รายการ
          </span>
        </div>

        <TransactionList transactions={transactions} categories={categories} />
      </div>
    </AppShell>
  );
}
