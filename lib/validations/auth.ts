import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(60, 'ชื่อยาวเกินไป'),
    email: z.string().email('อีเมลไม่ถูกต้อง'),
    password: z.string().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
