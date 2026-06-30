/**
 * Helpers for computing the next monthly due date of a debt from its
 * `dueDay` (1-31). Pure functions so they're trivial to reason about and
 * reusable on both the dashboard and the debts page.
 */

/** จำนวนวันในเดือน (month0 = 0-11) */
function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

/** ปัดวันที่ให้เหลือเฉพาะ ปี/เดือน/วัน (ตัดเวลาออก) */
function atMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * วันครบกำหนดครั้งถัดไปของ `dueDay` (1-31) ที่ตรงกับวันนี้หรือหลังจากนี้
 * ถ้าเดือนนั้นไม่มีวันที่ตามที่ระบุ (เช่น 31 ในเดือน ก.พ.) จะปัดเป็นวันสุดท้ายของเดือน
 */
export function nextDueDate(dueDay: number, from: Date = new Date()): Date {
  const y = from.getFullYear();
  const m = from.getMonth();
  const today = from.getDate();

  const thisMonthDay = Math.min(dueDay, daysInMonth(y, m));
  if (thisMonthDay >= today) {
    return new Date(y, m, thisMonthDay);
  }

  const ny = m === 11 ? y + 1 : y;
  const nm = m === 11 ? 0 : m + 1;
  const nextMonthDay = Math.min(dueDay, daysInMonth(ny, nm));
  return new Date(ny, nm, nextMonthDay);
}

/** จำนวนวันจาก `from` ถึง `date` (0 = วันนี้) โดยนับเป็นวันปฏิทิน */
export function daysUntil(date: Date, from: Date = new Date()): number {
  const a = atMidnight(from).getTime();
  const b = atMidnight(date).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** ระยะเวลาที่ถือว่า "ใกล้ครบกำหนด" (วัน) */
export const DUE_SOON_DAYS = 7;

/** ข้อความเตือนแบบสัมพัทธ์ตามจำนวนวันที่เหลือ */
export function dueRelativeText(days: number): string {
  if (days <= 0) return 'ครบกำหนดวันนี้';
  if (days === 1) return 'ครบกำหนดพรุ่งนี้';
  return `อีก ${days} วัน`;
}
