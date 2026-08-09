import type { APIRoute } from 'astro';
import { getAuth } from '../../../lib/auth/server.ts';

export const prerender = false;

export const ALL: APIRoute = async (context) => {
  try {
    const auth = getAuth();
    const response = await auth.handler(context.request);
    // A rejected profile returns Better Auth's normal redirect. A private
    // directory failure throws inside the profile lookup and reaches Better
    // Auth as a server error, which must not be presented as a permission denial.
    if (
      context.url.pathname.endsWith('/callback/google') &&
      response.status >= 500
    ) {
      return new Response('Staff access is temporarily unavailable. Please try again later.', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication is unavailable.';
    return new Response(message, {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
};
