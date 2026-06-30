import { z } from 'zod';

/** Selectable "remind me N days before" options shown in the UI. */
export const LEAD_DAY_CHOICES = [0, 1, 3, 7] as const;

export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  leadDays: z
    .array(z.coerce.number().int().min(0).max(31))
    .transform((arr) => Array.from(new Set(arr)).sort((a, b) => a - b)),
  hour: z.coerce.number().int().min(0).max(23),
  tzOffset: z.coerce.number().int().min(-720).max(840),
});

export type ReminderSettingsInput = z.infer<typeof reminderSettingsSchema>;
