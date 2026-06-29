import { redirect } from 'next/navigation';
import { AlertTriangle, Target, Wallet } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { BudgetManager } from '@/components/planning/budget-manager';
import { GoalsManager } from '@/components/planning/goals-manager';
import { auth } from '@/auth';
import { ensureDefaultCategories } from '@/server/services/categories';
import { getBudgetOverview, getGoals } from '@/server/services/planning';
import { formatTHB } from '@/lib/money';

const monthName = new Intl.DateTimeFormat('th-TH', { month: 'long' });

export default async function PlanningPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [budget, goals] = await Promise.all([
    getBudgetOverview(userId, year, month),
    getGoals(userId),
  ]);

  return (
    <AppShell title="วางแผน">
      <div className="space-y-8">
        {budget.overCount > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-expense/40 bg-expense/10 px-4 py-3 text-sm text-expense">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>
              มี <b>{budget.overCount}</b> หมวดที่ใช้จ่ายเกินงบในเดือนนี้
            </span>
          </div>
        )}

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <Wallet className="h-5 w-5" />
              งบประมาณเดือน{monthName.format(now)}
            </h2>
            <p className="text-sm text-muted-foreground">
              ใช้ไป{' '}
              <span className="font-medium text-foreground tabular-nums">
                {formatTHB(budget.totalSpent)}
              </span>{' '}
              / งบ {formatTHB(budget.totalBudget)}
            </p>
          </div>
          <BudgetManager rows={budget.rows} />
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5" />
            เป้าหมายการออม
          </h2>
          <GoalsManager goals={goals} />
        </section>
      </div>
    </AppShell>
  );
}
