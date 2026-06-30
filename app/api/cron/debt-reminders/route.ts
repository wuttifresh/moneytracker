import { prisma } from '@/lib/prisma';
import { isPushConfigured, sendToUser } from '@/lib/push/web-push';
import { nextDueDate, daysUntil, dueRelativeText } from '@/lib/debt-due';
import { formatTHB } from '@/lib/money';

export const runtime = 'nodejs';

// Notify 3 days before, 1 day before, and on the due day (avoids daily spam).
const NOTIFY_OFFSETS = new Set([3, 1, 0]);

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // refuse to run unless explicitly configured
  if (req.headers.get('authorization') === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get('secret') === secret;
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response('Unauthorized', { status: 401 });
  if (!isPushConfigured()) {
    return Response.json({ ok: false, error: 'push not configured' }, { status: 503 });
  }

  const subscribers = await prisma.pushSubscription.findMany({
    select: { userId: true },
    distinct: ['userId'],
  });

  const now = new Date();
  let usersNotified = 0;
  let pushesSent = 0;

  for (const { userId } of subscribers) {
    const debts = await prisma.debt.findMany({
      where: { userId, deletedAt: null, dueDay: { not: null } },
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
        days: daysUntil(nextDueDate(d.dueDay as number, now), now),
        min: d.minPayment ? d.minPayment.toString() : null,
      }))
      .filter((d) => NOTIFY_OFFSETS.has(d.days))
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

    const sent = await sendToUser(userId, {
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
