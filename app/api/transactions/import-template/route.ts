import * as XLSX from 'xlsx';
import { auth } from '@/auth';
import { getCategories } from '@/server/services/categories';

export const runtime = 'nodejs';

/** Today as YYYY-MM-DD for friendly example rows. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const categories = await getCategories(session.user.id, 'expense');
  const exampleCat = categories[0]?.name ?? 'อาหาร';
  const today = todayISO();

  // Sheet 1 — data to fill in (header row is what the importer reads).
  const dataSheet = XLSX.utils.aoa_to_sheet([
    ['วันที่', 'หมวดหมู่', 'จำนวนเงิน', 'หมายเหตุ'],
    [today, exampleCat, 120.5, 'ตัวอย่าง: ข้าวกลางวัน'],
    [today, categories[1]?.name ?? 'เดินทาง', 45, 'ตัวอย่าง: ค่าเดินทาง'],
  ]);
  dataSheet['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 30 }];

  // Sheet 2 — instructions.
  const guideSheet = XLSX.utils.aoa_to_sheet([
    ['วิธีนำเข้ารายจ่าย (Import)'],
    [''],
    ['1. กรอกข้อมูลในชีต "รายจ่าย" โดยห้ามลบหรือแก้แถวหัวตาราง (วันที่ / หมวดหมู่ / จำนวนเงิน / หมายเหตุ)'],
    ['2. วันที่: ใช้รูปแบบ ปปปป-ดด-วว เช่น 2026-06-30 (รองรับ วว/ดด/ปปปป และปี พ.ศ. ด้วย)'],
    ['3. จำนวนเงิน: เป็นตัวเลขบวก ทศนิยมได้ไม่เกิน 2 ตำแหน่ง (ใส่ , คั่นหลักได้)'],
    ['4. หมวดหมู่: ถ้าชื่อยังไม่มีในระบบ จะถูกสร้างใหม่ให้อัตโนมัติ (ดูชื่อที่มีอยู่ในชีต "หมวดหมู่ของคุณ")'],
    ['5. หมายเหตุ: ไม่บังคับ (สูงสุด 200 ตัวอักษร)'],
    ['6. บันทึกไฟล์เป็น .xlsx หรือ .csv แล้วอัปโหลดที่หน้า "รายงาน" → นำเข้ารายจ่าย'],
    [''],
    ['หมายเหตุ: ไฟล์นี้ใช้สำหรับ "รายจ่าย" เท่านั้น แถวที่เป็นรายรับจะถูกข้าม'],
  ]);
  guideSheet['!cols'] = [{ wch: 90 }];

  // Sheet 3 — the user's existing expense category names for reference.
  const catRows = categories.length
    ? categories.map((c) => [c.name])
    : [['(ยังไม่มีหมวดหมู่ — พิมพ์ชื่อใหม่ได้เลย ระบบจะสร้างให้)']];
  const catSheet = XLSX.utils.aoa_to_sheet([['หมวดหมู่รายจ่ายของคุณ'], ...catRows]);
  catSheet['!cols'] = [{ wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, 'รายจ่าย');
  XLSX.utils.book_append_sheet(wb, guideSheet, 'วิธีใช้');
  XLSX.utils.book_append_sheet(wb, catSheet, 'หมวดหมู่ของคุณ');

  const buf: Buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="moneytracker-expense-template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}
