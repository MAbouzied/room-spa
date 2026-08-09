import { sanitizeBlogHtml } from '../../../lib/blog-content.ts';
import { parseBlogDate } from '../lib/date-format.ts';
import { isValidBlogSlug } from '../lib/slug.ts';
import { extractBlogText } from '../lib/reading-time.ts';
import type {
  BlogAuthor,
  BlogBody,
  BlogCategory,
  BlogContentBlock,
  BlogImage,
  BlogPost,
  BlogSeo,
} from './blog-types.ts';

export interface BlogValidationIssue {
  level: 'error' | 'warning';
  message: string;
  postId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, field: string, issues: BlogValidationIssue[], postId?: string): string | null {
  if (typeof value !== 'string' || value.trim().length === 0) {
    issues.push({ level: 'error', message: `Missing or empty ${field}`, postId });
    return null;
  }
  return value.trim();
}

function validateImage(
  value: unknown,
  field: string,
  issues: BlogValidationIssue[],
  postId?: string,
): BlogImage | null {
  if (!isRecord(value)) {
    issues.push({ level: 'error', message: `${field} must be an object`, postId });
    return null;
  }

  const src = requireString(value.src, `${field}.src`, issues, postId);
  const alt = requireString(value.alt, `${field}.alt`, issues, postId);
  const width = typeof value.width === 'number' && value.width > 0 ? value.width : null;
  const height = typeof value.height === 'number' && value.height > 0 ? value.height : null;

  if (width === null) issues.push({ level: 'error', message: `${field}.width must be a positive number`, postId });
  if (height === null) issues.push({ level: 'error', message: `${field}.height must be a positive number`, postId });
  if (!src || !alt || width === null || height === null) return null;

  const image: BlogImage = { src, alt, width, height };
  if (typeof value.caption === 'string' && value.caption.trim()) image.caption = value.caption.trim();
  if (
    isRecord(value.focalPoint) &&
    typeof value.focalPoint.x === 'number' &&
    typeof value.focalPoint.y === 'number'
  ) {
    image.focalPoint = { x: value.focalPoint.x, y: value.focalPoint.y };
  }
  return image;
}

function validateCategory(
  value: unknown,
  issues: BlogValidationIssue[],
  postId?: string,
): BlogCategory | null {
  if (!isRecord(value)) {
    issues.push({ level: 'error', message: 'category must be an object', postId });
    return null;
  }
  const id = requireString(value.id, 'category.id', issues, postId);
  const label = requireString(value.label, 'category.label', issues, postId);
  if (!id || !label) return null;
  return { id, label };
}

function validateAuthor(
  value: unknown,
  issues: BlogValidationIssue[],
  postId?: string,
): BlogAuthor | null {
  if (!isRecord(value)) {
    issues.push({ level: 'error', message: 'author must be an object', postId });
    return null;
  }
  const name = requireString(value.name, 'author.name', issues, postId);
  if (!name) return null;
  const author: BlogAuthor = { name };
  if (typeof value.role === 'string' && value.role.trim()) author.role = value.role.trim();
  if (value.image !== undefined) {
    const image = validateImage(value.image, 'author.image', issues, postId);
    if (image) author.image = image;
  }
  return author;
}

function validateSeo(value: unknown, issues: BlogValidationIssue[], postId?: string): BlogSeo {
  if (value === undefined) return {};
  if (!isRecord(value)) {
    issues.push({ level: 'error', message: 'seo must be an object', postId });
    return {};
  }
  const seo: BlogSeo = {};
  if (typeof value.title === 'string' && value.title.trim()) seo.title = value.title.trim();
  if (typeof value.description === 'string' && value.description.trim()) {
    seo.description = value.description.trim();
  }
  if (typeof value.focusKeyword === 'string' && value.focusKeyword.trim()) {
    seo.focusKeyword = value.focusKeyword.trim();
  }
  if (typeof value.canonicalUrl === 'string' && value.canonicalUrl.trim()) {
    seo.canonicalUrl = value.canonicalUrl.trim();
  }
  if (value.ogImage !== undefined) {
    const ogImage = validateImage(value.ogImage, 'seo.ogImage', issues, postId);
    if (ogImage) seo.ogImage = ogImage;
  }
  return seo;
}

