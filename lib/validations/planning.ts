import { z } from 'zod';

const money = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, msg);

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อเป้าหมาย').max(60, 'ชื่อยาวเกินไป'),
  targetAmount: money('จำนวนเงินเป้าหมายไม่ถูกต้อง').refine(
    (v) => Number(v) > 0,
    'เป้าหมายต้องมากกว่า 0',
  ),
  currentAmount: money('จำนวนเงินไม่ถูกต้อง').optional().or(z.literal('')),
  deadline: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (v) => v === undefined || v === '' || !Number.isNaN(Date.parse(v)),
      'วันที่ไม่ถูกต้อง',
    ),
  note: z.string().trim().max(200, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

export const addSavingsSchema = z.object({
  amount: money('จำนวนเงินไม่ถูกต้อง').refine(
    (v) => Number(v) > 0,
    'จำนวนเงินต้องมากกว่า 0',
  ),
});

export type GoalInput = z.infer<typeof goalSchema>;
