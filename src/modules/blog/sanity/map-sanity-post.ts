import { sanitizeBlogHtml } from '../../../lib/blog-content.ts';
import { validateBlogPost } from '../model/blog-schema.ts';
import type { BlogPost } from '../model/blog-types.ts';
import { mapSanityImage, type SanityImageUrlConfig } from './image.ts';
import type { SanityBlogPostDoc } from './types.ts';

function requireString(
  value: string | null | undefined,
  documentId: string,
  field: string,
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`Sanity document ${documentId}: missing ${field}`);
  }
  return trimmed;
}

export function mapSanityPostToBlogPost(
  doc: SanityBlogPostDoc,
  imageConfig: SanityImageUrlConfig,
): BlogPost {
  const documentId = doc._id;

  try {
    const slug = requireString(doc.slug, documentId, 'slug');
    const title = requireString(doc.title, documentId, 'title');
    const excerpt = requireString(doc.excerpt, documentId, 'excerpt');
    const publishedAt = requireString(doc.publishedAt, documentId, 'publishedAt');
    const locale = doc.locale === 'ar' ? 'ar' : null;
    if (!locale) {
      throw new Error(`Sanity document ${documentId}: locale must be "ar"`);
    }

    const adminHtmlPost = Boolean(doc.bodyHtml?.trim());
    const categoryId = adminHtmlPost
      ? doc.category?.categoryId?.trim() || 'general'
      : requireString(doc.category?.categoryId, documentId, 'category.categoryId');
    const categoryLabel = adminHtmlPost
      ? doc.category?.label?.trim() || 'عام'
      : requireString(doc.category?.label, documentId, 'category.label');
    const authorName = adminHtmlPost
      ? doc.author?.name?.trim() || 'فريق روم سبا'
      : requireString(doc.author?.name, documentId, 'author.name');

    if ((!Array.isArray(doc.body) || doc.body.length === 0) && !doc.bodyHtml?.trim()) {
      throw new Error(`Sanity document ${documentId}: body is empty`);
    }

    const cover = doc.cover
      ? mapSanityImage(imageConfig, doc.cover, title, documentId, 'cover')
      : adminHtmlPost
        ? {
            src: doc.coverUrl?.trim() || '/images/offers/wellness.jpg',
            alt: title,
            width: 1600,
            height: 1067,
          }
        : mapSanityImage(imageConfig, doc.cover, title, documentId, 'cover');

    const authorImage = doc.author?.image?.asset
      ? mapSanityImage(imageConfig, doc.author.image, authorName, documentId, 'author.image')
      : undefined;

    const relatedSlugs = (doc.relatedPosts ?? [])
      .map((item) => item.slug?.trim())
      .filter((slugValue): slugValue is string => Boolean(slugValue));

    const candidate = {
      id: documentId,
      slug,
      locale: 'ar' as const,
      title,
      excerpt,
      category: { id: categoryId, label: categoryLabel },
      author: {
        name: authorName,
        ...(doc.author?.role?.trim() ? { role: doc.author.role.trim() } : {}),
        ...(authorImage ? { image: authorImage } : {}),
      },
      cover,
      publishedAt,
      ...(doc.updatedAt?.trim() ? { updatedAt: doc.updatedAt.trim() } : {}),
      featured: doc.featured === true,
      draft: false,
      seo: {
        ...(doc.seo?.title?.trim() ? { title: doc.seo.title.trim() } : {}),
        ...(doc.seo?.description?.trim()
          ? { description: doc.seo.description.trim() }
          : {}),
        ...(doc.seo?.focusKeyword?.trim() ? { focusKeyword: doc.seo.focusKeyword.trim() } : {}),
        ...(doc.seo?.canonicalUrl?.trim() ? { canonicalUrl: doc.seo.canonicalUrl.trim() } : {}),
      },
      body: doc.bodyHtml?.trim()
        ? { format: 'html' as const, html: sanitizeBlogHtml(doc.bodyHtml) }
        : { format: 'portableText' as const, value: doc.body ?? [] },
      ...(doc.relatedServiceId?.trim() ? { relatedServiceId: doc.relatedServiceId.trim() } : {}),
      ...(relatedSlugs.length > 0 ? { relatedSlugs } : {}),
      ...(typeof doc.readingTimeMinutes === 'number'
        ? { readingTimeMinutes: doc.readingTimeMinutes }
        : {}),
    };

    const { post, issues } = validateBlogPost(candidate);
    if (!post) {
      const messages = issues.map((issue) => issue.message).join('; ');
      throw new Error(`Sanity document ${documentId}: validation failed — ${messages}`);
    }
    return post;
  } catch (error) {
    if (error instanceof Error && error.message.includes(documentId)) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Sanity document ${documentId}: ${message}`);
  }
}

export function mapSanityPosts(
  docs: readonly SanityBlogPostDoc[],
  imageConfig: SanityImageUrlConfig,
): BlogPost[] {
  const posts: BlogPost[] = [];
  const errors: string[] = [];

  for (const doc of docs) {
    try {
      posts.push(mapSanityPostToBlogPost(doc, imageConfig));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Sanity published-content mapping failed (${errors.length}):\n${errors.join('\n')}`,
    );
  }

  return posts;
}
