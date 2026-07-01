import { z } from 'zod';

/** ประเภทบิลสำหรับ dropdown — เก็บค่าเป็นภาษาไทยตรง ๆ */
export const BILL_TYPES = [
  'สาธารณูปโภค',
  'ที่พัก',
  'โทรศัพท์/อินเทอร์เน็ต',
  'สมาชิกรายเดือน',
  'ประกัน',
  'อื่น ๆ',
] as const;

const money = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, msg);

export const billSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อบิล').max(60, 'ชื่อยาวเกินไป'),
  billType: z
    .string()
    .trim()
    .max(40, 'ประเภทยาวเกินไป')
    .optional()
    .transform((v) => (v ? v : undefined)),
  amount: money('ยอดเงินไม่ถูกต้อง').refine(
    (v) => Number(v) > 0,
    'ยอดเงินต้องมากกว่า 0',
  ),
  dueDay: z.coerce
    .number()
    .int('วันครบกำหนดต้องเป็นจำนวนเต็ม')
    .min(1, 'วันครบกำหนดต้องอยู่ระหว่าง 1-31')
    .max(31, 'วันครบกำหนดต้องอยู่ระหว่าง 1-31'),
  note: z
    .string()
    .trim()
    .max(200, 'หมายเหตุยาวเกินไป')
    .optional()
    .or(z.literal('')),
});

export type BillInput = z.infer<typeof billSchema>;
