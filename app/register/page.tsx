import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthDivider, AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from '@/components/auth/register-form';
import { GoogleButton } from '@/components/auth/google-button';

export const metadata: Metadata = { title: 'สมัครสมาชิก — MoneyPad' };

export default function RegisterPage() {
  return (
    <AuthShell title="สมัครสมาชิก" subtitle="เริ่มต้นจัดการเงินของคุณวันนี้">
      <RegisterForm />
      <AuthDivider />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </AuthShell>
  );
}
