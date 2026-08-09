import { normalizeStaffEmail } from '../staff-access/validation.ts';

export const normalizeEmail = normalizeStaffEmail;

export function isGoogleEmailVerified(profile: {
  email?: string | null;
  email_verified?: boolean | string | null;
  verified_email?: boolean | string | null;
}): boolean {
  const verified = profile.email_verified ?? profile.verified_email;
  if (verified === true || verified === 'true') return true;
  return false;
}

/**
 * Safe same-origin return paths for post-login redirects.
 * Rejects protocol-relative URLs, external hosts, and auth loops.
 */
export function sanitizeReturnUrl(
  candidate: string | undefined | null,
  options?: { fallback?: string },
): string {
  const fallback = options?.fallback ?? '/admin';
  if (!candidate) return fallback;

  const trimmed = candidate.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;
  if (trimmed.includes('\\') || trimmed.includes('\0')) return fallback;

  try {
    // Resolve against a fixed origin so only path/query/hash are accepted.
    const url = new URL(trimmed, 'https://example.invalid');
    if (url.origin !== 'https://example.invalid') return fallback;
    const path = `${url.pathname}${url.search}${url.hash}` || '/';
    if (
      path === '/login' ||
      path.startsWith('/login?') ||
      path.startsWith('/api/auth') ||
      path.startsWith('/api/')
    ) {
      return fallback;
    }
    return path;
  } catch {
    return fallback;
  }
}

export function assertStaffAccess(options: {
  email?: string | null;
  emailVerified?: boolean | null;
  approved?: boolean;
  requireApproved?: boolean;
}): { ok: true } | { ok: false; reason: 'unauthenticated' | 'unverified' | 'not_approved' } {
  if (!options.email) return { ok: false, reason: 'unauthenticated' };
  if (options.emailVerified !== true) return { ok: false, reason: 'unverified' };
  if (options.requireApproved === true && options.approved !== true) {
    return { ok: false, reason: 'not_approved' };
  }
  return { ok: true };
}

export function loginErrorMessage(error: string | null | undefined): string | null {
  if (error === 'unable_to_get_user_info') {
    return 'You don’t have permission to access the admin dashboard.';
  }
  if (error === 'staff_store_unavailable') {
    return 'Staff access is temporarily unavailable. Please try again later.';
  }
  if (error) return 'Sign-in could not be completed. Please try again.';
  return null;
}