function validateBlocks(
  blocks: unknown,
  issues: BlogValidationIssue[],
  postId?: string,
): BlogContentBlock[] {
  if (!Array.isArray(blocks)) {
    issues.push({ level: 'error', message: 'body.blocks must be an array', postId });
    return [];
  }

  const result: BlogContentBlock[] = [];
  for (const [index, block] of blocks.entries()) {
    if (!isRecord(block) || typeof block.type !== 'string') {
      issues.push({ level: 'warning', message: `Skipping unknown block at index ${index}`, postId });
      continue;
    }

    switch (block.type) {
      case 'paragraph':
      case 'quote': {
        const text = requireString(block.text, `blocks[${index}].text`, issues, postId);
        if (!text) break;
        if (block.type === 'quote') {
          result.push({
            type: 'quote',
            text,
            ...(typeof block.attribution === 'string' ? { attribution: block.attribution } : {}),
          });
        } else {
          result.push({ type: 'paragraph', text });
        }
        break;
      }
      case 'heading': {
        const text = requireString(block.text, `blocks[${index}].text`, issues, postId);
        const level = block.level === 2 || block.level === 3 ? block.level : null;
        if (!level) {
          issues.push({ level: 'error', message: `blocks[${index}].level must be 2 or 3`, postId });
          break;
        }
        if (!text) break;
        result.push({
          type: 'heading',
          level,
          text,
          ...(typeof block.id === 'string' ? { id: block.id } : {}),
        });
        break;
      }
      case 'unordered-list':
      case 'ordered-list': {
        if (!Array.isArray(block.items) || block.items.some((item) => typeof item !== 'string')) {
          issues.push({ level: 'error', message: `blocks[${index}].items must be string[]`, postId });
          break;
        }
        result.push({
          type: block.type,
          items: block.items.map((item) => String(item).trim()).filter(Boolean),
        });
        break;
      }
      case 'image': {
        const image = validateImage(block.image, `blocks[${index}].image`, issues, postId);
        if (image) result.push({ type: 'image', image });
        break;
      }
      case 'link-paragraph': {
        if (!Array.isArray(block.parts)) {
          issues.push({ level: 'error', message: `blocks[${index}].parts must be an array`, postId });
          break;
        }
        const parts = block.parts
          .filter(isRecord)
          .map((part) => {
            const text = typeof part.text === 'string' ? part.text : '';
            if (!text) return null;
            const entry: { text: string; href?: string; external?: boolean } = { text };
            if (typeof part.href === 'string') entry.href = part.href;
            if (part.external === true) entry.external = true;
            return entry;
          })
          .filter((part): part is { text: string; href?: string; external?: boolean } => part !== null);
        if (parts.length > 0) result.push({ type: 'link-paragraph', parts });
        break;
      }
      case 'two-column': {
        if (!Array.isArray(block.columns) || block.columns.length !== 2) {
          issues.push({ level: 'error', message: `blocks[${index}].columns must be a pair`, postId });
          break;
        }
        result.push({
          type: 'two-column',
          columns: [
            validateBlocks(block.columns[0], issues, postId),
            validateBlocks(block.columns[1], issues, postId),
          ],
        });
        break;
      }
      case 'embed-placeholder': {
        const label = requireString(block.label, `blocks[${index}].label`, issues, postId);
        if (!label) break;
        result.push({
          type: 'embed-placeholder',
          label,
          ...(typeof block.provider === 'string' ? { provider: block.provider } : {}),
        });
        break;
      }
      default:
        issues.push({
          level: 'warning',
          message: `Skipping unknown block type "${String(block.type)}" at index ${index}`,
          postId,
        });
    }
  }

  return result;
}

function validateBody(value: unknown, issues: BlogValidationIssue[], postId?: string): BlogBody | null {
  if (!isRecord(value) || typeof value.format !== 'string') {
    issues.push({ level: 'error', message: 'body.format is required', postId });
    return null;
  }

  if (value.format === 'blocks') {
    return { format: 'blocks', blocks: validateBlocks(value.blocks, issues, postId) };
  }

  if (value.format === 'portableText') {
    if (!Array.isArray(value.value) || value.value.length === 0) {
      issues.push({
        level: 'error',
        message: 'portableText body requires a non-empty value array',
        postId,
      });
      return null;
    }
    return { format: 'portableText', value: value.value };
  }

  if (value.format === 'lexical') {
    if (typeof value.version !== 'number' || typeof value.json !== 'string') {
      issues.push({ level: 'error', message: 'lexical body requires version and json', postId });
      return null;
    }
    return { format: 'lexical', version: value.version, json: value.json };
  }

  if (value.format === 'html') {
    if (typeof value.html !== 'string' || value.html.trim().length === 0) {
      issues.push({ level: 'error', message: 'html body requires non-empty html', postId });
      return null;
    }
    const html = sanitizeBlogHtml(value.html);
    if (!html.trim()) {
      issues.push({ level: 'error', message: 'html body requires non-empty html', postId });
      return null;
    }
    return { format: 'html', html };
  }

  issues.push({ level: 'error', message: `Unsupported body format "${value.format}"`, postId });
  return null;
}

