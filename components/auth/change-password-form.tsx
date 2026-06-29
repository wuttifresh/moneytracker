'use client';

import { useFormState } from 'react-dom';
import { changePassword } from '@/server/actions/auth';
import {
  Field,
  FormError,
  FormSuccess,
  SubmitButton,
} from './form-controls';

export function ChangePasswordForm() {
  const [state, action] = useFormState(changePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.formError} />
      {state?.success && <FormSuccess message="เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" />}
      <Field
        label="รหัสผ่านปัจจุบัน"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        errors={state?.fieldErrors?.currentPassword}
      />
      <Field
        label="รหัสผ่านใหม่"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.newPassword}
      />
      <Field
        label="ยืนยันรหัสผ่านใหม่"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingText="กำลังบันทึก...">เปลี่ยนรหัสผ่าน</SubmitButton>
    </form>
  );
}
