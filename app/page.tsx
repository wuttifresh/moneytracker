import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Wallet, CalendarDays, Crown } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { TransactionList } from '@/components/transactions/transaction-list';
import { ExpenseChart } from '@/components/transactions/expense-chart';
import { auth } from '@/auth';
import { ensureDefaultCategories, getCategories } from '@/server/services/categories';
import { getDashboardData } from '@/server/services/transactions';
import { formatTHB } from '@/lib/money';

const monthName = new Intl.DateTimeFormat('th-TH', { month: 'long' });

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [data, categories] = await Promise.all([
    getDashboardData(userId, year, month),
    getCategories(userId),
  ]);

  const cards = [
    {
      label: 'รายรับ',
      value: data.income,
      icon: TrendingUp,
      tone: 'text-income',
    },
    {
      label: 'รายจ่าย',
      value: data.expense,
      icon: TrendingDown,
      tone: 'text-expense',
    },
    {
      label: 'คงเหลือ',
      value: data.balance,
      icon: Wallet,
      tone: data.balance >= 0 ? 'text-income' : 'text-expense',
    },
  ];

  return (
    <AppShell title="ภาพรวม">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            ประจำเดือน{monthName.format(now)} {year + 543}
          </p>
          <TransactionModal categories={categories} />
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <Icon className={`h-5 w-5 ${c.tone}`} />
                </div>
                <p className={`mt-2 text-2xl font-semibold ${c.tone}`}>
                  {formatTHB(c.value)}
                </p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
            <h2 className="mb-3 font-semibold">รายจ่ายตามหมวดหมู่</h2>
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <ExpenseChart data={data.breakdown} />
              <ul className="space-y-2">
                {data.breakdown.length === 0 && (
                  <li className="text-sm text-muted-foreground">—</li>
                )}
                {data.breakdown.slice(0, 6).map((b) => (
                  <li key={b.name} className="flex items-center gap-2 text-sm">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="text-muted-foreground">
                      {data.expense > 0
                        ? Math.round((b.value / data.expense) * 100)
                        : 0}
                      %
                    </span>
                    <span className="w-24 text-right font-medium tabular-nums">
                      {formatTHB(b.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                เฉลี่ยรายจ่ายต่อวัน
              </div>
              <p className="mt-2 text-xl font-semibold">
                {formatTHB(data.avgExpensePerDay)}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Crown className="h-4 w-4" />
                หมวดจ่ายสูงสุด
              </div>
              {data.topCategory ? (
                <>
                  <p className="mt-2 text-xl font-semibold">
                    {data.topCategory.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTHB(data.topCategory.amount)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">รายการล่าสุด</h2>
            <Link
              href="/transactions"
              className="text-sm font-medium text-primary hover:underline"
            >
              ดูทั้งหมด
            </Link>
          </div>
          <TransactionList transactions={data.recent} categories={categories} />
        </section>
      </div>
    </AppShell>
  );
}