export function validateBlogPost(raw: unknown): { post: BlogPost | null; issues: BlogValidationIssue[] } {
  const issues: BlogValidationIssue[] = [];
  if (!isRecord(raw)) {
    return { post: null, issues: [{ level: 'error', message: 'Post must be an object' }] };
  }

  const id = requireString(raw.id, 'id', issues);
  const slug = requireString(raw.slug, 'slug', issues, id ?? undefined);
  const title = requireString(raw.title, 'title', issues, id ?? undefined);
  const excerpt = requireString(raw.excerpt, 'excerpt', issues, id ?? undefined);
  const publishedAt = requireString(raw.publishedAt, 'publishedAt', issues, id ?? undefined);

  if (slug && !isValidBlogSlug(slug)) {
    issues.push({ level: 'error', message: `Invalid slug "${slug}"`, postId: id ?? undefined });
  }

  if (publishedAt) {
    try {
      parseBlogDate(publishedAt);
    } catch {
      issues.push({ level: 'error', message: `Invalid publishedAt "${publishedAt}"`, postId: id ?? undefined });
    }
  }

  let updatedAt: string | undefined;
  if (typeof raw.updatedAt === 'string' && raw.updatedAt.trim()) {
    try {
      parseBlogDate(raw.updatedAt);
      updatedAt = raw.updatedAt;
    } catch {
      issues.push({ level: 'error', message: `Invalid updatedAt "${raw.updatedAt}"`, postId: id ?? undefined });
    }
  }

  if (raw.locale !== 'ar') {
    issues.push({ level: 'error', message: 'locale must be "ar"', postId: id ?? undefined });
  }

  const category = validateCategory(raw.category, issues, id ?? undefined);
  const author = validateAuthor(raw.author, issues, id ?? undefined);
  const cover = validateImage(raw.cover, 'cover', issues, id ?? undefined);
  const seo = validateSeo(raw.seo, issues, id ?? undefined);
  const body = validateBody(raw.body, issues, id ?? undefined);

  const hasErrors = issues.some((issue) => issue.level === 'error');
  if (
    hasErrors ||
    !id ||
    !slug ||
    !title ||
    !excerpt ||
    !publishedAt ||
    !category ||
    !author ||
    !cover ||
    !body ||
    raw.locale !== 'ar'
  ) {
    return { post: null, issues };
  }

  if (
    (body.format === 'blocks' || body.format === 'portableText' || body.format === 'html') &&
    extractBlogText(body).trim().length === 0
  ) {
    issues.push({ level: 'error', message: 'Published posts cannot have an empty body', postId: id });
    return { post: null, issues };
  }

  const post: BlogPost = {
    id,
    slug,
    locale: 'ar',
    title,
    excerpt,
    category,
    author,
    cover,
    publishedAt,
    featured: raw.featured === true,
    draft: raw.draft === true,
    seo,
    body,
    ...(updatedAt ? { updatedAt } : {}),
    ...(Array.isArray(raw.relatedSlugs)
      ? { relatedSlugs: raw.relatedSlugs.filter((item): item is string => typeof item === 'string') }
      : {}),
    ...(typeof raw.relatedServiceId === 'string' && raw.relatedServiceId.trim()
      ? { relatedServiceId: raw.relatedServiceId.trim() }
      : {}),
    ...(typeof raw.readingTimeMinutes === 'number' ? { readingTimeMinutes: raw.readingTimeMinutes } : {}),
  };

  return { post, issues };
}

export function validateBlogCollection(rawPosts: readonly unknown[]): {
  posts: BlogPost[];
  issues: BlogValidationIssue[];
} {
  const issues: BlogValidationIssue[] = [];
  const posts: BlogPost[] = [];
  const seenSlugs = new Map<string, string>();

  for (const raw of rawPosts) {
    const result = validateBlogPost(raw);
    issues.push(...result.issues);
    if (!result.post) continue;

    const previousId = seenSlugs.get(result.post.slug);
    if (previousId) {
      issues.push({
        level: 'error',
        message: `Duplicate slug "${result.post.slug}" shared by ${previousId} and ${result.post.id}`,
        postId: result.post.id,
      });
      continue;
    }

    seenSlugs.set(result.post.slug, result.post.id);
    posts.push(result.post);
  }

  const featured = posts.filter((post) => post.featured && !post.draft);
  if (featured.length > 1) {
    const newest = [...featured].sort((a, b) => {
      const byDate = parseBlogDate(b.publishedAt).getTime() - parseBlogDate(a.publishedAt).getTime();
      return byDate !== 0 ? byDate : a.slug.localeCompare(b.slug);
    })[0];
    issues.push({
      level: 'warning',
      message: `Multiple featured posts found (${featured.length}). Using newest deterministically: ${newest?.slug ?? 'unknown'}`,
    });
  }

  if (issues.some((issue) => issue.level === 'error')) {
    const messages = issues
      .filter((issue) => issue.level === 'error')
      .map((issue) => issue.message)
      .join('\n');
    throw new Error(`Blog content validation failed:\n${messages}`);
  }

  return { posts, issues };
}
