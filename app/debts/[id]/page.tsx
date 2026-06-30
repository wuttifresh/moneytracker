import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { DebtModal } from '@/components/debts/debt-modal';
import { DeleteDebtButton } from '@/components/debts/delete-debt-button';
import { ScheduleTable } from '@/components/debts/schedule-table';
import { getSession } from '@/lib/session';
import { getDebt } from '@/server/services/debts';
import { buildSchedule } from '@/lib/amortization';
import { formatTHB } from '@/lib/money';

export default async function DebtDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const debt = await getDebt(session.user.id, params.id);
  if (!debt) notFound();

  const schedule = buildSchedule(
    Number(debt.principal),
    Number(debt.annualRate),
    debt.termMonths,
  );

  const summary = [
    { label: 'ยอดเงินต้น', value: formatTHB(debt.principal) },
    { label: 'ดอกเบี้ย', value: `${debt.annualRate}%/ปี` },
    { label: 'ผ่อน/เดือน', value: formatTHB(schedule.monthly) },
    { label: 'ดอกเบี้ยรวม', value: formatTHB(schedule.totalInterest) },
    { label: 'ยอดจ่ายทั้งหมด', value: formatTHB(schedule.totalPayment) },
    {
      label: 'จ่ายแล้ว',
      value: `${debt.paidInstallments.length}/${debt.termMonths} งวด`,
    },
  ];

  return (
    <AppShell title={debt.name}>
      <div className="space-y-5">
        <Link
          href="/debts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปหน้าหนี้สิน
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{debt.name}</h2>
            {debt.note && (
              <p className="mt-0.5 text-sm text-muted-foreground">{debt.note}</p>
            )}
          </div>
          <div className="flex items-center">
            <DebtModal debt={debt} />
            <DeleteDebtButton id={debt.id} redirectTo="/debts" />
          </div>
        </div>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {summary.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-semibold tabular-nums">{s.value}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-2 font-semibold">ตารางตัดชำระ</h3>
          <ScheduleTable
            debtId={debt.id}
            rows={schedule.rows}
            startDate={debt.startDate}
            paidInstallments={debt.paidInstallments}
          />
        </section>
      </div>
    </AppShell>
  );
}
