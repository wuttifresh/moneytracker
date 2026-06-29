import type { NextAuthConfig } from 'next-auth';
import { DEFAULT_THEME, isThemeId, type ThemeId } from '@/lib/themes';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Edge-safe auth config (no Prisma / bcrypt imports) — shared by `auth.ts` and
 * imported on its own by `middleware.ts` so the edge bundle stays lean.
 * Providers and the Prisma adapter are added in `auth.ts`.
 */
export const authConfig = {
  // Accept both the Auth.js v5 name and the classic NextAuth name.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isPublic = PUBLIC_PATHS.includes(nextUrl.pathname);

      if (isPublic) {
        // Signed-in users have no business on the login/register pages.
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }
      // Everything else requires a session (redirects to signIn page).
      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? token.id;
        const theme = (user as { theme?: ThemeId }).theme;
        token.theme = isThemeId(theme) ? theme : DEFAULT_THEME;
      }
      const updatedTheme = session?.user?.theme;
      if (trigger === 'update' && isThemeId(updatedTheme)) {
        token.theme = updatedTheme;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id =
          (typeof token.id === 'string' ? token.id : token.sub) ??
          session.user.id;
        session.user.theme = isThemeId(token.theme)
          ? token.theme
          : DEFAULT_THEME;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
