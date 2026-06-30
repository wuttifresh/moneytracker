'use client';

import { useState } from 'react';
import { Clock, Save, Loader2 } from 'lucide-react';
import { LEAD_DAY_CHOICES } from '@/lib/validations/reminder';

const LEAD_LABEL: Record<number, string> = {
  0: 'วันครบกำหนด',
  1: '1 วันก่อน',
  3: '3 วันก่อน',
  7: '7 วันก่อน',
};

export type ReminderSettingsProps = {
  enabled: boolean;
  leadDays: number[];
  hour: number;
};

export function ReminderSettings({ initial }: { initial: ReminderSettingsProps }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [leadDays, setLeadDays] = useState<Set<number>>(
    new Set(initial.leadDays),
  );
  const [hour, setHour] = useState(initial.hour);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  function toggleLead(day: number) {
    setLeadDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  async function save() {
    setPending(true);
    setMessage('');
    try {
      const res = await fetch('/api/push/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          leadDays: [...leadDays],
          hour,
          // Minutes to add to UTC to get the user's local time.
          tzOffset: -new Date().getTimezoneOffset(),
        }),
      });
      setMessage(res.ok ? 'บันทึกการตั้งค่าแล้ว' : 'บันทึกไม่สำเร็จ');
    } catch {
      setMessage('บันทึกไม่สำเร็จ');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border pt-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4 rounded border-border accent-primary"
        />
        เปิดการเตือนหนี้ตามวันครบกำหนด
      </label>

      <div className={enabled ? '' : 'pointer-events-none opacity-50'}>
        <p className="mb-2 text-sm font-medium">เตือนล่วงหน้า</p>
        <div className="flex flex-wrap gap-2">
          {LEAD_DAY_CHOICES.map((day) => {
            const active = leadDays.has(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleLead(day)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card hover:bg-secondary'
                }`}
              >
                {LEAD_LABEL[day]}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <label
            htmlFor="reminder-hour"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium"
          >
            <Clock className="h-4 w-4" />
            เวลาที่จะเตือน
          </label>
          <select
            id="reminder-hour"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00 น.
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          บันทึกการตั้งค่า
        </button>
        {message && <span className="text-sm text-muted-foreground">{message}</span>}
      </div>
    </div>
  );
}
