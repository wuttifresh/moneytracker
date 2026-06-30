import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type IncomingSub = {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
};

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let body: IncomingSub;
  try {
    body = (await req.json()) as IncomingSub;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : '';
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : '';
  const authKey = typeof body.keys?.auth === 'string' ? body.keys.auth : '';
  if (!endpoint || !p256dh || !authKey) {
    return Response.json({ ok: false }, { status: 400 });
  }

  // Upsert by endpoint, always (re)binding it to the current user.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId: session.user.id, endpoint, p256dh, auth: authKey },
    update: { userId: session.user.id, p256dh, auth: authKey },
  });

  return Response.json({ ok: true });
}
