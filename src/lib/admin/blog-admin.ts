import { createClient, type IdentifiedSanityDocumentStub, type SanityClient } from '@sanity/client';
import { BLOG_PROVIDER, SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID, SANITY_WRITE_TOKEN } from 'astro:env/server';
import { calculateReadingTimeMinutes } from '../../modules/blog/lib/reading-time.ts';
import type { BlogPost } from '../../modules/blog/model/blog-types.ts';
import { sanitizeBlogHtml, htmlToPlainText, lexicalJsonToHtml, lexicalJsonToPlainText, normalizeLexicalJson } from './blog-content.ts';
import {
  adminAuthorDocumentId,
  adminCategoryDocumentId,
  assertAdminPublishCopy,
  isSanityDraftId,
  resolveAdminPublishedAt,
  resolveSanityAdminStatus,
} from './blog-admin-helpers.ts';
import { listAdminServices } from './blog-admin-services.ts';
import { createBlogSlug, isValidBlogSlug } from '../../modules/blog/lib/slug.ts';

export { listAdminServices };

const DEFAULT_AUTHOR = 'فريق روم سبا';

export type AdminPostStatus = 'draft' | 'published';
export type AdminPostListStatus = AdminPostStatus | 'all';

export interface AdminPostListOptions {
  search?: string;
  status?: AdminPostListStatus;
}

export interface AdminPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  contentJson: string;
  status: AdminPostStatus;
  publishedAt: string | null;
  updatedAt: string;
  featured: boolean;
  category: string;
  author: string;
  coverUrl: string;
  coverAlt: string;
  coverAssetId: string;
  coverWidth: number | null;
  coverHeight: number | null;
  relatedServiceId: string;
}

