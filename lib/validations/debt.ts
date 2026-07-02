import { z } from 'zod';

/** ประเภทหนี้สำหรับ dropdown — เก็บค่าเป็นภาษาไทยตรง ๆ */
export const DEBT_TYPES = [
  'สินเชื่อ',
  'บัตรเครดิต',
  'สินเชื่อบ้าน',
  'สินเชื่อรถ',
  'สินเชื่อส่วนบุคคล',
  'อื่น ๆ',
] as const;

const money = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, msg);

const optionalMoney = (msg: string) =>
  z
    .union([z.literal(''), money(msg)])
    .optional()
    .transform((v) => (v ? v : undefined));

export const debtSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อหนี้').max(60, 'ชื่อยาวเกินไป'),
  debtType: z
    .string()
    .trim()
    .max(40, 'ประเภทยาวเกินไป')
    .optional()
    .transform((v) => (v ? v : undefined)),
  lender: z
    .string()
    .trim()
    .max(80, 'ชื่อผู้ให้กู้ยาวเกินไป')
    .optional()
    .transform((v) => (v ? v : undefined)),
  principal: money('ยอดเริ่มต้นไม่ถูกต้อง').refine(
    (v) => Number(v) > 0,
    'ยอดเริ่มต้นต้องมากกว่า 0',
  ),
  balance: optionalMoney('ยอดคงเหลือไม่ถูกต้อง'),
  annualRate: z
    .union([
      z.literal(''),
      z
        .string()
        .trim()
        .regex(/^\d+(\.\d{1,3})?$/, 'อัตราดอกเบี้ยไม่ถูกต้อง')
        .refine((v) => Number(v) <= 100, 'อัตราดอกเบี้ยต้องไม่เกิน 100'),
    ])
    .optional()
    .transform((v) => (v ? v : undefined)),
  minPayment: optionalMoney('ยอดชำระขั้นต่ำไม่ถูกต้อง'),
  dueDay: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(31)])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v))
    .refine(
      (v) => v === undefined || (v >= 1 && v <= 31),
      'วันครบกำหนดต้องอยู่ระหว่าง 1-31',
    ),
  termMonths: z
    .union([
      z.literal(''),
      z.coerce
        .number()
        .int('จำนวนงวดต้องเป็นจำนวนเต็ม')
        .min(1, 'อย่างน้อย 1 งวด')
        .max(600, 'จำนวนงวดมากเกินไป'),
    ])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  startDate: z
    .string()
    .min(1, 'กรุณาเลือกวันเริ่มต้นสัญญา')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'วันที่ไม่ถูกต้อง'),
  endDate: z
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
});

export type DebtInput = z.infer<typeof debtSchema>;
