import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

/**
 * Web Push (VAPID) helpers. VAPID keys are optional — when they aren't
 * configured the whole feature degrades gracefully (the UI shows it's
 * unavailable and senders become no-ops) instead of throwing at build time.
 *
 * Required env:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (npx web-push generate-vapid-keys)
 *   VAPID_SUBJECT                        (mailto: or https: contact, optional)
 */

const publicKey = process.env.VAPID_PUBLIC_KEY ?? '';
const privateKey = process.env.VAPID_PRIVATE_KEY ?? '';
const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@moneytracker.app';

let configured = false;
if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export function isPushConfigured(): boolean {
  return configured;
}

export function getPublicKey(): string | null {
  return configured ? publicKey : null;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Send a payload to one stored subscription. Returns true on success.
 * Dead subscriptions (404/410) are pruned from the database automatically.
 */
export async function sendToSubscription(
  sub: StoredSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!configured) return false;
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => undefined);
    }
    return false;
  }
}

/** Send a payload to every subscription a user has registered. */
export async function sendToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!configured) return 0;
  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });
  const results = await Promise.all(
    subs.map((s) => sendToSubscription(s, payload)),
  );
  return results.filter(Boolean).length;
}
