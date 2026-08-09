import type { BlogProvider, BlogRepository } from './blog-repository.ts';
import { createMockBlogRepository } from './mock-blog-repository.ts';
import { createSanityBlogRepository, type SanityBlogConfig } from './sanity-blog-repository.ts';

export function resolveBlogProvider(value: string | undefined | null): BlogProvider {
  if (value === 'sanity') return 'sanity';
  return 'mock';
}

export function createBlogRepository(options?: {
  provider?: string | BlogProvider | null;
  sanity?: SanityBlogConfig;
}): BlogRepository {
  const provider = resolveBlogProvider(options?.provider);

  if (provider === 'sanity') {
    return createSanityBlogRepository(options?.sanity ?? {});
  }

  return createMockBlogRepository();
}
