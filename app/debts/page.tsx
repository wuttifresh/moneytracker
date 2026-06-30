import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Landmark, TrendingDown, CalendarClock } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { DebtModal } from '@/components/debts/debt-modal';
import { DeleteDebtButton } from '@/components/debts/delete-debt-button';
import { DueReminder } from '@/components/debts/due-reminder';
import { getSession } from '@/lib/session';
import { listDebts } from '@/server/services/debts';
import type { UpcomingDue } from '@/server/services/dashboard';
import { buildSchedule } from '@/lib/amortization';
import {
  nextDueDate,
  daysUntil,
  dueRelativeText,
  DUE_SOON_DAYS,
} from '@/lib/debt-due';
import { formatTHB } from '@/lib/money';

export default async function DebtsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const debts = await listDebts(session.user.id);
  const now = new Date();

  const computed = debts.map((d) => {
    const schedule = buildSchedule(
      Number(d.principal),
      Number(d.annualRate),
      d.termMonths,
    );
    const isPaidOff = d.paidCount >= d.termMonths;
    const due =
      d.dueDay != null && !isPaidOff ? nextDueDate(d.dueDay, now) : null;
    return {
      debt: d,
      schedule,
      due,
      dueIn: due ? daysUntil(due, now) : null,
    };
  });

  const upcomingDues: UpcomingDue[] = computed
    .filter((c) => c.due != null && (c.dueIn as number) <= DUE_SOON_DAYS)
    .sort((a, b) => (a.dueIn as number) - (b.dueIn as number))
    .map((c) => ({
      id: c.debt.id,
      name: c.debt.name,
      dueDate: (c.due as Date).toISOString(),
      daysUntil: c.dueIn as number,
      minPayment: c.debt.minPayment,
    }));

  const totalPrincipal = computed.reduce(
    (s, c) => s + Number(c.debt.principal),
    0,
  );
  const totalMonthly = computed.reduce((s, c) => s + c.schedule.monthly, 0);
  const totalInterest = computed.reduce(
    (s, c) => s + c.schedule.totalInterest,
    0,
  );

  const cards = [
    { label: 'ยอดหนี้รวม', value: totalPrincipal, icon: Landmark },
    { label: 'ผ่อนรวม/เดือน', value: totalMonthly, icon: CalendarClock },
    { label: 'ดอกเบี้ยรวมทั้งสัญญา', value: totalInterest, icon: TrendingDown },
  ];

  return (
    <AppShell title="หนี้สิน">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            ภาพรวมหนี้และตารางตัดชำระ
          </p>
          <DebtModal />
        </div>

        <DueReminder dues={upcomingDues} />

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
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {formatTHB(c.value)}
                </p>
              </div>
            );
          })}
        </section>

        {computed.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-14 text-center">
            <Landmark className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีรายการหนี้ — เพิ่มได้จากปุ่ม “เพิ่มหนี้”
            </p>
          </div>
        ) : (
          <section className="grid gap-4 md:grid-cols-2">
            {computed.map(({ debt, schedule, dueIn }) => (
              <div
                key={debt.id}
                className="rounded-lg border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/debts/${debt.id}`}
                        className="font-semibold hover:underline"
                      >
                        {debt.name}
                      </Link>
                      {dueIn != null && dueIn <= DUE_SOON_DAYS && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <CalendarClock className="h-3 w-3" />
                          {dueRelativeText(dueIn)}
                        </span>
                      )}
                    </div>
                    {(debt.debtType || debt.lender) && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[debt.debtType, debt.lender]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center">
                    <DebtModal debt={debt} />
                    <DeleteDebtButton id={debt.id} />
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1.5 text-sm">
                  <dt className="text-muted-foreground">ยอดเริ่มต้น</dt>
                  <dd className="text-right tabular-nums">
                    {formatTHB(debt.principal)}
                  </dd>
                  {debt.balance != null && (
                    <>
                      <dt className="text-muted-foreground">ยอดคงเหลือ</dt>
                      <dd className="text-right tabular-nums">
                        {formatTHB(debt.balance)}
                      </dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">ดอกเบี้ย</dt>
                  <dd className="text-right tabular-nums">
                    {debt.annualRate}%/ปี
                  </dd>
                  <dt className="text-muted-foreground">ผ่อน/เดือน</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {formatTHB(schedule.monthly)}
                  </dd>
                  <dt className="text-muted-foreground">จ่ายแล้ว</dt>
                  <dd className="text-right tabular-nums">
                    {debt.paidCount}/{debt.termMonths} งวด
                  </dd>
                  {debt.dueDay != null && (
                    <>
                      <dt className="text-muted-foreground">วันครบกำหนด</dt>
                      <dd className="text-right tabular-nums">
                        ทุกวันที่ {debt.dueDay}
                      </dd>
                    </>
                  )}
                </dl>
                <Link
                  href={`/debts/${debt.id}`}
                  className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
                >
                  ดูตารางตัดชำระ →
                </Link>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
