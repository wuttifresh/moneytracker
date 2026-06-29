import { cookies } from 'next/headers';
import { DEFAULT_THEME, isThemeId, THEME_COOKIE, type ThemeId } from './themes';

/**
 * Read the active theme on the server (called from the root layout) so we can
 * stamp `data-theme` onto <html> before first paint and avoid a theme flash.
 */
export function getServerTheme(): ThemeId {
  const value = cookies().get(THEME_COOKIE)?.value;
  return isThemeId(value) ? value : DEFAULT_THEME;
}
