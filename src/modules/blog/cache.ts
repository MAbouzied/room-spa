export const BLOG_CACHE_MAX_AGE_SECONDS = 300;
export const BLOG_CACHE_SWR_SECONDS = 3600;
export const BLOG_LISTING_CACHE_TAG = 'blog:listings';

export function blogPostCacheTag(id: string): string {
  const normalizedId = encodeURIComponent(id.trim()) || 'unknown';
  return `blog:post:${normalizedId}`;
}

export function blogListingCacheTags(): string[] {
  return [BLOG_LISTING_CACHE_TAG];
}

/** Article pages also depend on the collection because they render related posts. */
export function blogArticleCacheTags(id: string): string[] {
  return [BLOG_LISTING_CACHE_TAG, blogPostCacheTag(id)];
}

/** Every public mutation can affect a card/listing and the article identified by its stable document id. */
export function blogMutationCacheTags(id: string): string[] {
  return [BLOG_LISTING_CACHE_TAG, blogPostCacheTag(id)];
}
