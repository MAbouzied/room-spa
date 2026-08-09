import assert from 'node:assert/strict';
import test from 'node:test';
import {
  BLOG_LISTING_CACHE_TAG,
  blogArticleCacheTags,
  blogListingCacheTags,
  blogMutationCacheTags,
  blogPostCacheTag,
} from './cache.ts';

test('blog listing routes use the shared listing tag', () => {
  assert.deepEqual(blogListingCacheTags(), [BLOG_LISTING_CACHE_TAG]);
});

test('article and mutation tags share a stable document-id tag', () => {
  const id = 'post-123';
  assert.equal(blogPostCacheTag(id), 'blog:post:post-123');
  assert.deepEqual(blogArticleCacheTags(id), [BLOG_LISTING_CACHE_TAG, 'blog:post:post-123']);
  assert.deepEqual(blogMutationCacheTags(id), [BLOG_LISTING_CACHE_TAG, 'blog:post:post-123']);
});

test('document ids are safe to use as cache tags', () => {
  assert.equal(blogPostCacheTag(' post id/1 '), 'blog:post:post%20id%2F1');
});
