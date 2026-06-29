'use client';

import { useFormState } from 'react-dom';
import { registerUser } from '@/server/actions/auth';
import { Field, FormError, SubmitButton } from './form-controls';

export function RegisterForm() {
  const [state, action] = useFormState(registerUser, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.formError} />
      <Field label="ชื่อ" name="name" autoComplete="name" errors={state?.fieldErrors?.name} />
      <Field
        label="อีเมล"
        name="email"
        type="email"
        autoComplete="email"
        errors={state?.fieldErrors?.email}
      />
      <Field
        label="รหัสผ่าน"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.password}
      />
      <Field
        label="ยืนยันรหัสผ่าน"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        errors={state?.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingText="กำลังสมัคร...">สมัครสมาชิก</SubmitButton>
    </form>
  );
}
