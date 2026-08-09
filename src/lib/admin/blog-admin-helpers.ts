import { createBlogSlug } from '../../modules/blog/lib/slug.ts';

export const ADMIN_TITLE_MIN = 8;
export const ADMIN_TITLE_MAX = 120;
export const ADMIN_EXCERPT_MIN = 40;
export const ADMIN_EXCERPT_MAX = 220;

export interface AdminPostPayload {
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentJson?: string;
  category?: string;
  author?: string;
  coverUrl?: string;
  coverAlt?: string;
  coverAssetId?: string;
  coverWidth?: number | null;
  coverHeight?: number | null;
  relatedServiceId?: string;
  featured?: boolean;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Normalize the admin blog save/publish JSON body, including Lexical contentJson. */
export function readAdminPostPayload(payload: Partial<Record<string, unknown>>): AdminPostPayload {
  const contentJson = optionalString(payload.contentJson)?.trim();
  return {
    title: String(payload.title ?? ''),
    slug: String(payload.slug ?? ''),
    excerpt: String(payload.excerpt ?? ''),
    contentHtml: String(payload.contentHtml ?? ''),
    ...(contentJson ? { contentJson } : {}),
    category: optionalString(payload.category),
    author: optionalString(payload.author),
    coverUrl: optionalString(payload.coverUrl),
    coverAlt: optionalString(payload.coverAlt),
    coverAssetId: optionalString(payload.coverAssetId),
    coverWidth: optionalNumber(payload.coverWidth),
    coverHeight: optionalNumber(payload.coverHeight),
    relatedServiceId: optionalString(payload.relatedServiceId),
    featured: payload.featured === true,
  };
}

export interface AdminImportUrlBody {
  url: string;
}

/** Validate JSON body for POST /api/admin/blog/assets/import. */
export function readAdminImportUrlBody(payload: Partial<Record<string, unknown>>): AdminImportUrlBody {
  const url = typeof payload.url === 'string' ? payload.url.trim() : '';
  if (!url) throw new Error('أدخل رابط الصورة.');
  return { url };
}

/** Existing posts keep their established URL unless the editor changes it explicitly. */
export function shouldKeepExistingBlogSlug(slug: string): boolean {
  return slug.trim().length > 0;
}

function stableDocumentIdHash(value: string): string {
  let hash = 14695981039346656037n;
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 1099511628211n);
  }
  return hash.toString(16).padStart(16, '0');
}

function adminTaxonomyDocumentId(prefix: string, value: string, fallback: string): string {
  const normalized = value.trim() || fallback;
  return `${prefix}-${stableDocumentIdHash(createBlogSlug(normalized) || fallback)}`;
}

/** Deterministic Sanity document id for a category label. */
export function adminCategoryDocumentId(label: string): string {
  return adminTaxonomyDocumentId('blog-category', label, 'general');
}

/** Deterministic Sanity document id for an author name. */
export function adminAuthorDocumentId(name: string): string {
  return adminTaxonomyDocumentId('blog-author', name, 'default');
}

/**
 * Preserve the original publication timestamp after first publish.
 * Draft documents intentionally keep publishedAt after unpublish/edit so a later
 * republish restores the same SEO date instead of jumping to "now".
 */
export function resolveAdminPublishedAt(
  publish: boolean,
  existingPublishedAt: string | null | undefined,
  timestamp: string,
): string | undefined {
  if (existingPublishedAt) return existingPublishedAt;
  return publish ? timestamp : undefined;
}

/** True for Sanity draft document ids (`drafts.<publishedId>`). */
export function isSanityDraftId(rawId: string): boolean {
  return rawId.startsWith('drafts.');
}

/**
 * Admin list status must treat Sanity draft ids as drafts even when publishedAt
 * is preserved for SEO republish. Draft ids intentionally override GROQ status
 * so a stale `published` projection cannot mislabel an unpublished draft.
 */
export function resolveSanityAdminStatus(
  rawId: string,
  groqStatus: unknown,
): 'draft' | 'published' {
  if (isSanityDraftId(rawId)) return 'draft';
  return groqStatus === 'published' ? 'published' : 'draft';
}

export function assertAdminPublishCopy(input: { title: string; excerpt: string }): void {
  const title = input.title.trim();
  const excerpt = input.excerpt.trim();
  const titleLength = Array.from(title).length;
  const excerptLength = Array.from(excerpt).length;

  if (!title || titleLength < ADMIN_TITLE_MIN || titleLength > ADMIN_TITLE_MAX) {
    throw new Error(`عنوان المقال يجب أن يكون بين ${ADMIN_TITLE_MIN} و ${ADMIN_TITLE_MAX} حرفاً.`);
  }
  if (!excerpt || excerptLength < ADMIN_EXCERPT_MIN || excerptLength > ADMIN_EXCERPT_MAX) {
    throw new Error(`مقدمة المقال يجب أن تكون بين ${ADMIN_EXCERPT_MIN} و ${ADMIN_EXCERPT_MAX} حرفاً.`);
  }
}
