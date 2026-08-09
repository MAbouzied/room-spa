import { mockBlogPosts } from '../content/mock-posts.ts';
import { validateBlogCollection } from '../model/blog-schema.ts';
import { filterPublishedPosts } from '../lib/blog-selectors.ts';
import type { BlogPost } from '../model/blog-types.ts';
import type { BlogRepository } from './blog-repository.ts';

let cachedPosts: BlogPost[] | undefined;

function loadValidatedPosts(): BlogPost[] {
  if (!cachedPosts) {
    const { posts } = validateBlogCollection(mockBlogPosts);
    cachedPosts = posts;
  }
  return cachedPosts;
}

function mergePublishedPosts(fixturePosts: BlogPost[], adminPosts: BlogPost[]): BlogPost[] {
  const bySlug = new Map(fixturePosts.map((post) => [post.slug, post]));
  for (const post of adminPosts) {
    bySlug.set(post.slug, post);
  }
  return Array.from(bySlug.values()).sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  );
}

/**
 * Synchronous access for route registration / sitemap during config load.
 * Fixtures only — must not import admin code that pulls `astro:env`.
 */
export function getMockPublishedPostsSync(now = new Date()): BlogPost[] {
  return filterPublishedPosts(loadValidatedPosts(), now);
}

export function createMockBlogRepository(): BlogRepository {
  return {
    async getPublishedPosts() {
      // Lazy-load admin store so Astro config/sitemap never imports `astro:env`.
      const { getMockAdminPublishedPostsSync } = await import('../../../lib/admin/blog-admin.ts');
      return mergePublishedPosts(getMockPublishedPostsSync(), getMockAdminPublishedPostsSync());
    },
    async getPostBySlug(slug: string) {
      const { getMockAdminPublishedPostsSync } = await import('../../../lib/admin/blog-admin.ts');
      const published = mergePublishedPosts(
        getMockPublishedPostsSync(),
        getMockAdminPublishedPostsSync(),
      );
      return published.find((post) => post.slug === slug) ?? null;
    },
  };
}
