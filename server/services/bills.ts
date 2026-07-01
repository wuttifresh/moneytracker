import { prisma } from '@/lib/prisma';

export type BillDTO = {
  id: string;
  name: string;
  billType: string | null;
  amount: string;
  dueDay: number;
  isActive: boolean;
  note: string | null;
};

export type BillForMonth = BillDTO & { paid: boolean };

type Dec = { toString(): string };

type BillRow = {
  id: string;
  name: string;
  billType: string | null;
  amount: Dec;
  dueDay: number;
  isActive: boolean;
  note: string | null;
};

function toDTO(b: BillRow): BillDTO {
  return {
    id: b.id,
    name: b.name,
    billType: b.billType,
    amount: b.amount.toString(),
    dueDay: b.dueDay,
    isActive: b.isActive,
    note: b.note,
  };
}

export async function listBills(userId: string): Promise<BillDTO[]> {
  const rows = await prisma.bill.findMany({
    where: { userId, deletedAt: null },
    orderBy: { dueDay: 'asc' },
  });
  return rows.map(toDTO);
}

/** บิลที่ยังเปิดใช้งาน พร้อมสถานะจ่ายแล้วหรือยังของปี/เดือนที่ระบุ */
export async function listBillsForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<BillForMonth[]> {
  const rows = await prisma.bill.findMany({
    where: { userId, deletedAt: null, isActive: true },
    orderBy: { dueDay: 'asc' },
    include: { payments: { where: { year, month }, select: { id: true } } },
  });
  return rows.map((b) => ({ ...toDTO(b), paid: b.payments.length > 0 }));
}
