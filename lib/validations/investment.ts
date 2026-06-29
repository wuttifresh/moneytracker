import { z } from 'zod';

const decimal8 = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,8})?$/, msg);

export const INVESTMENT_KINDS = [
  'กองทุนรวม',
  'หุ้น',
  'คริปโต',
  'ทองคำ',
  'ตราสารหนี้',
  'อื่นๆ',
] as const;

export const investmentSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อสินทรัพย์').max(60, 'ชื่อยาวเกินไป'),
  kind: z.string().trim().max(30).optional().or(z.literal('')),
  units: decimal8('จำนวนหน่วยไม่ถูกต้อง').refine(
    (v) => Number(v) > 0,
    'จำนวนหน่วยต้องมากกว่า 0',
  ),
  costPerUnit: decimal8('ต้นทุน/หน่วยไม่ถูกต้อง'),
  currentPrice: decimal8('ราคาปัจจุบัน/หน่วยไม่ถูกต้อง'),
  note: z.string().trim().max(200, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
