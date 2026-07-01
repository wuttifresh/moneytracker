import { prisma } from '@/lib/prisma';
import { isPushConfigured, sendToUser } from '@/lib/push/web-push';
import { daysUntilDueDay, dueRelativeText } from '@/lib/debt-due';
import { formatTHB } from '@/lib/money';

export const runtime = 'nodejs';

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run unless explicitly configured
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('secret') === secret;
}

/**
 * Runs once daily (Vercel Hobby plan only allows daily cron schedules).
 * Sends a push to every subscribed user for debts whose due date is within
 * their chosen lead days. Each user's "today" is computed in their own
 * timezone offset. `debtReminderHour` no longer gates delivery since a single
 * daily run can't target each user's chosen hour precisely.
 */
export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  if (!isPushConfigured()) {
    return Response.json({ ok: false, error: 'push not configured' }, { status: 503 });
  }

  const users = await prisma.user.findMany({
    where: { debtReminderEnabled: true, pushSubscriptions: { some: {} } },
    select: {
      id: true,
      debtReminderLeadDays: true,
      reminderTzOffset: true,
    },
  });

  const nowMs = Date.now();
  let usersNotified = 0;
  let pushesSent = 0;

  for (const u of users) {
    const local = new Date(nowMs + u.reminderTzOffset * 60_000);

    const offsets = new Set(u.debtReminderLeadDays);
    if (offsets.size === 0) continue;

    const ly = local.getUTCFullYear();
    const lm = local.getUTCMonth() + 1;
    const ld = local.getUTCDate();

    const debts = await prisma.debt.findMany({
      where: { userId: u.id, deletedAt: null, dueDay: { not: null } },
      select: {
        name: true,
        dueDay: true,
        minPayment: true,
        termMonths: true,
        _count: { select: { payments: true } },
      },
    });

    const due = debts
      .filter((d) => d.dueDay != null && d._count.payments < d.termMonths)
      .map((d) => ({
        name: d.name,
        days: daysUntilDueDay(d.dueDay as number, ly, lm, ld),
        min: d.minPayment ? d.minPayment.toString() : null,
      }))
      .filter((d) => offsets.has(d.days))
      .sort((a, b) => a.days - b.days);

    const first = due[0];
    if (!first) continue;

    const body =
      due.length === 1
        ? `${first.name} ${dueRelativeText(first.days)}${
            first.min ? ` • ${formatTHB(first.min)}` : ''
          }`
        : `มี ${due.length} รายการใกล้ครบกำหนด — ${first.name} ${dueRelativeText(
            first.days,
          )}`;

    const sent = await sendToUser(u.id, {
      title: 'เตือนชำระหนี้',
      body,
      url: '/debts',
      tag: 'debt-due',
    });
    if (sent > 0) {
      usersNotified += 1;
      pushesSent += sent;
    }
  }

  return Response.json({ ok: true, usersNotified, pushesSent });
}
