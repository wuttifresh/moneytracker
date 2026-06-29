import { getServerTheme } from '@/lib/theme-cookie';
import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  const theme = getServerTheme();
  return (
    <AppShell theme={theme} title="ทรัพย์สิน">
      <ComingSoon phase="Phase 5" />
    </AppShell>
  );
}
