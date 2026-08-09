import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  BLOG_SLUG_MAX_LENGTH,
  blogPath,
  createBlogSlug,
  isValidBlogSlug,
  normalizeBlogSlugParam,
} from './slug.ts';

describe('Arabic blog slugs', () => {
  it('creates a readable Arabic slug from a title as it is typed', () => {
    const slug = createBlogSlug('كيف تحافظ على ابتسامة صحية بين الزيارات؟');

    assert.equal(slug, 'كيف-تحافظ-على-ابتسامة-صحية-بين-الزيارات');
    assert.equal(isValidBlogSlug(slug), true);
  });

  it('removes Arabic diacritics and tatweel while retaining Arabic letters and digits', () => {
    assert.equal(createBlogSlug('صِحَّةُ الأسْنان ــ ٢٠٢٦'), 'صحة-الأسنان-٢٠٢٦');
  });

  it('keeps existing lowercase Latin slugs valid and rejects non-canonical values', () => {
    assert.equal(isValidBlogSlug('dental-cleaning-guide'), true);
    assert.equal(isValidBlogSlug('Dental-Cleaning-Guide'), false);
    assert.equal(isValidBlogSlug('كيف--تحافظ'), false);
  });

  it('limits slugs by Unicode characters without leaving a trailing separator', () => {
    const input = `${'أ'.repeat(BLOG_SLUG_MAX_LENGTH)} عنوان`;
    const slug = createBlogSlug(input);

    assert.equal(Array.from(slug).length, BLOG_SLUG_MAX_LENGTH);
    assert.equal(slug.endsWith('-'), false);
  });

  it('decodes Arabic route segments once and emits encoded public paths', () => {
    const slug = 'كيف-تحافظ-على-ابتسامة-صحية';

    assert.equal(normalizeBlogSlugParam(encodeURIComponent(slug)), slug);
    assert.equal(normalizeBlogSlugParam('%E0%A4%A'), null);
    assert.equal(normalizeBlogSlugParam('كيف%2Fتحافظ'), null);
    assert.equal(normalizeBlogSlugParam(encodeURIComponent(encodeURIComponent(slug))), null);
    assert.equal(blogPath(slug), `/blogs/${encodeURIComponent(slug)}`);
  });
});
