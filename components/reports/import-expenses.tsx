'use client';

import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { ImportResult } from '@/server/services/import';

export function ImportExpenses() {
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const form = e.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setResult(null);
    try {
      const res = await fetch('/api/transactions/import', {
        method: 'POST',
        body: data,
      });
      const body = (await res.json()) as ImportResult;
      setResult(body);
      if (body.ok) {
        form.reset();
        setFileName('');
      }
    } catch {
      setResult({ ok: false, error: 'เกิดข้อผิดพลาดในการอัปโหลด' });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">นำเข้ารายจ่ายจาก Excel</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ดาวน์โหลดเทมเพลต กรอกข้อมูลรายจ่าย แล้วอัปโหลดกลับมา (รองรับ .xlsx
            และ .csv จากระบบอื่น)
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href="/api/transactions/import-template"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลดเทมเพลต
            </a>
          </div>

          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="mt-3 flex flex-wrap items-center gap-2"
          >
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed border-border bg-background px-3.5 py-2 text-sm transition-colors hover:bg-secondary">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-[200px] truncate">
                {fileName || 'เลือกไฟล์...'}
              </span>
              <input
                type="file"
                name="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  setFileName(e.target.files?.[0]?.name ?? '');
                  setResult(null);
                }}
              />
            </label>
            <button
              type="submit"
              disabled={pending || !fileName}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" />
              {pending ? 'กำลังนำเข้า...' : 'นำเข้ารายจ่าย'}
            </button>
          </form>

          {result && !result.ok && (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {result.error}
            </p>
          )}

          {result?.ok && (
            <div className="mt-3 rounded-md border border-income/40 bg-income/10 px-3 py-2.5 text-sm">
              <p className="flex items-center gap-2 font-medium text-income">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                นำเข้าสำเร็จ {result.summary.imported} รายการ
              </p>
              {result.summary.createdCategories.length > 0 && (
                <p className="mt-1.5 text-muted-foreground">
                  สร้างหมวดหมู่ใหม่: {result.summary.createdCategories.join(', ')}
                </p>
              )}
              {result.summary.skipped.length > 0 && (
                <details className="mt-1.5">
                  <summary className="cursor-pointer text-amber-600 dark:text-amber-400">
                    ข้าม {result.summary.skipped.length} แถวที่มีปัญหา
                  </summary>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    {result.summary.skipped.slice(0, 20).map((s) => (
                      <li key={s.row}>
                        แถว {s.row}: {s.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
