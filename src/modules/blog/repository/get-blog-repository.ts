import {
  BLOG_PROVIDER,
  SANITY_API_TOKEN,
  SANITY_API_VERSION,
  SANITY_DATASET,
  SANITY_PROJECT_ID,
} from 'astro:env/server';
import type { BlogRepository } from './blog-repository.ts';
import { createBlogRepository } from './create-blog-repository.ts';

let cachedRepository: BlogRepository | undefined;

/** Server composition root — uses Astro env and caches the repository per process/build. */
export function getBlogRepository(): BlogRepository {
  if (!cachedRepository) {
    cachedRepository = createBlogRepository({
      provider: BLOG_PROVIDER,
      sanity: {
        projectId: SANITY_PROJECT_ID,
        dataset: SANITY_DATASET,
        apiVersion: SANITY_API_VERSION,
        token: SANITY_API_TOKEN,
      },
    });
  }
  return cachedRepository;
}

/** Test helper. */
export function resetBlogRepositoryCache(): void {
  cachedRepository = undefined;
}
