import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="การลงทุน">
      <ComingSoon phase="Phase 4" />
    </AppShell>
  );
}
