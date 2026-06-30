import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import {
  runExpenseImport,
  MAX_IMPORT_FILE_BYTES,
  type ImportResult,
} from '@/server/services/import';

export const runtime = 'nodejs';

function json(body: ImportResult, status = 200): Response {
  return Response.json(body, { status });
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ ok: false, error: 'ยังไม่ได้เข้าสู่ระบบ' }, 401);
  }

  let file: FormDataEntryValue | null;
  try {
    const form = await req.formData();
    file = form.get('file');
  } catch {
    return json({ ok: false, error: 'อ่านไฟล์ไม่ได้' }, 400);
  }

  if (!(file instanceof File) || file.size === 0) {
    return json({ ok: false, error: 'กรุณาเลือกไฟล์ Excel หรือ CSV' }, 400);
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return json({ ok: false, error: 'ไฟล์ใหญ่เกินไป (เกิน 2 MB)' }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await runExpenseImport(session.user.id, bytes);

  if (result.ok) {
    revalidatePath('/');
    revalidatePath('/transactions');
    revalidatePath('/reports');
  }
  return json(result, result.ok ? 200 : 400);
}
