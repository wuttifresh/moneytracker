import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { DebtModal } from '@/components/debts/debt-modal';
import { DeleteDebtButton } from '@/components/debts/delete-debt-button';
import { ScheduleTable } from '@/components/debts/schedule-table';
import { StatementTable } from '@/components/debts/statement-table';
import { StatementModal } from '@/components/debts/statement-modal';
import { getSession } from '@/lib/session';
import { getDebt, CREDIT_CARD_TYPE } from '@/server/services/debts';
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

  const isCreditCard = debt.debtType === CREDIT_CARD_TYPE;
  const hasSchedule = !isCreditCard && debt.termMonths != null;
  const schedule = buildSchedule(
    Number(debt.principal),
    Number(debt.annualRate ?? 0),
    debt.termMonths ?? 0,
  );
  const latest = debt.statements[0] ?? null;

  const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium' });
  const summary = isCreditCard
    ? [
        {
          label: 'ยอดเต็มล่าสุด',
          value: latest ? formatTHB(latest.fullBalance) : '—',
        },
        {
          label: 'ขั้นต่ำล่าสุด',
          value: latest ? formatTHB(latest.minPayment) : '—',
        },
        latest
          ? {
              label: 'รอบบิลล่าสุด',
              value: new Intl.DateTimeFormat('th-TH', {
                month: 'short',
                year: 'numeric',
              }).format(new Date(latest.statementMonth)),
            }
          : null,
        latest?.dueDate
          ? {
              label: 'ครบกำหนดรอบนี้',
              value: dateFmt.format(new Date(latest.dueDate)),
            }
          : debt.dueDay != null
            ? { label: 'วันครบกำหนด', value: `ทุกวันที่ ${debt.dueDay}` }
            : null,
        debt.annualRate != null
          ? { label: 'ดอกเบี้ย', value: `${debt.annualRate}%/ปี` }
          : null,
      ].filter((x): x is { label: string; value: string } => x !== null)
    : [
        { label: 'ยอดเริ่มต้น', value: formatTHB(debt.principal) },
        debt.balance != null
          ? { label: 'ยอดคงเหลือ', value: formatTHB(debt.balance) }
          : null,
        debt.annualRate != null
          ? { label: 'ดอกเบี้ย', value: `${debt.annualRate}%/ปี` }
          : null,
        hasSchedule
          ? { label: 'ผ่อน/เดือน', value: formatTHB(schedule.monthly) }
          : null,
        debt.minPayment != null
          ? { label: 'ชำระขั้นต่ำ/เดือน', value: formatTHB(debt.minPayment) }
          : null,
        debt.dueDay != null
          ? { label: 'วันครบกำหนด', value: `ทุกวันที่ ${debt.dueDay}` }
          : null,
        hasSchedule
          ? { label: 'ดอกเบี้ยรวม', value: formatTHB(schedule.totalInterest) }
          : null,
        hasSchedule
          ? { label: 'ยอดจ่ายทั้งหมด', value: formatTHB(schedule.totalPayment) }
          : null,
        hasSchedule
          ? {
              label: 'จ่ายแล้ว',
              value: `${debt.paidInstallments.length}/${debt.termMonths} งวด`,
            }
          : null,
        debt.endDate != null
          ? {
              label: 'สิ้นสุดสัญญา',
              value: dateFmt.format(new Date(debt.endDate)),
            }
          : null,
      ].filter((x): x is { label: string; value: string } => x !== null);

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
            {(debt.debtType || debt.lender) && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {[debt.debtType, debt.lender].filter(Boolean).join(' · ')}
              </p>
            )}
            {debt.note && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {debt.note}
              </p>
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

        {isCreditCard ? (
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-semibold">ประวัติยอดตามรอบบิล</h3>
              <StatementModal debtId={debt.id} />
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              บันทึกยอดเต็ม/ขั้นต่ำทุกครั้งที่ได้ใบแจ้งหนี้ใหม่
              เพื่อให้เห็นว่ายอดหนี้เปลี่ยนไปเพราะรูดใช้เพิ่มหรือจ่ายลดลง
            </p>
            <StatementTable debtId={debt.id} statements={debt.statements} />
          </section>
        ) : hasSchedule ? (
          <section>
            <h3 className="mb-2 font-semibold">ตารางตัดชำระ</h3>
            <ScheduleTable
              debtId={debt.id}
              rows={schedule.rows}
              startDate={debt.startDate}
              paidInstallments={debt.paidInstallments}
            />
          </section>
        ) : (
          <section>
            <h3 className="mb-2 font-semibold">ตารางตัดชำระ</h3>
            <div className="rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              ยังไม่ได้ระบุจำนวนงวด จึงยังไม่มีตารางตัดชำระ —
              แก้ไขหนี้เพื่อเพิ่มจำนวนงวด
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
