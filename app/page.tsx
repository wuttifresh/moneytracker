import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { getSession } from '@/lib/session';
import { getFinancialOverview } from '@/server/services/overview';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');

  const overview = await getFinancialOverview(session.user.id);

  return (
    <AppShell title="ภาพรวม">
      <DashboardOverview data={overview} />
    </AppShell>
  );
}
