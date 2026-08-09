/**
 * Blog URLs are Arabic-first, but also keep existing Latin slugs valid. We deliberately
 * allow Unicode letters and numbers rather than transliterating Arabic titles into an
 * unstable Latin representation.
 */
const SLUG_PATTERN = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const TATWEEL = /\u0640/gu;

export const BLOG_SLUG_MIN_LENGTH = 3;
export const BLOG_SLUG_MAX_LENGTH = 96;

function characterLength(value: string): number {
  return Array.from(value).length;
}

function truncateCharacters(value: string, maxLength: number): string {
  return Array.from(value).slice(0, maxLength).join('');
}

/**
 * Canonicalize a title or manually entered slug into the URL format used everywhere
 * (client, API, Sanity projection, and public routes). This function is safe to call
 * on every title keystroke.
 */
export function createBlogSlug(value: string): string {
  return truncateCharacters(
    value
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase('ar')
      .replace(TATWEEL, '')
      .replace(ARABIC_DIACRITICS, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''),
    BLOG_SLUG_MAX_LENGTH,
  ).replace(/-+$/g, '');
}

/** Alias with an explicit name for server-side save handlers. */
export const normalizeBlogSlug = createBlogSlug;

export function isValidBlogSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  const length = characterLength(slug);
  return (
    length >= BLOG_SLUG_MIN_LENGTH &&
    length <= BLOG_SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(slug) &&
    slug === createBlogSlug(slug)
  );
}

export function assertValidBlogSlug(slug: string): void {
  if (!isValidBlogSlug(slug)) {
    throw new Error(
      `Invalid blog slug "${slug}". Use normalized Arabic or lowercase Latin kebab-case (3–96 characters).`,
    );
  }
}

/** Return the encoded public path for a known, validated blog slug. */
export function blogPath(slug: string): string {
  return `/blogs/${encodeURIComponent(slug)}`;
}

/**
 * Astro usually gives us a decoded route param, while direct requests can still carry
 * a percent-encoded segment. Decode once, reject path traversal, and canonicalize it
 * before using it in a repository query.
 */
export function normalizeBlogSlugParam(value: string | undefined): string | null {
  if (!value) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  if (!decoded || decoded.includes('/') || decoded.includes('\\') || decoded.includes('%')) return null;
  const slug = createBlogSlug(decoded);
  return isValidBlogSlug(slug) ? slug : null;
}

/** Deterministic heading id from Arabic/English text. */
export function headingIdFromText(text: string, used = new Set<string>()): string {
  const base =
    text
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section';

  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
}
