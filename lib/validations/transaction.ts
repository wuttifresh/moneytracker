import { z } from 'zod';

export const txTypeSchema = z.enum(['income', 'expense']);

const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'จำนวนเงินไม่ถูกต้อง (ทศนิยมได้ 2 ตำแหน่ง)')
  .refine((v) => Number(v) > 0, 'จำนวนเงินต้องมากกว่า 0');

export const transactionSchema = z.object({
  type: txTypeSchema,
  amount: amountSchema,
  categoryId: z.string().min(1, 'กรุณาเลือกหมวดหมู่'),
  date: z
    .string()
    .min(1, 'กรุณาเลือกวันที่')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'วันที่ไม่ถูกต้อง'),
  note: z.string().trim().max(200, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อหมวดหมู่').max(40, 'ชื่อยาวเกินไป'),
  type: txTypeSchema,
  icon: z.string().trim().max(40).optional().or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'รหัสสีไม่ถูกต้อง')
    .optional()
    .or(z.literal('')),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
