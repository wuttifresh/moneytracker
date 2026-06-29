'use client';

import { useFormStatus } from 'react-dom';

export function Field({
  label,
  name,
  type = 'text',
  errors,
  autoComplete,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  errors?: string[];
  autoComplete?: string;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={errors && errors.length > 0}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-ring"
      />
      {errors?.map((err) => (
        <p key={err} className="text-xs text-expense">
          {err}
        </p>
      ))}
    </div>
  );
}

export function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-expense/40 bg-expense/10 px-3 py-2 text-sm text-expense">
      {message}
    </p>
  );
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-income/40 bg-income/10 px-3 py-2 text-sm text-income">
      {message}
    </p>
  );
}
