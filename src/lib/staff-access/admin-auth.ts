import { ADMIN_AUTH_DISABLED } from 'astro:env/server';
import { adminApiError } from './http.ts';

/** Defense-in-depth for API handlers; middleware performs the live Sanity check. */
export function requireAdminApiAccess(locals: App.Locals): Response | null {
  if (ADMIN_AUTH_DISABLED === true) return null;
  if (!locals.user) return adminApiError('UNAUTHENTICATED');
  if (!locals.staffAccess) return adminApiError('FORBIDDEN');
  return null;
}
