'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { type ActionState } from '@/lib/forms';

/** Set or clear the profile image (by URL). Empty value reverts to initials. */
export async function updateAvatar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { formError: 'ยังไม่ได้เข้าสู่ระบบ' };

  const raw = String(formData.get('image') ?? '').trim();
  let image: string | null = null;

  if (raw !== '') {
    if (raw.length > 500) {
      return { fieldErrors: { image: ['ลิงก์ยาวเกินไป'] } };
    }
    try {
      const url = new URL(raw);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('bad protocol');
      }
      image = raw;
    } catch {
      return {
        fieldErrors: { image: ['ลิงก์รูปไม่ถูกต้อง (ต้องขึ้นต้นด้วย http/https)'] },
      };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image },
  });
  revalidatePath('/profile');
  revalidatePath('/', 'layout');
  return { success: true };
}
