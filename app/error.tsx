'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-expense/10 text-expense">
        <AlertTriangle className="h-7 w-7" />
      </span>
      <h1 className="text-lg font-semibold">เกิดข้อผิดพลาด</h1>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        ขออภัย มีบางอย่างผิดพลาด ลองอีกครั้งหรือกลับไปหน้าแรก
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          ลองอีกครั้ง
        </button>
        <Link
          href="/"
          className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          กลับหน้าแรก
        </Link>
      </div>
    </div>
  );
}
