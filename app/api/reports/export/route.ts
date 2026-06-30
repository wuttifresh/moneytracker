import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

function csvCell(value: string): string {
  return /[",\n\r]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

export async function GET(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const rows = await prisma.transaction.findMany({
    where: { userId: session.user.id, deletedAt: null, date: { gte: start, lt: end } },
    orderBy: { date: 'asc' },
    include: { category: { select: { name: true } } },
  });

  const BOM = '﻿';
  const header = ['วันที่', 'ประเภท', 'หมวดหมู่', 'จำนวนเงิน', 'หมายเหตุ'];
  const lines = rows.map((r) =>
    [
      r.date.toISOString().slice(0, 10),
      r.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      r.category.name,
      r.amount.toString(),
      r.note ?? '',
    ]
      .map((v) => csvCell(String(v)))
      .join(','),
  );

  // BOM so Excel detects UTF-8 (Thai); CRLF line endings.
  const csv = BOM + [header.join(','), ...lines].join('\r\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="moneytracker-report-${year}.csv"`,
    },
  });
}
