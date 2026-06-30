import Link from 'next/link';
import type { Metadata } from 'next';
import { AuthDivider, AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/login-form';
import { GoogleButton } from '@/components/auth/google-button';

export const metadata: Metadata = { title: 'เข้าสู่ระบบ — MoneyTracker' };

export default function LoginPage() {
  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับกลับมา 👋">
      <LoginForm />
      <AuthDivider />
      <GoogleButton />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        ยังไม่มีบัญชี?{' '}
        <Link href="/register" className="font-medium text-primary hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </AuthShell>
  );
}
