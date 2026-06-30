import { getSession } from './session';
import { getServerTheme } from './theme-cookie';
import { isThemeId, type ThemeId } from './themes';

/**
 * Resolve the theme to render. Signed-in users carry their theme in the JWT
 * (authoritative across devices); guests fall back to the cookie. No DB hit.
 */
export async function getActiveTheme(): Promise<ThemeId> {
  const session = await getSession();
  const theme = session?.user?.theme;
  if (isThemeId(theme)) return theme;
  return getServerTheme();
}
