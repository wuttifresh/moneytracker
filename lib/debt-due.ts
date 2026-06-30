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

/**
 * Timezone-safe days-until-due, computed purely from a local calendar date
 * (year / month 1-12 / day). Used by the reminder cron so each user's "today"
 * is their own local date regardless of the (UTC) server clock.
 */
export function daysUntilDueDay(
  dueDay: number,
  y: number,
  m: number,
  d: number,
): number {
  const dim = (yy: number, mm: number) =>
    new Date(Date.UTC(yy, mm, 0)).getUTCDate(); // last day of month mm (1-12)
  const todayUTC = Date.UTC(y, m - 1, d);
  const thisDay = Math.min(dueDay, dim(y, m));
  let dueUTC: number;
  if (thisDay >= d) {
    dueUTC = Date.UTC(y, m - 1, thisDay);
  } else {
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    dueUTC = Date.UTC(ny, nm - 1, Math.min(dueDay, dim(ny, nm)));
  }
  return Math.round((dueUTC - todayUTC) / 86_400_000);
}

/** ระยะเวลาที่ถือว่า "ใกล้ครบกำหนด" (วัน) */
export const DUE_SOON_DAYS = 7;

/** ข้อความเตือนแบบสัมพัทธ์ตามจำนวนวันที่เหลือ */
export function dueRelativeText(days: number): string {
  if (days <= 0) return 'ครบกำหนดวันนี้';
  if (days === 1) return 'ครบกำหนดพรุ่งนี้';
  return `อีก ${days} วัน`;
}
