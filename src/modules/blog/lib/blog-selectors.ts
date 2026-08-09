import { parseBlogDate } from './date-format.ts';
import { readingTimeForPost } from './reading-time.ts';
import type { BlogPost } from '../model/blog-types.ts';
import { BLOG_PAGE_SIZE } from '../model/blog-types.ts';

export interface BlogListingSelection {
  featured: BlogPost | null;
  recent: BlogPost[];
  allPublished: BlogPost[];
}

export interface BlogPagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  items: BlogPost[];
}

function compareNewestFirst(a: BlogPost, b: BlogPost): number {
  const byDate = parseBlogDate(b.publishedAt).getTime() - parseBlogDate(a.publishedAt).getTime();
  if (byDate !== 0) return byDate;
  return a.slug.localeCompare(b.slug);
}

export function filterPublishedPosts(
  posts: readonly BlogPost[],
  now = new Date(),
): BlogPost[] {
  const nowMs = now.getTime();
  return posts
    .filter((post) => !post.draft)
    .filter((post) => parseBlogDate(post.publishedAt).getTime() <= nowMs)
    .slice()
    .sort(compareNewestFirst);
}

export function selectFeaturedPost(
  posts: readonly BlogPost[],
  now = new Date(),
): BlogPost | null {
  const published = filterPublishedPosts(posts, now);
  if (published.length === 0) return null;

  const featured = published.filter((post) => post.featured);
  if (featured.length === 0) return published[0] ?? null;

  return featured.slice().sort(compareNewestFirst)[0] ?? null;
}

export function selectListing(posts: readonly BlogPost[], now = new Date()): BlogListingSelection {
  const allPublished = filterPublishedPosts(posts, now);
  const featured = selectFeaturedPost(allPublished, now);
  const recent = featured
    ? allPublished.filter((post) => post.id !== featured.id)
    : allPublished;

  return { featured, recent, allPublished };
}

export function paginatePosts(
  posts: readonly BlogPost[],
  page: number,
  pageSize = BLOG_PAGE_SIZE,
): BlogPagination | null {
  if (!Number.isInteger(page) || page < 1 || pageSize < 1) return null;

  const totalItems = posts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (page > totalPages) return null;

  const start = (page - 1) * pageSize;
  return {
    page,
    pageSize,
    totalPages,
    totalItems,
    items: posts.slice(start, start + pageSize),
  };
}

export function selectRelatedPosts(
  posts: readonly BlogPost[],
  current: BlogPost,
  limit = 3,
  now = new Date(),
): BlogPost[] {
  const published = filterPublishedPosts(posts, now).filter((post) => post.id !== current.id);
  const sameCategory = published.filter((post) => post.category.id === current.category.id);
  const preferredSlugs = new Set(current.relatedSlugs ?? []);

  const preferred = published.filter((post) => preferredSlugs.has(post.slug));
  const remainingSame = sameCategory.filter((post) => !preferredSlugs.has(post.slug));
  const fillers = published.filter(
    (post) => !preferredSlugs.has(post.slug) && post.category.id !== current.category.id,
  );

  const ordered = [...preferred, ...remainingSame, ...fillers];
  const unique: BlogPost[] = [];
  const seen = new Set<string>();
  for (const post of ordered) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    unique.push(post);
    if (unique.length >= limit) break;
  }
  return unique;
}

export function withReadingTime(post: BlogPost): BlogPost & { readingTimeMinutes: number } {
  return {
    ...post,
    readingTimeMinutes: readingTimeForPost(post),
  };
}

export function listingPathForPage(page: number): string {
  return page <= 1 ? '/blogs/' : `/blogs/page/${page}/`;
}
