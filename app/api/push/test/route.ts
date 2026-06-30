import { auth } from '@/auth';
import { isPushConfigured, sendToUser } from '@/lib/push/web-push';

export const runtime = 'nodejs';

/** Send a test notification to the signed-in user's devices. */
export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return Response.json(
      { ok: false, error: 'ยังไม่ได้ตั้งค่า VAPID' },
      { status: 503 },
    );
  }

  const sent = await sendToUser(session.user.id, {
    title: 'MoneyTracker',
    body: 'การแจ้งเตือนทำงานแล้ว 🎉',
    url: '/',
    tag: 'test',
  });

  return Response.json({ ok: true, sent });
}
