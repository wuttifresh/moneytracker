'use client';

import type { Route } from 'next';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function YearSelect({ year }: { year: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(nextYear: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', String(nextYear));
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  return (
    <div className="flex items-center rounded-md border border-border bg-card">
      <button
        type="button"
        aria-label="ปีก่อนหน้า"
        onClick={() => go(year - 1)}
        className="flex h-9 w-9 items-center justify-center rounded-l-md text-muted-foreground hover:bg-secondary"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[5rem] text-center text-sm font-medium">
        ปี {year + 543}
      </span>
      <button
        type="button"
        aria-label="ปีถัดไป"
        onClick={() => go(year + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-r-md text-muted-foreground hover:bg-secondary"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
