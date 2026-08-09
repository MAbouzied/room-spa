import { getMockPublishedPostsSync } from '../modules/blog/repository/mock-blog-repository.ts';

/** Absolute blog URLs for @astrojs/sitemap customPages (SSR blog routes are not auto-discovered). */
export function getBlogSitemapPages(site: string): string[] {
  const origin = site.replace(/\/$/, '');
  const listing = `${origin}/blogs/`;
  const details = getMockPublishedPostsSync().map((post) => `${origin}/blogs/${post.slug}/`);
  return [listing, ...details];
}
