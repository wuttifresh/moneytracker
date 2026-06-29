'use client';

import type { Route } from 'next';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CategoryDTO } from '@/server/services/categories';

const MONTHS_TH = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const selectClass =
  'rounded-md border border-border bg-card px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring';

export function MonthFilter({
  year,
  month,
  type,
  categoryId,
  categories,
}: {
  year: number;
  month: number;
  type: string;
  categoryId: string;
  categories: CategoryDTO[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}` as Route);
  }

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    update({ year: String(y), month: String(m) });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-md border border-border bg-card">
        <button
          type="button"
          aria-label="เดือนก่อนหน้า"
          onClick={() => shiftMonth(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-l-md text-muted-foreground hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[8.5rem] text-center text-sm font-medium">
          {MONTHS_TH[month - 1]} {year + 543}
        </span>
        <button
          type="button"
          aria-label="เดือนถัดไป"
          onClick={() => shiftMonth(1)}
          className="flex h-9 w-9 items-center justify-center rounded-r-md text-muted-foreground hover:bg-secondary"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <select
        aria-label="ประเภท"
        value={type}
        onChange={(e) => update({ type: e.target.value })}
        className={selectClass}
      >
        <option value="">ทุกประเภท</option>
        <option value="income">รายรับ</option>
        <option value="expense">รายจ่าย</option>
      </select>

      <select
        aria-label="หมวดหมู่"
        value={categoryId}
        onChange={(e) => update({ categoryId: e.target.value })}
        className={selectClass}
      >
        <option value="">ทุกหมวดหมู่</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
