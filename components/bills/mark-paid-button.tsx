'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toggleBillPaid } from '@/server/actions/bills';
import { cn } from '@/lib/utils';

export function MarkPaidButton({
  billId,
  year,
  month,
  paid,
}: {
  billId: string;
  year: number;
  month: number;
  paid: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={paid ? 'ยกเลิกการจ่าย' : 'ทำเครื่องหมายจ่ายแล้ว'}
      aria-pressed={paid}
      onClick={() =>
        start(async () => {
          await toggleBillPaid(billId, year, month);
          router.refresh();
        })
      }
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
        paid
          ? 'border-income bg-income text-white'
          : 'border-border text-muted-foreground hover:bg-secondary',
      )}
    >
      <Check className="h-4 w-4" />
      {paid ? 'จ่ายแล้ว' : 'ยังไม่จ่าย'}
    </button>
  );
}
