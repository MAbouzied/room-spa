import type { APIRoute } from 'astro';
import { requireAdminApiAccess } from '../../../../lib/staff-access/admin-auth.ts';
import {
  adminApiError,
  adminApiErrorFrom,
  hasSameOrigin,
  privateJson,
  readEmailBody,
} from '../../../../lib/staff-access/http.ts';
import { getStaffAccessService } from '../../../../lib/staff-access/server.ts';

export const prerender = false;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');

  try {
    const user = await getStaffAccessService().updateEmail(
      params.id,
      await readEmailBody(request),
      locals.user?.email,
    );
    return privateJson({ user: { ...user, isCurrent: false } });
  } catch (error) {
    return adminApiErrorFrom(error);
  }
};

export const DELETE: APIRoute = async ({ locals, params, request }) => {
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');

  try {
    await getStaffAccessService().delete(params.id, locals.user?.email);
    return privateJson({ ok: true });
  } catch (error) {
    return adminApiErrorFrom(error);
  }
};
