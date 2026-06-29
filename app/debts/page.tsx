import { getServerTheme } from '@/lib/theme-cookie';
import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  const theme = getServerTheme();
  return (
    <AppShell theme={theme} title="หนี้สิน">
      <ComingSoon phase="Phase 3" />
    </AppShell>
  );
}
