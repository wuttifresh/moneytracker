'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteAsset } from '@/server/actions/assets';

export function DeleteAssetButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="ลบทรัพย์สิน"
      onClick={() => {
        if (!window.confirm('ต้องการลบทรัพย์สินนี้หรือไม่?')) return;
        start(async () => {
          await deleteAsset(id);
          router.refresh();
        });
      }}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-expense disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
