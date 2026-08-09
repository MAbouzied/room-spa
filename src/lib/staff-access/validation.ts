const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Canonical form used for every staff access lookup and mutation. */
export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidStaffEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export function parseStaffEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = normalizeStaffEmail(value);
  return isValidStaffEmail(email) ? email : null;
}
