import { z } from 'zod';

const money = (msg: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, msg);

export const ASSET_KINDS = [
  'อสังหาริมทรัพย์',
  'ยานพาหนะ',
  'อุปกรณ์/เครื่องใช้ไฟฟ้า',
  'เครื่องประดับ/ของสะสม',
  'อื่นๆ',
] as const;

export const assetSchema = z
  .object({
    name: z.string().trim().min(1, 'กรุณากรอกชื่อทรัพย์สิน').max(60, 'ชื่อยาวเกินไป'),
    kind: z.string().trim().max(40).optional().or(z.literal('')),
    purchaseValue: money('มูลค่าซื้อไม่ถูกต้อง').refine(
      (v) => Number(v) > 0,
      'มูลค่าซื้อต้องมากกว่า 0',
    ),
    salvageValue: money('มูลค่าซากไม่ถูกต้อง').optional().or(z.literal('')),
    purchaseDate: z
      .string()
      .min(1, 'กรุณาเลือกวันที่ซื้อ')
      .refine((v) => !Number.isNaN(Date.parse(v)), 'วันที่ไม่ถูกต้อง'),
    usefulLifeYears: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine(
        (v) =>
          v === undefined ||
          v === '' ||
          (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 100),
        'อายุการใช้งานต้องเป็น 1-100 ปี',
      ),
    note: z.string().trim().max(200, 'หมายเหตุยาวเกินไป').optional().or(z.literal('')),
  })
  .refine(
    (d) => Number(d.salvageValue || '0') <= Number(d.purchaseValue),
    { message: 'มูลค่าซากต้องไม่เกินมูลค่าซื้อ', path: ['salvageValue'] },
  );

export type AssetInput = z.infer<typeof assetSchema>;
