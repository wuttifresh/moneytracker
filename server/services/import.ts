import * as XLSX from 'xlsx';
import { prisma } from '@/lib/prisma';
import { parseExpenseRows, type RowError } from '@/lib/import/expense-import';

export type ImportSummary = {
  imported: number;
  createdCategories: string[];
  skipped: RowError[];
};

export type ImportResult =
  | { ok: true; summary: ImportSummary }
  | { ok: false; error: string };

export const MAX_IMPORT_FILE_BYTES = 2_000_000; // 2 MB

const catKey = (name: string): string => name.trim().toLowerCase();

/**
 * Parse an uploaded spreadsheet (xlsx/csv bytes) and create the resulting
 * expense transactions for `userId`. Pure of any request/auth concerns so it
 * can be driven from a route handler. Unknown categories are auto-created.
 */
export async function runExpenseImport(
  userId: string,
  bytes: Uint8Array,
): Promise<ImportResult> {
  let grid: unknown[][];
  try {
    const wb = XLSX.read(bytes, { type: 'array' });
    const sheetName = wb.SheetNames.includes('รายจ่าย')
      ? 'รายจ่าย'
      : wb.SheetNames[0];
    const ws = sheetName ? wb.Sheets[sheetName] : undefined;
    if (!ws) return { ok: false, error: 'ไม่พบข้อมูลในไฟล์' };
    grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: true,
      blankrows: false,
    });
  } catch {
    return { ok: false, error: 'อ่านไฟล์ไม่ได้ — รองรับเฉพาะ .xlsx และ .csv' };
  }

  const { rows, errors, noHeader } = parseExpenseRows(grid);
  if (noHeader) {
    return {
      ok: false,
      error:
        'ไม่พบหัวตารางที่ถูกต้อง — ต้องมีคอลัมน์ "วันที่" และ "จำนวนเงิน" (ใช้เทมเพลตที่ดาวน์โหลด)',
    };
  }
  if (rows.length === 0) {
    return { ok: false, error: 'ไม่พบรายการที่นำเข้าได้ในไฟล์' };
  }

  // Resolve categories by name; auto-create any that don't exist yet.
  const existing = await prisma.category.findMany({
    where: { userId, type: 'expense', deletedAt: null },
    select: { id: true, name: true },
  });
  const byName = new Map(existing.map((c) => [catKey(c.name), c.id]));

  const neededNames = new Map<string, string>(); // key → original display name
  for (const r of rows) {
    const key = catKey(r.category);
    if (!byName.has(key) && !neededNames.has(key)) {
      neededNames.set(key, r.category);
    }
  }

  const createdCategories: string[] = [];
  if (neededNames.size > 0) {
    await prisma.category.createMany({
      data: [...neededNames.values()].map((name) => ({
        userId,
        name,
        type: 'expense' as const,
        icon: 'MoreHorizontal',
        color: '#94a3b8',
      })),
    });
    createdCategories.push(...neededNames.values());
    const refreshed = await prisma.category.findMany({
      where: { userId, type: 'expense', deletedAt: null },
      select: { id: true, name: true },
    });
    byName.clear();
    refreshed.forEach((c) => byName.set(catKey(c.name), c.id));
  }

  const data = rows.map((r) => ({
    userId,
    categoryId: byName.get(catKey(r.category)) as string,
    type: 'expense' as const,
    amount: r.amount,
    date: new Date(r.date),
    note: r.note ? r.note : null,
  }));

  await prisma.transaction.createMany({ data });

  return {
    ok: true,
    summary: {
      imported: data.length,
      createdCategories,
      skipped: errors,
    },
  };
}
