import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { CategoryManager } from '@/components/categories/category-manager';
import { getSession } from '@/lib/session';
import {
  ensureDefaultCategories,
  getCategories,
} from '@/server/services/categories';

export const metadata: Metadata = { title: 'จัดการหมวดหมู่ — MoneyTracker' };

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const categories = await getCategories(userId);

  return (
    <AppShell title="จัดการหมวดหมู่">
      <div className="space-y-4">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับไปรายรับ-รายจ่าย
        </Link>
        <CategoryManager categories={categories} />
      </div>
    </AppShell>
  );
}
