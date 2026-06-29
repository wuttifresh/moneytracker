import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="ทรัพย์สิน">
      <ComingSoon phase="Phase 5" />
    </AppShell>
  );
}
