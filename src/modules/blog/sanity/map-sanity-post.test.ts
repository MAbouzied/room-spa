import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapSanityPostToBlogPost, mapSanityPosts } from './map-sanity-post.ts';
import type { SanityBlogPostDoc } from './types.ts';

const imageConfig = { projectId: 'nzy22u9z', dataset: 'production' };

function baseDoc(overrides: Partial<SanityBlogPostDoc> = {}): SanityBlogPostDoc {
  return {
    _id: 'post-1',
    title: 'دليل تنظيف الأسنان في حفر الباطن',
    slug: 'dental-cleaning-guide',
    locale: 'ar',
    excerpt: 'مقال تجريبي يوضح خطوات العناية اليومية بالأسنان واللثة بشكل عملي وواضح للمرضى.',
    cover: {
      asset: {
        _id: 'image-cover',
        url: 'https://cdn.sanity.io/images/nzy22u9z/production/cover.jpg',
        metadata: { dimensions: { width: 1600, height: 900 } },
      },
      alt: 'طبيب أسنان أثناء فحص المريض',
      hotspot: { x: 0.4, y: 0.3 },
    },
    author: {
      name: 'د. محمود',
      role: 'طب أسنان',
    },
    category: {
      categoryId: 'dentistry',
      label: 'طب الأسنان',
    },
    publishedAt: '2026-01-15T10:00:00.000Z',
    featured: true,
    seo: { title: 'تنظيف الأسنان', description: 'وصف تحسين محركات البحث للمقال.' },
    body: [
      {
        _type: 'block',
        style: 'h2',
        _key: 'h2-1',
        children: [{ _type: 'span', text: 'مقدمة' }],
      },
    ],
    relatedPosts: [{ slug: 'related-one' }],
    ...overrides,
  };
}

describe('mapSanityPostToBlogPost', () => {
  it('maps a valid Sanity document into BlogPost portable text', () => {
    const post = mapSanityPostToBlogPost(baseDoc(), imageConfig);
    assert.equal(post.slug, 'dental-cleaning-guide');
    assert.equal(post.locale, 'ar');
    assert.equal(post.body.format, 'portableText');
    assert.equal(post.cover.focalPoint?.x, 0.4);
    assert.equal(post.category.id, 'dentistry');
    assert.deepEqual(post.relatedSlugs, ['related-one']);
    assert.match(post.cover.src, /cdn\.sanity\.io/);
  });

  it('rejects missing configuration fields with document context', () => {
    assert.throws(
      () => mapSanityPostToBlogPost(baseDoc({ slug: null }), imageConfig),
      /post-1.*slug/i,
    );
  });

  it('rejects non-Arabic locale', () => {
    assert.throws(
      () => mapSanityPostToBlogPost(baseDoc({ locale: 'en' }), imageConfig),
      /locale must be "ar"/,
    );
  });

  it('rejects cover images without alternative text', () => {
    assert.throws(
      () =>
        mapSanityPostToBlogPost(
          baseDoc({
            cover: {
              asset: {
                _id: 'image-cover',
                url: 'https://cdn.sanity.io/images/nzy22u9z/production/cover.jpg',
              },
              alt: ' ',
            },
          }),
          imageConfig,
        ),
      /cover\.alt/,
    );
  });
});

describe('mapSanityPosts', () => {
  it('returns an empty list for an empty dataset', () => {
    assert.deepEqual(mapSanityPosts([], imageConfig), []);
  });

  it('fails loudly when any published document is malformed', () => {
    assert.throws(
      () => mapSanityPosts([baseDoc({ body: [] })], imageConfig),
      /mapping failed/,
    );
  });
});
