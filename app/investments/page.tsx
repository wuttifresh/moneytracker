import { getServerTheme } from '@/lib/theme-cookie';
import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  const theme = getServerTheme();
  return (
    <AppShell theme={theme} title="การลงทุน">
      <ComingSoon phase="Phase 4" />
    </AppShell>
  );
}
