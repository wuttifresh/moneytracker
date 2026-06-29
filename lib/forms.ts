import type { ZodError } from 'zod';

export type ActionState =
  | {
      fieldErrors?: Record<string, string[]>;
      formError?: string;
      success?: boolean;
    }
  | undefined;

export function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() ?? '_form';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
