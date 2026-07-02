import { z } from 'zod';

const money = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, msg)
    .refine((v) => Number(v) >= 0, msg);

export const debtStatementSchema = z
  .object({
    statementMonth: z
      .string()
      .trim()
      .min(1, 'กรุณาเลือกเดือนของรอบบิล')
      .refine((v) => !Number.isNaN(Date.parse(v)), 'เดือนไม่ถูกต้อง'),
    fullBalance: money('ยอดเต็มไม่ถูกต้อง'),
    minPayment: money('ยอดขั้นต่ำไม่ถูกต้อง'),
    dueDate: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine(
        (v) => v === undefined || !Number.isNaN(Date.parse(v)),
        'วันที่ไม่ถูกต้อง',
      ),
    note: z
      .string()
      .trim()
      .max(200, 'หมายเหตุยาวเกินไป')
      .optional()
      .or(z.literal('')),
  })
  .refine((d) => Number(d.minPayment) <= Number(d.fullBalance), {
    message: 'ยอดขั้นต่ำต้องไม่มากกว่ายอดเต็ม',
    path: ['minPayment'],
  });

export type DebtStatementInput = z.infer<typeof debtStatementSchema>;
