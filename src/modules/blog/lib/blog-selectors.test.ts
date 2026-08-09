import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mockBlogPosts } from '../content/mock-posts.ts';
import { validateBlogCollection } from '../model/blog-schema.ts';
import {
  filterPublishedPosts,
  paginatePosts,
  selectFeaturedPost,
  selectListing,
  selectRelatedPosts,
} from './blog-selectors.ts';
import { calculateReadingTimeMinutes, extractBlogText, readingTimeForPost } from './reading-time.ts';
import { isValidBlogSlug } from './slug.ts';
import { isMeaningfullyUpdated, lastmodForPost } from './date-format.ts';
import type { BlogPost } from '../model/blog-types.ts';

const NOW = new Date('2026-08-03T12:00:00.000Z');

function basePost(overrides: Partial<BlogPost>): BlogPost {
  return {
    id: 'p1',
    slug: 'sample-post',
    locale: 'ar',
    title: 'عنوان',
    excerpt: 'مقتطف',
    category: { id: 'dentistry', label: 'طب الأسنان' },
    author: { name: 'مؤلف' },
    cover: {
      src: '/images/offers/wellness.jpg',
      alt: 'غلاف',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-07-01T00:00:00.000Z',
    featured: false,
    draft: false,
    seo: {},
    body: { format: 'blocks', blocks: [{ type: 'paragraph', text: 'نص كافٍ للقراءة والاختبار.' }] },
    ...overrides,
  };
}

describe('blog selectors', () => {
  it('filters drafts and future posts', () => {
    const posts = [
      basePost({ id: 'a', slug: 'a-post', publishedAt: '2026-07-01T00:00:00.000Z' }),
      basePost({ id: 'b', slug: 'b-draft', draft: true }),
      basePost({ id: 'c', slug: 'c-future', publishedAt: '2099-01-01T00:00:00.000Z' }),
    ];
    const published = filterPublishedPosts(posts, NOW);
    assert.deepEqual(published.map((post) => post.id), ['a']);
  });

  it('selects newest featured post and excludes it from recent', () => {
    const posts = [
      basePost({
        id: 'old-featured',
        slug: 'old-featured',
        featured: true,
        publishedAt: '2026-06-01T00:00:00.000Z',
      }),
      basePost({
        id: 'new-featured',
        slug: 'new-featured',
        featured: true,
        publishedAt: '2026-07-10T00:00:00.000Z',
      }),
      basePost({
        id: 'recent',
        slug: 'recent-post',
        publishedAt: '2026-07-05T00:00:00.000Z',
      }),
    ];
    const listing = selectListing(posts, NOW);
    assert.equal(listing.featured?.id, 'new-featured');
    assert.deepEqual(listing.recent.map((post) => post.id), ['recent', 'old-featured']);
  });

  it('falls back to newest post when none are featured', () => {
    const posts = [
      basePost({ id: 'older', slug: 'older-post', publishedAt: '2026-06-01T00:00:00.000Z' }),
      basePost({ id: 'newer', slug: 'newer-post', publishedAt: '2026-07-01T00:00:00.000Z' }),
    ];
    assert.equal(selectFeaturedPost(posts)?.id, 'newer');
  });

  it('sorts equal dates deterministically by slug', () => {
    const posts = [
      basePost({ id: 'z', slug: 'zeta-post', publishedAt: '2026-07-01T00:00:00.000Z' }),
      basePost({ id: 'a', slug: 'alpha-post', publishedAt: '2026-07-01T00:00:00.000Z' }),
    ];
    assert.deepEqual(
      filterPublishedPosts(posts, NOW).map((post) => post.slug),
      ['alpha-post', 'zeta-post'],
    );
  });

  it('selects related posts preferring same category and excludes current', () => {
    const current = basePost({
      id: 'current',
      slug: 'current-post',
      category: { id: 'dentistry', label: 'طب الأسنان' },
      relatedSlugs: ['preferred-post'],
    });
    const posts = [
      current,
      basePost({
        id: 'preferred',
        slug: 'preferred-post',
        category: { id: 'dermatology', label: 'الجلدية' },
      }),
      basePost({
        id: 'same',
        slug: 'same-category',
        category: { id: 'dentistry', label: 'طب الأسنان' },
      }),
      basePost({
        id: 'other',
        slug: 'other-category',
        category: { id: 'laser', label: 'الليزر' },
      }),
    ];
    const related = selectRelatedPosts(posts, current, 3, NOW);
    assert.equal(related.some((post) => post.id === 'current'), false);
    assert.equal(related[0]?.id, 'preferred');
    assert.equal(related[1]?.id, 'same');
  });

  it('paginates and rejects empty pages', () => {
    const posts = Array.from({ length: 5 }, (_, index) =>
      basePost({ id: `p${index}`, slug: `post-${index}` }),
    );
    const page1 = paginatePosts(posts, 1, 2);
    assert.equal(page1?.totalPages, 3);
    assert.equal(page1?.items.length, 2);
    assert.equal(paginatePosts(posts, 4, 2), null);
  });
});

describe('reading time and slugs', () => {
  it('calculates Arabic reading time with a one-minute minimum', () => {
    assert.equal(calculateReadingTimeMinutes('كلمة'), 1);
    const longText = Array.from({ length: 400 }, () => 'كلمة').join(' ');
    assert.equal(calculateReadingTimeMinutes(longText), 3);
  });

  it('extracts text from mock featured post body', () => {
    const { posts } = validateBlogCollection(mockBlogPosts);
    const featured = selectFeaturedPost(posts);
    assert.ok(featured);
    assert.ok(extractBlogText(featured.body).length > 40);
    assert.ok(readingTimeForPost(featured) >= 1);
  });

  it('validates slugs', () => {
    assert.equal(isValidBlogSlug('dalil-tabyid-alasnan'), true);
    assert.equal(isValidBlogSlug('Bad Slug'), false);
    assert.equal(isValidBlogSlug('ab'), false);
  });

  it('formats lastmod from updated or published dates', () => {
    assert.equal(isMeaningfullyUpdated('2026-07-01T00:00:00.000Z', '2026-07-02T00:00:00.000Z'), true);
    assert.equal(lastmodForPost('2026-07-01T00:00:00.000Z', '2026-07-10T00:00:00.000Z'), '2026-07-10');
  });
});

describe('mock collection validation', () => {
  it('accepts fixtures and exposes six published posts at now', () => {
    const { posts, issues } = validateBlogCollection(mockBlogPosts);
    assert.ok(posts.length >= 6);
    assert.equal(issues.some((issue) => issue.level === 'error'), false);
    assert.equal(filterPublishedPosts(posts, NOW).length, 6);
  });
});
