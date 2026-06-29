import { redirect } from 'next/navigation';
import { Wallet, Coins, TrendingUp } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { DonutChart } from '@/components/charts/donut-chart';
import { InvestmentModal } from '@/components/investments/investment-modal';
import { DeleteInvestmentButton } from '@/components/investments/delete-investment-button';
import { auth } from '@/auth';
import { getPortfolio } from '@/server/services/investments';
import { formatTHB } from '@/lib/money';
import { cn } from '@/lib/utils';

const PALETTE = [
  '#5b8cff',
  '#34d399',
  '#f472b6',
  '#fbbf24',
  '#22d3ee',
  '#a78bfa',
  '#fb923c',
  '#94a3b8',
];

function signClass(n: number) {
  return n >= 0 ? 'text-income' : 'text-expense';
}

function withSign(n: number) {
  return `${n >= 0 ? '+' : ''}${formatTHB(n)}`;
}

export default async function InvestmentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const portfolio = await getPortfolio(session.user.id);

  const allocation = portfolio.holdings
    .filter((h) => h.value > 0)
    .map((h, i) => ({
      name: h.name,
      value: h.value,
      color: PALETTE[i % PALETTE.length] as string,
    }));

  return (
    <AppShell title="การลงทุน">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">พอร์ตการลงทุนของคุณ</p>
          <InvestmentModal />
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">มูลค่าพอร์ต</p>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {formatTHB(portfolio.totalValue)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">ต้นทุนรวม</p>
              <Coins className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-semibold">
              {formatTHB(portfolio.totalCost)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">กำไร/ขาดทุน</p>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p
              className={cn(
                'mt-2 text-2xl font-semibold',
                signClass(portfolio.totalGain),
              )}
            >
              {withSign(portfolio.totalGain)}
            </p>
            <p className={cn('text-sm', signClass(portfolio.totalGain))}>
              {portfolio.totalGain >= 0 ? '+' : ''}
              {portfolio.totalGainPct.toFixed(2)}%
            </p>
          </div>
        </section>

        {portfolio.holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-14 text-center">
            <TrendingUp className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีสินทรัพย์ — เพิ่มได้จากปุ่ม “เพิ่มสินทรัพย์”
            </p>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-5 lg:col-span-1">
              <h2 className="mb-3 font-semibold">สัดส่วนพอร์ต</h2>
              <DonutChart data={allocation} emptyText="ยังไม่มีมูลค่า" />
            </div>

            <ul className="space-y-3 lg:col-span-2">
              {portfolio.holdings.map((h) => (
                <li
                  key={h.id}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{h.name}</span>
                        {h.kind && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            {h.kind}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {h.units} หน่วย · ทุน {formatTHB(h.costPerUnit)} ·
                        ปัจจุบัน {formatTHB(h.currentPrice)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <InvestmentModal investment={h} />
                      <DeleteInvestmentButton id={h.id} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <div className="text-sm text-muted-foreground">
                      มูลค่า{' '}
                      <span className="font-medium text-foreground tabular-nums">
                        {formatTHB(h.value)}
                      </span>
                    </div>
                    <div className={cn('text-right', signClass(h.gain))}>
                      <div className="font-semibold tabular-nums">
                        {withSign(h.gain)}
                      </div>
                      <div className="text-xs tabular-nums">
                        {h.gain >= 0 ? '+' : ''}
                        {h.gainPct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
