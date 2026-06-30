import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { reminderSettingsSchema } from '@/lib/validations/reminder';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let parsed;
  try {
    parsed = reminderSettingsSchema.safeParse(await req.json());
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  const { enabled, leadDays, hour, tzOffset } = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      debtReminderEnabled: enabled,
      debtReminderLeadDays: leadDays,
      debtReminderHour: hour,
      reminderTzOffset: tzOffset,
    },
  });

  return Response.json({ ok: true });
}
