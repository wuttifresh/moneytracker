/**
 * Helpers for computing a bill's due date within a specific target month
 * (unlike lib/debt-due.ts's `nextDueDate`, which finds the next occurrence
 * relative to "today" — here we want the date for a month chosen up front,
 * e.g. "next calendar month").
 */

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** ปี/เดือน (1-12) ถัดไปจากวันที่ที่กำหนด */
export function nextMonth(from: Date = new Date()): {
  year: number;
  month: number;
} {
  const y = from.getFullYear();
  const m = from.getMonth(); // 0-11
  return m === 11 ? { year: y + 1, month: 1 } : { year: y, month: m + 2 };
}

/**
 * วันครบกำหนดของบิลสำหรับปี/เดือนที่ระบุ (month = 1-12)
 * ถ้าเดือนนั้นไม่มีวันที่ตามที่ระบุ (เช่น 31 ในเดือน ก.พ.) จะปัดเป็นวันสุดท้ายของเดือน
 */
export function dueDateForMonth(
  dueDay: number,
  year: number,
  month: number,
): Date {
  const month0 = month - 1;
  const day = Math.min(dueDay, daysInMonth(year, month0));
  return new Date(year, month0, day);
}
