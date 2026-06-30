import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { ProfileHeader } from '@/components/profile/profile-header';
import { NotificationToggle } from '@/components/push/notification-toggle';
import { ReminderSettings } from '@/components/push/reminder-settings';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { signOutAction } from '@/server/actions/auth';
import { getActiveTheme } from '@/lib/theme';
import { THEMES } from '@/lib/themes';

export const metadata: Metadata = { title: 'โปรไฟล์ — MoneyTracker' };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const [user, theme] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
        hashedPassword: true,
        debtReminderEnabled: true,
        debtReminderLeadDays: true,
        debtReminderHour: true,
      },
    }),
    getActiveTheme(),
  ]);
  if (!user) redirect('/login');

  const hasPassword = Boolean(user.hashedPassword);
  const currentTheme = THEMES.find((t) => t.id === theme);

  return (
    <AppShell title="โปรไฟล์">
      <div className="mx-auto max-w-2xl space-y-6">
        <ProfileHeader
          name={user.name}
          email={user.email}
          image={user.image}
          createdAt={user.createdAt}
          hasPassword={hasPassword}
        />

        {/* Theme */}
        <section className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">ธีม</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ธีมปัจจุบัน:{' '}
                <span className="font-medium text-primary">
                  {currentTheme?.label ?? theme}
                </span>{' '}
                — บันทึกอัตโนมัติกับบัญชีของคุณ
              </p>
            </div>
            <ThemeSwitcher initialTheme={theme} isLoggedIn />
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            รับการแจ้งเตือนชำระหนี้เมื่อใกล้ถึงวันครบกำหนด แม้ปิดแอปอยู่
          </p>
          <NotificationToggle />
          <ReminderSettings
            initial={{
              enabled: user.debtReminderEnabled,
              leadDays: user.debtReminderLeadDays,
              hour: user.debtReminderHour,
            }}
          />
        </section>

        {/* Password */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">รหัสผ่าน</h2>
          {hasPassword ? (
            <div className="mt-4">
              <ChangePasswordForm />
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              บัญชีนี้เข้าสู่ระบบผ่าน Google จึงยังไม่มีรหัสผ่าน
            </p>
          )}
        </section>

        {/* Sign out */}
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </form>
      </div>
    </AppShell>
  );
}
