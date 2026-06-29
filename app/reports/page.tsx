import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="รายงาน">
      <ComingSoon phase="Phase 6" />
    </AppShell>
  );
}
