import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { BottomNav } from './bottom-nav';
import { ThemeSwitcher } from '@/components/theme/theme-switcher';
import type { ThemeId } from '@/lib/themes';

type AppShellProps = {
  children: ReactNode;
  theme: ThemeId;
  title?: string;
};

/** Responsive app frame: sidebar (md+) + bottom nav (mobile) + top bar. */
export function AppShell({ children, theme, title }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
          <h1 className="text-base font-semibold md:text-lg">
            {title ?? 'MoneyPad'}
          </h1>
          <ThemeSwitcher initialTheme={theme} />
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 md:px-6 md:pb-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
