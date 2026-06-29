import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="หนี้สิน">
      <ComingSoon phase="Phase 3" />
    </AppShell>
  );
}
