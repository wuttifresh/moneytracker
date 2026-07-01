import { redirect } from 'next/navigation';
import { Receipt, Wallet, CalendarClock } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { BillModal } from '@/components/bills/bill-modal';
import { DeleteBillButton } from '@/components/bills/delete-bill-button';
import { MarkPaidButton } from '@/components/bills/mark-paid-button';
import { getSession } from '@/lib/session';
import { listBillsForMonth } from '@/server/services/bills';
import { nextMonth, dueDateForMonth } from '@/lib/bill-due';
import { formatTHB } from '@/lib/money';

const monthFmt = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const monthLabelFmt = new Intl.DateTimeFormat('th-TH', {
  month: 'long',
  year: 'numeric',
});

export default async function BillsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const { year, month } = nextMonth();
  const bills = await listBillsForMonth(session.user.id, year, month);

  const totalDue = bills.reduce((s, b) => s + Number(b.amount), 0);
  const totalPaid = bills
    .filter((b) => b.paid)
    .reduce((s, b) => s + Number(b.amount), 0);
  const remaining = totalDue - totalPaid;

  const rows = bills
    .map((b) => ({ bill: b, dueDate: dueDateForMonth(b.dueDay, year, month) }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  const monthLabel = monthLabelFmt.format(dueDateForMonth(1, year, month));

  const cards = [
    { label: `ยอดบิลรวมเดือน ${monthLabel}`, value: totalDue, icon: Receipt },
    { label: 'จ่ายแล้ว', value: totalPaid, icon: Wallet },
    { label: 'คงเหลือที่ต้องจ่าย', value: remaining, icon: CalendarClock },
  ];

  return (
    <AppShell title="บิลที่ต้องจ่าย">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            รายการบิลที่ต้องจ่ายในเดือน {monthLabel}
          </p>
          <BillModal />
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
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {formatTHB(c.value)}
                </p>
              </div>
            );
          })}
        </section>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-14 text-center">
            <Receipt className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              ยังไม่มีรายการบิล — เพิ่มได้จากปุ่ม “เพิ่มบิล”
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            {rows.map(({ bill, dueDate }) => (
              <div
                key={bill.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{bill.name}</p>
                    {bill.billType && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {bill.billType}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ครบกำหนด {monthFmt.format(dueDate)}
                  </p>
                  {bill.note && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {bill.note}
                    </p>
                  )}
                </div>
                <p className="text-lg font-semibold tabular-nums">
                  {formatTHB(bill.amount)}
                </p>
                <div className="flex items-center gap-1">
                  <MarkPaidButton
                    billId={bill.id}
                    year={year}
                    month={month}
                    paid={bill.paid}
                  />
                  <BillModal bill={bill} />
                  <DeleteBillButton id={bill.id} />
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </AppShell>
  );
}
