import { cache } from 'react';
import { auth } from '@/auth';

/**
 * Request-deduplicated session. The layout, AppShell, and each page all need
 * the session; wrapping auth() in React cache() means it is resolved once per
 * request instead of 3-4 times.
 */
export const getSession = cache(auth);
