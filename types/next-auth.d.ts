import type { DefaultSession } from 'next-auth';
import type { ThemeId } from '@/lib/themes';

// Augment NextAuth types so `session.user.id` / `token.theme` are typed.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      theme: ThemeId;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    theme: ThemeId;
  }
}
