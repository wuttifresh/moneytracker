import { redirect } from 'next/navigation';
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { YearSelect } from '@/components/reports/year-select';
import { TrendChart } from '@/components/reports/trend-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { auth } from '@/auth';
import { getYearlyReport } from '@/server/services/reports';
import { formatTHB } from '@/lib/money';
import { cn } from '@/lib/utils';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const year = Number(searchParams.year) || new Date().getFullYear();
  const report = await getYearlyReport(session.user.id, year);

  const cards = [
    {
      label: 'รายรับรวมทั้งปี',
      value: report.totalIncome,
      icon: TrendingUp,
      tone: 'text-income',
    },
    {
      label: 'รายจ่ายรวมทั้งปี',
      value: report.totalExpense,
      icon: TrendingDown,
      tone: 'text-expense',
    },
    {
      label: 'คงเหลือ',
      value: report.balance,
      icon: Wallet,
      tone: report.balance >= 0 ? 'text-income' : 'text-expense',
    },
  ];

  return (
    <AppShell title="รายงาน">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <YearSelect year={year} />
          <a
            href={`/api/reports/export?year=${year}`}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <Download className="h-4 w-4" />
            ดาวน์โหลด CSV
          </a>
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
                  <Icon className={cn('h-5 w-5', c.tone)} />
                </div>
                <p className={cn('mt-2 text-2xl font-semibold', c.tone)}>
                  {formatTHB(c.value)}
                </p>
              </div>
            );
          })}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">แนวโน้มรายเดือน</h2>
          {report.hasData ? (
            <TrendChart data={report.months} />
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
              ยังไม่มีข้อมูลในปีนี้
            </div>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">รายจ่ายตามหมวดหมู่ (ทั้งปี)</h2>
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <DonutChart data={report.breakdown} emptyText="ยังไม่มีรายจ่าย" />
            <ul className="space-y-2">
              {report.breakdown.length === 0 && (
                <li className="text-sm text-muted-foreground">—</li>
              )}
              {report.breakdown.slice(0, 8).map((b) => (
                <li key={b.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="flex-1 truncate">{b.name}</span>
                  <span className="font-medium tabular-nums">
                    {formatTHB(b.value)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
