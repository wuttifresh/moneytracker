import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Use the edge-safe config (no Prisma/bcrypt) for route protection.
export default NextAuth(authConfig).auth;

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
