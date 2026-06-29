'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteInvestment } from '@/server/actions/investments';

export function DeleteInvestmentButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบสินทรัพย์"
      onClick={() => {
        if (!window.confirm('ต้องการลบสินทรัพย์นี้หรือไม่?')) return;
        start(async () => {
          await deleteInvestment(id);
          router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
