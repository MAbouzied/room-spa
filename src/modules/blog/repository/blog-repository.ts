import type { BlogPost } from '../model/blog-types.ts';

export interface BlogRepository {
  getPublishedPosts(): Promise<BlogPost[]>;
  getPostBySlug(slug: string): Promise<BlogPost | null>;
}

export type BlogProvider = 'mock' | 'sanity';
