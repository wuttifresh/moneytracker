/**
 * Pure parsing/normalisation helpers for the expense-import feature.
 * Kept free of any spreadsheet library so the logic is trivially testable;
 * the caller turns a workbook into a 2-D array of cells and passes it here.
 */

/** Column header aliases (case-insensitive, trimmed) for flexible imports. */
const HEADER_ALIASES: Record<ColumnKey, string[]> = {
  date: ['วันที่', 'วัน', 'date', 'transaction date', 'txn date'],
  category: ['หมวดหมู่', 'หมวด', 'category', 'ประเภทค่าใช้จ่าย'],
  amount: ['จำนวนเงิน', 'จำนวน', 'ยอด', 'amount', 'value', 'price'],
  note: ['หมายเหตุ', 'รายละเอียด', 'note', 'description', 'memo', 'remark'],
  type: ['ประเภท', 'type', 'รายรับ/รายจ่าย'],
};

type ColumnKey = 'date' | 'category' | 'amount' | 'note' | 'type';
type ColumnMap = Record<ColumnKey, number>;

export type ParsedExpenseRow = {
  row: number; // 1-based row number in the source sheet
  date: string; // YYYY-MM-DD
  category: string;
  amount: string; // decimal string, max 2 dp
  note: string;
};

export type RowError = { row: number; message: string };

export type ParseResult = {
  rows: ParsedExpenseRow[];
  errors: RowError[];
  /** True when the header row could not be recognised at all. */
  noHeader: boolean;
};

/** Hard cap so a single upload can't create an unbounded number of rows. */
export const MAX_IMPORT_ROWS = 1000;

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();
const pad = (n: number): string => String(n).padStart(2, '0');

function mapColumns(header: unknown[]): ColumnMap {
  const map: ColumnMap = { date: -1, category: -1, amount: -1, note: -1, type: -1 };
  header.forEach((cell, i) => {
    const n = norm(cell);
    if (!n) return;
    (Object.keys(HEADER_ALIASES) as ColumnKey[]).forEach((key) => {
      if (map[key] === -1 && HEADER_ALIASES[key].some((a) => a.toLowerCase() === n)) {
        map[key] = i;
      }
    });
  });
  return map;
}

/** Build YYYY-MM-DD from parts, converting Buddhist years and validating. */
function fromParts(year: number, month: number, day: number): string | null {
  let y = year;
  if (y >= 2400 && y <= 2600) y -= 543; // Buddhist Era → CE
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(y, month - 1, day));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${y}-${pad(month)}-${pad(day)}`;
}

/**
 * Normalise a date cell to YYYY-MM-DD. Accepts Excel serial numbers,
 * ISO (YYYY-MM-DD or YYYY/MM/DD) and Thai day-first (DD/MM/YYYY) strings.
 */
export function normalizeDate(value: unknown): string | null {
  if (value == null || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return fromParts(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    );
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    // Excel serial date: days since 1899-12-30 (handles the 1900 offset).
    const ms = Math.round(value * 86_400_000) + Date.UTC(1899, 11, 30);
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return fromParts(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const s = String(value).trim();
  const iso = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (iso) return fromParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) return fromParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]));
  return null;
}

/**
 * Normalise an amount cell to a positive decimal string with ≤2 dp.
 * Strips thousands separators and currency marks; rounds to 2 dp.
 */
export function normalizeAmount(value: unknown): string | null {
  if (value == null || value === '') return null;
  let s = String(value)
    .trim()
    .replace(/[,\s]/g, '')
    .replace(/฿|บาท|thb/gi, '');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  // Keep at most 2 decimals (input sanitisation, not balance math).
  if (!/^\d+(\.\d{1,2})?$/.test(s)) s = n.toFixed(2);
  return s;
}

/** Detect an income marker so re-imported export files skip income rows. */
function isIncome(value: unknown): boolean {
  const n = norm(value);
  return n === 'รายรับ' || n === 'รายได้' || n === 'income';
}

/**
 * Parse a sheet (2-D array incl. header row) into validated expense rows.
 * Rows that fail validation are returned in `errors` with the source row
 * number, never silently dropped.
 */
export function parseExpenseRows(grid: unknown[][]): ParseResult {
  const errors: RowError[] = [];
  const rows: ParsedExpenseRow[] = [];

  const headerIdx = grid.findIndex((r) =>
    Array.isArray(r) && r.some((c) => norm(c) !== ''),
  );
  const headerRow = headerIdx === -1 ? undefined : grid[headerIdx];
  if (!headerRow) return { rows, errors, noHeader: true };

  const cols = mapColumns(headerRow);
  if (cols.date === -1 || cols.amount === -1) {
    return { rows, errors, noHeader: true };
  }

  for (let i = headerIdx + 1; i < grid.length; i += 1) {
    const raw = grid[i];
    const rowNo = i + 1; // 1-based for human-friendly messages
    if (!Array.isArray(raw) || raw.every((c) => norm(c) === '')) continue;

    if (cols.type !== -1 && isIncome(raw[cols.type])) continue; // skip income

    if (rows.length >= MAX_IMPORT_ROWS) {
      errors.push({ row: rowNo, message: `เกินจำนวนสูงสุด ${MAX_IMPORT_ROWS} แถว` });
      break;
    }

    const date = normalizeDate(raw[cols.date]);
    const amount = normalizeAmount(raw[cols.amount]);
    const category =
      cols.category === -1 ? '' : String(raw[cols.category] ?? '').trim();
    const note =
      cols.note === -1 ? '' : String(raw[cols.note] ?? '').trim().slice(0, 200);

    if (!date) {
      errors.push({ row: rowNo, message: 'วันที่ไม่ถูกต้อง' });
      continue;
    }
    if (!amount) {
      errors.push({ row: rowNo, message: 'จำนวนเงินไม่ถูกต้อง' });
      continue;
    }
    if (!category) {
      errors.push({ row: rowNo, message: 'ไม่มีหมวดหมู่' });
      continue;
    }

    rows.push({ row: rowNo, date, category: category.slice(0, 40), amount, note });
  }

  return { rows, errors, noHeader: false };
}
