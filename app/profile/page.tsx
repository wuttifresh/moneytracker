import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { ChangePasswordForm } from '@/components/auth/change-password-form';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { signOutAction } from '@/server/actions/auth';
import { getActiveTheme } from '@/lib/theme';
import { THEMES } from '@/lib/themes';

export const metadata: Metadata = { title: 'โปรไฟล์ — MoneyPad' };

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' });

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [user, theme] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        createdAt: true,
        hashedPassword: true,
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
        {/* Account info */}
        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold">ข้อมูลบัญชี</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">ชื่อ</dt>
              <dd className="font-medium">{user.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">อีเมล</dt>
              <dd className="font-medium">{user.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">สมัครเมื่อ</dt>
              <dd className="font-medium">{dateFmt.format(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">วิธีเข้าสู่ระบบ</dt>
              <dd className="font-medium">
                {hasPassword ? 'อีเมล / รหัสผ่าน' : 'Google'}
              </dd>
            </div>
          </dl>
        </section>

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
