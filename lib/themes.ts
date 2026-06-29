// Single source of truth for available UI themes.
// CSS variable values for each theme live in app/globals.css ([data-theme='...']).

export const THEMES = [
  { id: 'dark', label: 'มืด เท่', swatch: '#5b8cff' },
  { id: 'light', label: 'สว่าง คลาสสิก', swatch: '#2563eb' },
  { id: 'cute', label: 'พาสเทล ชมพู', swatch: '#ec4899' },
  { id: 'hitech', label: 'ไฮเทค นีออน', swatch: '#22d3ee' },
  { id: 'soft-warm', label: 'Soft Warm', swatch: '#c8a27a' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);

export const DEFAULT_THEME: ThemeId = 'dark';

export const THEME_COOKIE = 'theme';

export function isThemeId(value: string | undefined | null): value is ThemeId {
  return value != null && (THEME_IDS as readonly string[]).includes(value);
}
