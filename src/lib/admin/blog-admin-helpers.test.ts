import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADMIN_EXCERPT_MAX,
  ADMIN_EXCERPT_MIN,
  ADMIN_TITLE_MAX,
  ADMIN_TITLE_MIN,
  adminAuthorDocumentId,
  adminCategoryDocumentId,
  assertAdminPublishCopy,
  readAdminImportUrlBody,
  readAdminPostPayload,
  resolveAdminPublishedAt,
  resolveSanityAdminStatus,
  shouldKeepExistingBlogSlug,
} from './blog-admin-helpers.ts';

describe('editor slug defaults', () => {
  it('keeps an existing slug manual and auto-generates only for new drafts', () => {
    assert.equal(shouldKeepExistingBlogSlug('existing-article'), true);
    assert.equal(shouldKeepExistingBlogSlug('  existing-article  '), true);
    assert.equal(shouldKeepExistingBlogSlug(''), false);
    assert.equal(shouldKeepExistingBlogSlug('   '), false);
  });
});

describe('admin taxonomy document ids', () => {
  it('creates deterministic per-value ids so shared defaults are not overwritten', () => {
    assert.match(adminCategoryDocumentId('عام'), /^blog-category-[0-9a-f]{16}$/);
    assert.match(adminAuthorDocumentId('فريق روم سبا'), /^blog-author-[0-9a-f]{16}$/);
    assert.equal(adminCategoryDocumentId('عام'), adminCategoryDocumentId(' عام '));
    assert.notEqual(adminCategoryDocumentId('تجميل'), adminCategoryDocumentId('أسنان'));
    assert.notEqual(adminAuthorDocumentId('د. أحمد'), adminAuthorDocumentId('فريق روم سبا'));
  });
});

describe('resolveAdminPublishedAt', () => {
  it('sets publishedAt only on first publish and preserves it afterward', () => {
    assert.equal(resolveAdminPublishedAt(true, null, '2026-01-01T00:00:00.000Z'), '2026-01-01T00:00:00.000Z');
    assert.equal(
      resolveAdminPublishedAt(true, '2025-06-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
      '2025-06-01T00:00:00.000Z',
    );
    assert.equal(
      resolveAdminPublishedAt(false, '2025-06-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
      '2025-06-01T00:00:00.000Z',
    );
    assert.equal(resolveAdminPublishedAt(false, null, '2026-01-01T00:00:00.000Z'), undefined);
  });
});

describe('resolveSanityAdminStatus', () => {
  it('treats draft document ids as draft even when GROQ reports published', () => {
    assert.equal(resolveSanityAdminStatus('drafts.post-1', 'published'), 'draft');
    assert.equal(resolveSanityAdminStatus('drafts.post-1', 'draft'), 'draft');
  });

  it('keeps published only for non-draft ids with published status', () => {
    assert.equal(resolveSanityAdminStatus('post-1', 'published'), 'published');
    assert.equal(resolveSanityAdminStatus('post-1', 'draft'), 'draft');
    assert.equal(resolveSanityAdminStatus('post-1', undefined), 'draft');
    assert.equal(resolveSanityAdminStatus('post-1', null), 'draft');
  });
});

describe('readAdminPostPayload', () => {
  it('preserves Lexical contentJson for editor round-trips', () => {
    const payload = readAdminPostPayload({
      title: 'عنوان المقال الطويل بما يكفي',
      slug: 'article-slug',
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MIN),
      contentHtml: '<p>html</p>',
      contentJson: '{"root":{"children":[]}}',
      featured: true,
      coverWidth: 1200,
      coverHeight: 'tall',
    });

    assert.equal(payload.contentJson, '{"root":{"children":[]}}');
    assert.equal(payload.contentHtml, '<p>html</p>');
    assert.equal(payload.featured, true);
    assert.equal(payload.coverWidth, 1200);
    assert.equal(payload.coverHeight, undefined);
  });

  it('omits blank contentJson so legacy HTML saves stay HTML-only', () => {
    const payload = readAdminPostPayload({
      title: 'عنوان',
      slug: 'slug',
      excerpt: 'excerpt',
      contentHtml: '<p>html</p>',
      contentJson: '   ',
    });
    assert.equal(payload.contentJson, undefined);
  });
});

describe('readAdminImportUrlBody', () => {
  it('returns the trimmed url for a valid string', () => {
    const result = readAdminImportUrlBody({ url: '  https://example.com/photo.jpg  ' });
    assert.equal(result.url, 'https://example.com/photo.jpg');
  });

  it('throws for a missing url key', () => {
    assert.throws(() => readAdminImportUrlBody({}), /أدخل رابط الصورة/);
  });

  it('throws for an empty string', () => {
    assert.throws(() => readAdminImportUrlBody({ url: '' }), /أدخل رابط الصورة/);
  });

  it('throws for a whitespace-only string', () => {
    assert.throws(() => readAdminImportUrlBody({ url: '   ' }), /أدخل رابط الصورة/);
  });

  it('throws for non-string values (number, null, object)', () => {
    assert.throws(() => readAdminImportUrlBody({ url: 42 }),   /أدخل رابط الصورة/);
    assert.throws(() => readAdminImportUrlBody({ url: null }), /أدخل رابط الصورة/);
    assert.throws(() => readAdminImportUrlBody({ url: {} }),   /أدخل رابط الصورة/);
  });
});

describe('assertAdminPublishCopy', () => {
  it('accepts titles and excerpts within Studio limits', () => {
    assert.doesNotThrow(() => assertAdminPublishCopy({
      title: 'أ'.repeat(ADMIN_TITLE_MIN),
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MIN),
    }));
    assert.doesNotThrow(() => assertAdminPublishCopy({
      title: 'أ'.repeat(ADMIN_TITLE_MAX),
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MAX),
    }));
  });

  it('rejects titles and excerpts outside Studio limits', () => {
    assert.throws(() => assertAdminPublishCopy({
      title: 'قصير',
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MIN),
    }));
    assert.throws(() => assertAdminPublishCopy({
      title: 'أ'.repeat(ADMIN_TITLE_MAX + 1),
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MIN),
    }));
    assert.throws(() => assertAdminPublishCopy({
      title: 'أ'.repeat(ADMIN_TITLE_MIN),
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MIN - 1),
    }));
    assert.throws(() => assertAdminPublishCopy({
      title: 'أ'.repeat(ADMIN_TITLE_MIN),
      excerpt: 'ب'.repeat(ADMIN_EXCERPT_MAX + 1),
    }));
  });
});
