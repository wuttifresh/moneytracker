import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="วางแผน">
      <ComingSoon phase="Phase 7" />
    </AppShell>
  );
}
