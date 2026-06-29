import { getServerTheme } from '@/lib/theme-cookie';
import { AppShell } from '@/components/layout/app-shell';
import { THEMES } from '@/lib/themes';

export default function HomePage() {
  const theme = getServerTheme();
  const current = THEMES.find((t) => t.id === theme);

  return (
    <AppShell theme={theme} title="ภาพรวม">
      <div className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <h2 className="text-xl font-semibold">โครงเริ่มต้นพร้อมแล้ว 🎉</h2>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            นี่คือ shell แบบ responsive ของ MoneyPad (Phase 0) — มี sidebar บน
            จอใหญ่, bottom nav บนมือถือ และระบบธีม 5 แบบที่สลับได้จากปุ่มมุมขวาบน
            (จดจำผ่าน cookie จึงไม่กระพริบตอนรีเฟรช) ฟีเจอร์การเงินจริงจะมาในเฟส
            ถัดไป
          </p>
          <p className="mt-3 text-sm">
            ธีมปัจจุบัน:{' '}
            <span className="font-medium text-primary">
              {current?.label ?? theme}
            </span>
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'รวมเดือนนี้', value: '— บาท', accent: 'text-foreground' },
            { title: 'รายรับ', value: '— บาท', accent: 'text-income' },
            { title: 'รายจ่าย', value: '— บาท', accent: 'text-expense' },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-lg border border-border bg-card p-5"
            >
              <p className="text-sm text-muted-foreground">{card.title}</p>
              <p className={`mt-2 text-2xl font-semibold ${card.accent}`}>
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-dashed border-border bg-card/50 p-6">
          <h3 className="font-medium">ตัวอย่างจานสีของธีม</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              ['primary', 'bg-primary'],
              ['accent', 'bg-accent'],
              ['secondary', 'bg-secondary'],
              ['income', 'bg-income'],
              ['expense', 'bg-expense'],
              ['muted', 'bg-muted'],
            ].map(([label, klass]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span
                  className={`h-12 w-12 rounded-md border border-border ${klass}`}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