export interface AdminPostInput {
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

function nowIso(): string {
  return new Date().toISOString();
}

function slugify(value: string): string { return createBlogSlug(value); }

// Local mode starts empty by design. It is only an in-memory workspace for testing
// the admin editor when a database provider is not configured; no fixture posts are seeded.
const mockStore = new Map<string, AdminPost>();

function emptyAdminDraft(id: string): AdminPost {
  return {
    id,
    title: '',
    slug: '',
    excerpt: '',
    contentHtml: '',
    contentJson: '',
    status: 'draft',
    publishedAt: null,
    updatedAt: nowIso(),
    featured: false,
    category: 'عام',
    author: DEFAULT_AUTHOR,
    coverUrl: '',
    coverAlt: '',
    coverAssetId: '',
    coverWidth: null,
    coverHeight: null,
    relatedServiceId: '',
  };
}

export async function reserveAdminDraft(reservationId: string): Promise<AdminPost> {
  const id = reservationId.trim();
  if (!id || !/^[a-zA-Z0-9_-]{8,100}$/.test(id)) throw new Error('معرف المسودة غير صالح.');
  if (BLOG_PROVIDER !== 'sanity') {
    const existing = mockStore.get(id);
    if (existing) {
      if (existing.status !== 'draft') throw new Error('لا يمكن استخدام معرف مقال منشور لمسودة جديدة.');
      return existing;
    }
    const draft = emptyAdminDraft(id);
    mockStore.set(id, draft);
    return draft;
  }

  const existing = await getAdminPost(id);
  if (existing) {
    if (existing.status !== 'draft') throw new Error('لا يمكن استخدام معرف مقال منشور لمسودة جديدة.');
    return existing;
  }
  const client = getSanityClient();
  const now = nowIso();
  const categoryLabel = 'عام';
  const authorName = DEFAULT_AUTHOR;
  const categoryId = adminCategoryDocumentId(categoryLabel);
  const authorId = adminAuthorDocumentId(authorName);
  await client
    .transaction()
    .createIfNotExists({
      _id: categoryId,
      _type: 'blogCategory',
      categoryId: { _type: 'slug', current: createBlogSlug(categoryLabel) || 'general' },
      label: categoryLabel,
    })
    .createIfNotExists({ _id: authorId, _type: 'blogAuthor', name: authorName })
    .createOrReplace({
      _id: `drafts.${id}`,
      _type: 'blogPost',
      locale: 'ar',
      title: '',
      slug: { _type: 'slug', current: '' },
      excerpt: '',
      bodyFormat: 'lexical',
      bodyJson: JSON.stringify({ root: { type: 'root', children: [] } }),
      bodyHtml: '',
      updatedAt: now,
      featured: false,
      category: { _type: 'reference', _ref: categoryId },
      author: { _type: 'reference', _ref: authorId },
    })
    .commit();
  return (await getAdminPost(id)) ?? emptyAdminDraft(id);
}

function toPublicPost(post: AdminPost): BlogPost | null {
  if (post.status !== 'published' || !post.title.trim() || !post.excerpt.trim() || (!post.contentHtml.trim() && !post.contentJson.trim())) return null;
  const publishedAt = post.publishedAt ?? post.updatedAt;
  return {
    id: post.id,
    slug: post.slug,
    locale: 'ar',
    title: post.title,
    excerpt: post.excerpt,
    category: { id: 'general', label: post.category || 'عام' },
    author: { name: post.author || DEFAULT_AUTHOR },
    cover: {
      src: post.coverUrl || '/assets/landing-blog-dental.jpg',
      alt: post.coverAlt || post.title,
      width: post.coverWidth ?? 1600,
      height: post.coverHeight ?? 1067,
    },
    publishedAt,
    updatedAt: post.updatedAt,
    featured: post.featured,
    draft: false,
    seo: {},
    body: post.contentJson
      ? { format: 'lexical', version: 1, json: post.contentJson }
      : { format: 'html', html: sanitizeBlogHtml(post.contentHtml) },
    relatedServiceId: post.relatedServiceId || undefined,
    readingTimeMinutes: calculateReadingTimeMinutes(post.contentJson ? lexicalJsonToPlainText(post.contentJson) : htmlToPlainText(post.contentHtml)),
  };
}

export function getMockAdminPublishedPostsSync(): BlogPost[] {
  return Array.from(mockStore.values())
    .map(toPublicPost)
    .filter((post): post is BlogPost => Boolean(post))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

function listMock(options: AdminPostListOptions = {}): AdminPost[] {
  const search = options.search?.trim().toLocaleLowerCase('ar') ?? '';
  const status = options.status ?? 'all';
  return Array.from(mockStore.values())
    .filter((post) => {
      const searchable = `${post.title} ${post.slug} ${post.excerpt} ${post.contentHtml}`.toLocaleLowerCase('ar');
      return (!search || searchable.includes(search)) && (status === 'all' || post.status === status);
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

function assertPublishFields(input: { title: string; excerpt: string; contentHtml: string; contentJson?: string; slug: string }): void {
  assertAdminPublishCopy(input);
  const contentText = input.contentJson ? lexicalJsonToPlainText(input.contentJson) : htmlToPlainText(input.contentHtml);
  if (!contentText.trim()) {
    throw new Error('المقال يحتاج عنواناً ومقدمة ومحتوى قبل النشر.');
  }
  if (!isValidBlogSlug(input.slug)) throw new Error(`الرابط المختصر غير صالح: ${input.slug || 'أدخل رابطاً مختصراً صالحاً.'}`);
}

function assertMockUniqueSlug(slug: string, id?: string): void {
  if (!slug) return;
  const duplicate = Array.from(mockStore.values()).find((post) => post.id !== id && post.slug === slug);
  if (duplicate) throw new Error('هذا الرابط المختصر مستخدم بالفعل. اختر رابطاً آخر.');
}

function saveMock(id: string | undefined, input: AdminPostInput, publish: boolean): AdminPost {
  const timestamp = nowIso();
  const existing = id ? mockStore.get(id) : undefined;
  const slug = input.slug.trim() ? slugify(input.slug) : (input.title.trim() ? slugify(input.title) : '');
  if (publish) assertPublishFields({ ...input, slug });
  assertMockUniqueSlug(slug, id);
  const post: AdminPost = {
    id: id ?? `post-${crypto.randomUUID()}`,
    title: input.title.trim(),
    slug,
    excerpt: input.excerpt.trim(),
    contentJson: input.contentJson ? normalizeLexicalJson(input.contentJson) : '',
    contentHtml: input.contentJson ? lexicalJsonToHtml(input.contentJson) : sanitizeBlogHtml(input.contentHtml),
    status: publish ? 'published' : 'draft',
    publishedAt: resolveAdminPublishedAt(publish, existing?.publishedAt, timestamp) ?? null,
    updatedAt: timestamp,
    featured: input.featured === true,
    category: input.category?.trim() || existing?.category || 'عام',
    author: input.author?.trim() || existing?.author || DEFAULT_AUTHOR,
    coverUrl: input.coverUrl?.trim() || existing?.coverUrl || '/assets/landing-blog-dental.jpg',
    coverAlt: input.coverAlt?.trim() || existing?.coverAlt || input.title.trim(),
    coverAssetId: input.coverAssetId?.trim() || existing?.coverAssetId || '',
    coverWidth: input.coverWidth ?? existing?.coverWidth ?? null,
    coverHeight: input.coverHeight ?? existing?.coverHeight ?? null,
    relatedServiceId: input.relatedServiceId?.trim() || existing?.relatedServiceId || '',
  };
  mockStore.set(post.id, post);
  return post;
}

function getSanityClient(): SanityClient {
  if (!SANITY_PROJECT_ID || !SANITY_DATASET || !SANITY_API_VERSION || !SANITY_WRITE_TOKEN) {
    throw new Error('Sanity admin writes require SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_VERSION and SANITY_WRITE_TOKEN.');
  }
  return createClient({ projectId: SANITY_PROJECT_ID, dataset: SANITY_DATASET, apiVersion: SANITY_API_VERSION, token: SANITY_WRITE_TOKEN, useCdn: false, perspective: 'raw' });
}

function sanityProjection(): string {
  return `{ _id, title, "slug": slug.current, excerpt, "contentHtml": bodyHtml, bodyJson, publishedAt, updatedAt, featured, "status": select(_id in path("drafts.**") => "draft", defined(publishedAt) => "published", "draft"), "category": category->label, "author": author->name, "coverUrl": coalesce(cover.asset->url, coverUrl), "coverAssetId": cover.asset._ref, "coverWidth": cover.asset->metadata.dimensions.width, "coverHeight": cover.asset->metadata.dimensions.height, "coverAlt": coalesce(cover.alt, coverUrlAlt), relatedServiceId }`;
}

function mapSanityAdmin(raw: Record<string, unknown>): AdminPost {
  const rawId = String(raw._id ?? '');
  const contentJson = typeof raw.contentJson === 'string' ? raw.contentJson : (typeof raw.bodyJson === 'string' ? raw.bodyJson : '');
  const contentHtml = typeof raw.contentHtml === 'string' && raw.contentHtml.trim()
    ? sanitizeBlogHtml(raw.contentHtml)
    : contentJson
      ? lexicalJsonToHtml(contentJson)
      : '';
  return {
    id: rawId.replace(/^drafts\./, ''),
    title: String(raw.title ?? ''), slug: String(raw.slug ?? ''), excerpt: String(raw.excerpt ?? ''),
    contentJson, contentHtml, status: resolveSanityAdminStatus(rawId, raw.status),
    publishedAt: typeof raw.publishedAt === 'string' ? raw.publishedAt : null,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : nowIso(), featured: raw.featured === true,
    category: String(raw.category ?? 'عام'), author: String(raw.author ?? DEFAULT_AUTHOR), coverUrl: String(raw.coverUrl ?? ''), coverAlt: String(raw.coverAlt ?? ''), coverAssetId: String(raw.coverAssetId ?? ''), coverWidth: typeof raw.coverWidth === 'number' ? raw.coverWidth : null, coverHeight: typeof raw.coverHeight === 'number' ? raw.coverHeight : null, relatedServiceId: String(raw.relatedServiceId ?? ''),
  };
}

export async function listAdminPosts(options: AdminPostListOptions = {}): Promise<AdminPost[]> {
  if (BLOG_PROVIDER !== 'sanity') return listMock(options);
  const client = getSanityClient();
  const search = options.search?.trim().replace(/\*/g, '').slice(0, 120) ?? '';
  const searchPattern = search ? `*${search}*` : '';
  const status = options.status ?? 'all';
  const searchClause = search
    ? '&& (title match $search || excerpt match $search || slug.current match $search || bodyHtml match $search)'
    : '';
  const query = `*[_type == "blogPost" && locale == "ar" ${searchClause}] | order(updatedAt desc) ${sanityProjection()}`;
  const rows = await client.fetch<Record<string, unknown>[]>(query, search ? { search: searchPattern } : {});
  const grouped = new Map<string, AdminPost>();
  for (const row of rows ?? []) {
    let mapped: AdminPost;
    try { mapped = mapSanityAdmin(row); } catch (error) { console.error(`[admin-blog] Skipping malformed Sanity document ${String(row._id ?? '')}.`, error); continue; }
    if (isSanityDraftId(String(row._id))) grouped.set(mapped.id, mapped);
    else if (!grouped.has(mapped.id)) grouped.set(mapped.id, mapped);
  }
  return Array.from(grouped.values()).filter((post) => status === 'all' || post.status === status);
}

export async function getAdminPost(id: string): Promise<AdminPost | null> {
  if (BLOG_PROVIDER !== 'sanity') return mockStore.get(id) ?? null;
  const client = getSanityClient();
  const row = await client.fetch<Record<string, unknown> | null>(`coalesce(*[_id == $draftId][0], *[_id == $id][0]) ${sanityProjection()}`, { id, draftId: `drafts.${id}` });
  return row ? mapSanityAdmin(row) : null;
}

export async function saveAdminPost(
  id: string | undefined,
  input: AdminPostInput,
  publish: boolean,
  options: { deletePublished?: boolean } = {},
): Promise<AdminPost> {
  if (BLOG_PROVIDER !== 'sanity') return saveMock(id, input, publish);
  const client = getSanityClient();
  const documentId = id ?? crypto.randomUUID();
  const existing = id ? await getAdminPost(documentId) : null;
  const slug = input.slug.trim() ? slugify(input.slug) : (input.title.trim() ? slugify(input.title) : '');
  if (publish) assertPublishFields({ ...input, slug });
  if (slug) {
    const duplicate = await client.fetch<string | null>(`*[_type == "blogPost" && locale == "ar" && slug.current == $slug && !(_id in [$id, $draftId])][0]._id`, { slug, id: documentId, draftId: `drafts.${documentId}` });
    if (duplicate) throw new Error('هذا الرابط المختصر مستخدم بالفعل. اختر رابطاً آخر.');
  }
  const coverAssetId = input.coverAssetId !== undefined ? input.coverAssetId.trim() : (existing?.coverAssetId ?? '');
  const categoryLabel = input.category?.trim() || existing?.category || 'عام';
  const authorName = input.author?.trim() || existing?.author || DEFAULT_AUTHOR;
  const categoryId = adminCategoryDocumentId(categoryLabel);
  const authorId = adminAuthorDocumentId(authorName);
  const coverAlt = input.coverAlt?.trim() || existing?.coverAlt || input.title.trim();
  const coverUrl = coverAssetId ? undefined : (input.coverUrl?.trim() || existing?.coverUrl || undefined);
  const timestamp = nowIso();
  const publishedAt = resolveAdminPublishedAt(publish, existing?.publishedAt, timestamp);
  const doc: IdentifiedSanityDocumentStub<Record<string, unknown>> = {
    _id: publish ? documentId : `drafts.${documentId}`,
    _type: 'blogPost', locale: 'ar', title: input.title.trim(), slug: { _type: 'slug', current: slug }, excerpt: input.excerpt.trim(),
    bodyFormat: input.contentJson ? 'lexical' : 'html',
    ...(input.contentJson ? { bodyJson: normalizeLexicalJson(input.contentJson), bodyHtml: lexicalJsonToHtml(input.contentJson) } : { bodyHtml: sanitizeBlogHtml(input.contentHtml) }),
    ...(publishedAt ? { publishedAt } : {}),
    updatedAt: timestamp,
    featured: input.featured === true,
    category: { _type: 'reference', _ref: categoryId }, author: { _type: 'reference', _ref: authorId }, relatedServiceId: input.relatedServiceId?.trim() || undefined,
    ...(coverAssetId ? {
      cover: {
        _type: 'blogImage',
        asset: { _type: 'reference', _ref: coverAssetId },
        alt: coverAlt,
      },
    } : {
      coverUrl,
      coverUrlAlt: coverAlt || undefined,
    }),
  };
  const tx = client
    .transaction()
    .createIfNotExists({
      _id: categoryId,
      _type: 'blogCategory',
      categoryId: { _type: 'slug', current: createBlogSlug(categoryLabel) || 'general' },
      label: categoryLabel,
    })
    .createIfNotExists({ _id: authorId, _type: 'blogAuthor', name: authorName })
    .createOrReplace(doc);
  if (publish) tx.delete(`drafts.${documentId}`);
  if (options.deletePublished) tx.delete(documentId);
  await tx.commit();
  return (await getAdminPost(documentId)) ?? mapSanityAdmin(doc as unknown as Record<string, unknown>);
}

export async function setAdminPostStatus(id: string, publish: boolean): Promise<AdminPost | null> {
  const existing = await getAdminPost(id);
  if (!existing) return null;
  if (publish) assertPublishFields(existing);
  if (publish && BLOG_PROVIDER === 'sanity' && !existing.coverAssetId && !existing.coverUrl.trim()) {
    throw new Error('أضف صورة رئيسية من خلال رفع ملف أو إدخال رابط صورة قبل نشر المقال.');
  }
  return saveAdminPost(
    id,
    { ...existing, contentHtml: existing.contentHtml, contentJson: existing.contentJson || undefined },
    publish,
    { deletePublished: !publish && BLOG_PROVIDER === 'sanity' && existing.status === 'published' },
  );
}

export async function deleteAdminPost(id: string): Promise<void> {
  if (BLOG_PROVIDER !== 'sanity') { mockStore.delete(id); return; }
  await getSanityClient()
    .transaction()
    .delete(id)
    .delete(`drafts.${id}`)
    .commit();
}

export async function uploadAdminImage(file: File): Promise<{ assetId: string; url: string; width: number | null; height: number | null }> {
  if (BLOG_PROVIDER !== 'sanity') {
    throw new Error('رفع الصور يحتاج BLOG_PROVIDER=sanity مع إعدادات Sanity كاملة.');
  }
  const client = getSanityClient();
  // Sanity's Node client rejects browser File objects ("must be a string, buffer or stream").
  // Convert for local Node SSR; Buffer also works under Cloudflare nodejs_compat.
  const body = Buffer.from(await file.arrayBuffer());
  const asset = await client.assets.upload('image', body, {
    filename: file.name || 'blog-cover',
    contentType: file.type || undefined,
  });
  return {
    assetId: asset._id,
    url: asset.url,
    width: 'metadata' in asset && asset.metadata?.dimensions ? asset.metadata.dimensions.width : null,
    height: 'metadata' in asset && asset.metadata?.dimensions ? asset.metadata.dimensions.height : null,
  };
}

function assertSafeRemoteImageUrl(raw: string): URL {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error('رابط الصورة غير صالح.'); }
  if (url.protocol !== 'https:') throw new Error('يجب أن يبدأ رابط الصورة بـ https.');
  if (url.username || url.password) throw new Error('لا يمكن استخدام رابط يحتوي بيانات دخول.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === '0.0.0.0' || host === '::1' || /^(10|127|169\.254|192\.168)\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
    throw new Error('لا يمكن استيراد صورة من هذا المضيف.');
  }
  return url;
}

export async function importAdminImageFromUrl(rawUrl: string): Promise<{ assetId: string; url: string; width: number | null; height: number | null }> {
  let url = assertSafeRemoteImageUrl(rawUrl);
  let response: Response | null = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(12_000), headers: { Accept: 'image/*' } });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('رابط الصورة أعاد إعادة توجيه غير صالح.');
      url = assertSafeRemoteImageUrl(new URL(location, url).toString());
      continue;
    }
    break;
  }
  if (!response || !response.ok) throw new Error('تعذر تحميل الصورة من الرابط.');
  const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) throw new Error('الرابط لا يشير إلى صورة مدعومة.');
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > 10 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 10 ميجابايت.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('حجم الصورة يجب ألا يتجاوز 10 ميجابايت.');
  const file = new File([bytes], `blog-import.${contentType.split('/')[1] || 'image'}`, { type: contentType });
  return uploadAdminImage(file);
}
