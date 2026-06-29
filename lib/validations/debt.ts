import { z } from 'zod';

export const debtSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อหนี้/เจ้าหนี้').max(60, 'ชื่อยาวเกินไป'),
  principal: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'ยอดเงินต้นไม่ถูกต้อง')
    .refine((v) => Number(v) > 0, 'ยอดเงินต้นต้องมากกว่า 0'),
  annualRate: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,3})?$/, 'อัตราดอกเบี้ยไม่ถูกต้อง')
    .refine((v) => Number(v) <= 100, 'อัตราดอกเบี้ยต้องไม่เกิน 100'),
  termMonths: z.coerce
    .number()
    .int('จำนวนงวดต้องเป็นจำนวนเต็ม')
    .min(1, 'อย่างน้อย 1 งวด')
    .max(600, 'จำนวนงวดมากเกินไป'),
  startDate: z
    .string()
    .min(1, 'กรุณาเลือกวันเริ่ม')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'วันที่ไม่ถูกต้อง'),
  note: z.string().trim().max(200, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

export type DebtInput = z.infer<typeof debtSchema>;
