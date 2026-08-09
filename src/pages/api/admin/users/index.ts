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

export const GET: APIRoute = async ({ locals }) => {
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;

  try {
    const users = await getStaffAccessService().list(locals.user?.email);
    return privateJson({ users });
  } catch (error) {
    return adminApiErrorFrom(error);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  const denied = requireAdminApiAccess(locals);
  if (denied) return denied;
  if (!hasSameOrigin(request)) return adminApiError('FORBIDDEN');

  try {
    const user = await getStaffAccessService().create(await readEmailBody(request));
    return privateJson({ user: { ...user, isCurrent: false } }, 201);
  } catch (error) {
    return adminApiErrorFrom(error);
  }
};
