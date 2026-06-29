'use server';

import { AuthError } from 'next-auth';
import { ZodError } from 'zod';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth, signIn, signOut, updateSession } from '@/auth';
import { prisma } from '@/lib/prisma';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from '@/lib/validations/auth';
import { isThemeId } from '@/lib/themes';

export type AuthState =
  | {
      fieldErrors?: Record<string, string[]>;
      formError?: string;
      success?: boolean;
    }
  | undefined;

const BCRYPT_ROUNDS = 12;

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? '_form';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** Credentials login (used by the /login form). */
export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) {
      return { formError: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' };
    }
    throw error; // redirect signal — let Next handle it
  }
  return undefined;
}

/** Register a new email/password user, then sign them in. */
export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { fieldErrors: { email: ['อีเมลนี้ถูกใช้งานแล้ว'] } };
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.create({ data: { name, email, hashedPassword } });

  try {
    await signIn('credentials', { email, password, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) {
      return { formError: 'สมัครสำเร็จ แต่เข้าสู่ระบบอัตโนมัติไม่สำเร็จ กรุณาเข้าสู่ระบบ' };
    }
    throw error;
  }
  return undefined;
}

/** Change password for the current (credentials) user. */
export async function changePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const session = await auth();
  if (!session?.user?.id) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.hashedPassword) {
    return {
      formError: 'บัญชีนี้เข้าสู่ระบบผ่าน Google จึงยังไม่มีรหัสผ่าน',
    };
  }

  const valid = await bcrypt.compare(
    parsed.data.currentPassword,
    user.hashedPassword,
  );
  if (!valid) {
    return { fieldErrors: { currentPassword: ['รหัสผ่านปัจจุบันไม่ถูกต้อง'] } };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  await prisma.user.update({
    where: { id: user.id },
    data: { hashedPassword },
  });
  return { success: true };
}

/** Persist the chosen theme for the signed-in user and refresh the JWT. */
export async function updateThemeAction(theme: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || !isThemeId(theme)) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { theme },
  });
  await updateSession({ user: { theme } });
  revalidatePath('/', 'layout');
}

export async function signInWithGoogle(): Promise<void> {
  await signIn('google', { redirectTo: '/' });
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}
