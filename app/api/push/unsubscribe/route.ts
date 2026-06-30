import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ ok: false }, { status: 401 });
  }

  let endpoint = '';
  try {
    const body = (await req.json()) as { endpoint?: unknown };
    if (typeof body.endpoint === 'string') endpoint = body.endpoint;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!endpoint) return Response.json({ ok: false }, { status: 400 });

  // Scoped to the owner so one user can't delete another's subscription.
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return Response.json({ ok: true });
}
