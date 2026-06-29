'use client';

import { useFormState } from 'react-dom';
import { authenticate } from '@/server/actions/auth';
import { Field, FormError, SubmitButton } from './form-controls';

export function LoginForm() {
  const [state, action] = useFormState(authenticate, undefined);

  return (
    <form action={action} className="space-y-4">
      <FormError message={state?.formError} />
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
        autoComplete="current-password"
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton pendingText="กำลังเข้าสู่ระบบ...">เข้าสู่ระบบ</SubmitButton>
    </form>
  );
}
