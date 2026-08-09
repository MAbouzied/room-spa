import { defineMiddleware } from 'astro:middleware';
import { ADMIN_AUTH_DISABLED } from 'astro:env/server';
import { assertStaffAccess, sanitizeReturnUrl } from './lib/auth/authorization.ts';
import { adminApiError } from './lib/staff-access/http.ts';

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isAdminApi(pathname: string): boolean {
  return pathname === '/api/admin' || pathname.startsWith('/api/admin/');
}

function isAuthSurface(pathname: string): boolean {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    isAdminPage(pathname) ||
    pathname.startsWith('/api/auth') ||
    isAdminApi(pathname)
  );
}

function withPrivateHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function unavailableResponse(isApi: boolean): Response {
  if (isApi) return adminApiError('STAFF_STORE_UNAVAILABLE');
  return withPrivateHeaders(
    new Response('Staff access is temporarily unavailable. Please try again later.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
  );
}

function forbiddenResponse(isApi: boolean): Response {
  if (isApi) return adminApiError('FORBIDDEN');
  return withPrivateHeaders(
    new Response('Access denied. This Google account is not authorized for staff admin.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }),
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname.replace(/\/$/, '') || '/';
  const adminPage = isAdminPage(pathname);
  const adminApi = isAdminApi(pathname);
  const protectedSurface = adminPage || adminApi;
  const authSurface = isAuthSurface(pathname);

  context.locals.user = null;
  context.locals.session = null;
  context.locals.staffAccess = null;

  // Load Better Auth only on dynamic auth surfaces so prerendering public pages
  // does not pull staff-only runtime dependencies into their render path.
  if (authSurface && !ADMIN_AUTH_DISABLED) {
    try {
      const { getAuth } = await import('./lib/auth/server.ts');
      const auth = getAuth();
      const session = await auth.api.getSession({ headers: context.request.headers });
      if (session) {
        context.locals.user = session.user;
        context.locals.session = session.session;
      }

      // OAuth endpoints manage their own callback authorization. All staff pages
      // and admin APIs must recheck the private directory on every request.
      const shouldRecheckDirectory = Boolean(session) && (protectedSurface || pathname === '/login');
      if (shouldRecheckDirectory) {
        const identity = assertStaffAccess({
          email: context.locals.user?.email,
          emailVerified: context.locals.user?.emailVerified ?? null,
        });

        if (identity.ok) {
          const { getStaffAccessService } = await import('./lib/staff-access/server.ts');
          context.locals.staffAccess = await getStaffAccessService()
            .findApprovedByEmail(context.locals.user?.email);
        }
      }
    } catch {
      context.locals.user = null;
      context.locals.session = null;
      context.locals.staffAccess = null;

      if (protectedSurface || pathname === '/login') {
        return unavailableResponse(adminApi);
      }
    }
  }

  if (!ADMIN_AUTH_DISABLED && protectedSurface) {
    if (!context.locals.user) {
      if (adminApi) return adminApiError('UNAUTHENTICATED');
      const returnTo = sanitizeReturnUrl(`${pathname}${context.url.search}`);
      return withPrivateHeaders(
        context.redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`),
      );
    }

    const access = assertStaffAccess({
      email: context.locals.user.email,
      emailVerified: context.locals.user.emailVerified ?? null,
      approved: Boolean(context.locals.staffAccess),
      requireApproved: true,
    });
    if (!access.ok) return forbiddenResponse(adminApi);
  }

  const response = await next();
  return authSurface ? withPrivateHeaders(response) : response;
});
