'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';

type Status =
  | 'loading'
  | 'unsupported'
  | 'unconfigured'
  | 'denied'
  | 'enabled'
  | 'disabled';

/** Convert a base64url VAPID key to the Uint8Array the Push API expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export function NotificationToggle() {
  const [status, setStatus] = useState<Status>('loading');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      return;
    }
    const res = await fetch('/api/push/public-key').then((r) => r.json());
    if (!res.key) {
      setStatus('unconfigured');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const sub = reg ? await reg.pushManager.getSubscription() : null;
    setStatus(sub ? 'enabled' : 'disabled');
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function enable() {
    setPending(true);
    setMessage('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus(permission === 'denied' ? 'denied' : 'disabled');
        return;
      }
      const { key } = await fetch('/api/push/public-key').then((r) => r.json());
      if (!key) {
        setStatus('unconfigured');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const ok = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      }).then((r) => r.ok);
      if (!ok) throw new Error('subscribe failed');
      setStatus('enabled');
      setMessage('เปิดการแจ้งเตือนแล้ว');
    } catch {
      setMessage('เปิดการแจ้งเตือนไม่สำเร็จ');
    } finally {
      setPending(false);
    }
  }

  async function disable() {
    setPending(true);
    setMessage('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('disabled');
      setMessage('ปิดการแจ้งเตือนแล้ว');
    } catch {
      setMessage('ปิดการแจ้งเตือนไม่สำเร็จ');
    } finally {
      setPending(false);
    }
  }

  async function sendTest() {
    setPending(true);
    setMessage('');
    try {
      const res = await fetch('/api/push/test', { method: 'POST' });
      const data = (await res.json()) as { ok: boolean; sent?: number };
      setMessage(
        res.ok && data.sent
          ? `ส่งทดสอบไปยัง ${data.sent} อุปกรณ์แล้ว`
          : 'ส่งทดสอบไม่สำเร็จ',
      );
    } catch {
      setMessage('ส่งทดสอบไม่สำเร็จ');
    } finally {
      setPending(false);
    }
  }

  if (status === 'loading') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังตรวจสอบ...
      </p>
    );
  }

  if (status === 'unsupported') {
    return (
      <p className="text-sm text-muted-foreground">
        เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือนแบบพุช (ลองเพิ่มแอปลงหน้าจอหลักแล้วเปิดอีกครั้ง)
      </p>
    );
  }

  if (status === 'unconfigured') {
    return (
      <p className="text-sm text-muted-foreground">
        ระบบยังไม่ได้ตั้งค่า VAPID สำหรับการแจ้งเตือน
      </p>
    );
  }

  if (status === 'denied') {
    return (
      <p className="text-sm text-muted-foreground">
        คุณได้บล็อกการแจ้งเตือนไว้ — เปิดสิทธิ์ในตั้งค่าเบราว์เซอร์เพื่อใช้งาน
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {status === 'enabled' ? (
          <>
            <button
              type="button"
              onClick={disable}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            >
              <BellOff className="h-4 w-4" />
              ปิดการแจ้งเตือน
            </button>
            <button
              type="button"
              onClick={sendTest}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <BellRing className="h-4 w-4" />
              ทดสอบการแจ้งเตือน
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            เปิดการแจ้งเตือน
          </button>
        )}
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
