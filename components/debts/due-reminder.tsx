import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { formatTHB } from '@/lib/money';
import { dueRelativeText } from '@/lib/debt-due';
import type { UpcomingDue } from '@/server/services/dashboard';

/**
 * Amber reminder banner for debts approaching their monthly due day.
 * Renders nothing when there's nothing due soon.
 */
export function DueReminder({ dues }: { dues: UpcomingDue[] }) {
  if (dues.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
        <CalendarClock className="h-5 w-5 shrink-0" />
        เตือนชำระหนี้ — มี {dues.length} รายการใกล้ครบกำหนด
      </div>
      <ul className="mt-2.5 space-y-1.5">
        {dues.map((d) => (
          <li key={d.id} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            {d.minPayment && (
              <span className="tabular-nums text-muted-foreground">
                {formatTHB(d.minPayment)}
              </span>
            )}
            <span className="shrink-0 font-medium text-amber-600 dark:text-amber-400">
              {dueRelativeText(d.daysUntil)}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href="/debts"
        className="mt-2.5 inline-block text-sm font-medium text-primary hover:underline"
      >
        ไปที่หนี้สิน →
      </Link>
    </div>
  );
}
