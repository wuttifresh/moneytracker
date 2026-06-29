'use client';

import type { Route } from 'next';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteDebt } from '@/server/actions/debts';

export function DeleteDebtButton({
  id,
  redirectTo,
}: {
  id: string;
  redirectTo?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบหนี้"
      onClick={() => {
        if (!window.confirm('ต้องการลบรายการหนี้นี้หรือไม่?')) return;
        start(async () => {
          await deleteDebt(id);
          if (redirectTo) router.push(redirectTo as Route);
          else router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
