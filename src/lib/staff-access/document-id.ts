import { normalizeStaffEmail } from './validation.ts';

/** Stable, safe Sanity document ID used to make email creation collision-safe. */
export async function staffAccessDocumentId(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(normalizeStaffEmail(email));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)]
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
  return `staffAccess-${hex}`;
}
