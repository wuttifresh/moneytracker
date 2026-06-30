import type { ReactNode } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import { InstallButton } from '@/components/pwa/install-button';
import { auth } from '@/auth';
import { getActiveTheme } from '@/lib/theme';

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

/** Responsive app frame: sidebar (md+) + bottom nav (mobile) + top bar. */
export async function AppShell({ children, title }: AppShellProps) {
  const [session, theme] = await Promise.all([auth(), getActiveTheme()]);
  const user = session?.user ?? null;

  return (
    <div className="flex min-h-screen">
      <a href="#main" className="skip-link">
        ข้ามไปเนื้อหา
      </a>
      <Sidebar
        user={
          user && { name: user.name ?? null, email: user.email ?? null }
        }
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <h1 className="text-base font-semibold md:text-lg">
            {title ?? 'MoneyTracker'}
          </h1>
          <div className="flex items-center gap-2">
            <InstallButton />
            <ThemeSwitcher initialTheme={theme} isLoggedIn={Boolean(user)} />
            <Link
              href="/profile"
              aria-label="โปรไฟล์"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-card-foreground transition-colors hover:bg-secondary md:hidden"
            >
              <UserRound className="h-5 w-5" />
            </Link>
          </div>
        </header>
        <main id="main" className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
