import { createSanityClient } from '../sanity/client.ts';
import { mapSanityPostToBlogPost, mapSanityPosts } from '../sanity/map-sanity-post.ts';
import {
  publishedPostBySlugQuery,
  publishedPostsQuery,
} from '../sanity/queries.ts';
import type { SanityBlogPostDoc } from '../sanity/types.ts';
import type { BlogRepository } from './blog-repository.ts';

export interface SanityBlogConfig {
  projectId?: string;
  dataset?: string;
  apiVersion?: string;
  token?: string;
}

export function createSanityBlogRepository(config: SanityBlogConfig = {}): BlogRepository {
  const client = createSanityClient(config);
  const imageConfig = {
    projectId: config.projectId!,
    dataset: config.dataset!,
  };

  return {
    async getPublishedPosts() {
      const docs = await client.fetch<SanityBlogPostDoc[]>(publishedPostsQuery);
      return mapSanityPosts(docs ?? [], imageConfig);
    },
    async getPostBySlug(slug: string) {
      const doc = await client.fetch<SanityBlogPostDoc | null>(publishedPostBySlugQuery, {
        slug,
      });
      if (!doc) return null;
      return mapSanityPostToBlogPost(doc, imageConfig);
    },
  };
}
