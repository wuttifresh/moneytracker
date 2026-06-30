import { getPublicKey } from '@/lib/push/web-push';

export const runtime = 'nodejs';
// Read VAPID config at request time (must not be prerendered at build time).
export const dynamic = 'force-dynamic';

/** Public VAPID key for the client to subscribe (null when unconfigured). */
export async function GET(): Promise<Response> {
  return Response.json({ key: getPublicKey() });
}
