import {
  isStaffAccessError,
  staffAccessErrorMessage,
  type StaffAccessErrorCode,
} from './errors.ts';

export type AdminApiErrorCode =
  | StaffAccessErrorCode
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN';

const adminApiMessages: Record<Exclude<AdminApiErrorCode, StaffAccessErrorCode>, string> = {
  UNAUTHENTICATED: 'Authentication is required.',
  FORBIDDEN: 'You do not have permission to perform this action.',
};

const adminApiStatuses: Record<AdminApiErrorCode, number> = {
  INVALID_EMAIL: 400,
  DUPLICATE_EMAIL: 409,
  CURRENT_USER_PROTECTED: 403,
  NOT_FOUND: 404,
  STAFF_STORE_UNAVAILABLE: 503,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
};

export function privateJson(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export function adminApiError(code: AdminApiErrorCode): Response {
  const message = isStaffAccessCode(code)
    ? staffAccessErrorMessage(code)
    : adminApiMessages[code];
  return privateJson({ error: { code, message } }, adminApiStatuses[code]);
}

export function adminApiErrorFrom(error: unknown): Response {
  if (isStaffAccessError(error)) return adminApiError(error.code);
  return adminApiError('STAFF_STORE_UNAVAILABLE');
}

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readEmailBody(request: Request): Promise<string | undefined> {
  try {
    const body = await request.json() as unknown;
    if (!body || typeof body !== 'object') return undefined;
    const email = (body as { email?: unknown }).email;
    return typeof email === 'string' ? email : undefined;
  } catch {
    return undefined;
  }
}

function isStaffAccessCode(code: AdminApiErrorCode): code is StaffAccessErrorCode {
  return (['INVALID_EMAIL', 'DUPLICATE_EMAIL', 'CURRENT_USER_PROTECTED', 'NOT_FOUND', 'STAFF_STORE_UNAVAILABLE'] as const)
    .includes(code as StaffAccessErrorCode);
}
