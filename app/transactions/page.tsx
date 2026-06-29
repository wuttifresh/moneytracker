import { AppShell } from '@/components/layout/app-shell';
import { ComingSoon } from '@/components/coming-soon';

export default function Page() {
  return (
    <AppShell title="รายรับ-รายจ่าย">
      <ComingSoon phase="Phase 2" />
    </AppShell>
  );
}
