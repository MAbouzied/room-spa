import { createClient, type SanityClient } from '@sanity/client';
import type { SanityBlogConfig } from '../repository/sanity-blog-repository.ts';

export function assertSanityConfig(
  config: SanityBlogConfig,
): asserts config is Required<Pick<SanityBlogConfig, 'projectId' | 'dataset' | 'apiVersion'>> &
  SanityBlogConfig {
  const missing = [
    !config.projectId ? 'SANITY_PROJECT_ID' : null,
    !config.dataset ? 'SANITY_DATASET' : null,
    !config.apiVersion ? 'SANITY_API_VERSION' : null,
  ].filter((value): value is string => value !== null);

  if (missing.length > 0) {
    throw new Error(
      [
        'BLOG_PROVIDER=sanity is selected, but Sanity is not fully configured.',
        `Missing: ${missing.join(', ')}.`,
        'Set the required environment variables, or switch BLOG_PROVIDER to mock.',
        'Refusing to fall back to mock content while Sanity is selected.',
      ].join(' '),
    );
  }
}

export function createSanityClient(config: SanityBlogConfig): SanityClient {
  assertSanityConfig(config);

  return createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    useCdn: true,
    perspective: 'published',
    ...(config.token ? { token: config.token } : {}),
  });
}
