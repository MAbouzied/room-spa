import { headingIdFromText } from '../lib/slug.ts';
import type { BlogBody, BlogContentBlock, BlogPost } from '../model/blog-types.ts';

const SAFE_HREF = /^(https?:\/\/|\/|#)/i;

export interface TocItem {
  id: string;
  text: string;
}

export type RenderableBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string; id: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | {
      type: 'image';
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    }
  | {
      type: 'link-paragraph';
      parts: Array<{ text: string; href?: string; external?: boolean }>;
    }
  | { type: 'two-column'; columns: [RenderableBlock[], RenderableBlock[]] }
  | { type: 'embed-placeholder'; label: string };

export function sanitizeHref(href: string | undefined): string | undefined {
  if (!href) return undefined;
  const trimmed = href.trim();
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed)) return undefined;
  if (!SAFE_HREF.test(trimmed)) return undefined;
  return trimmed;
}

function prepareBlocks(
  blocks: readonly BlogContentBlock[],
  usedIds: Set<string>,
  onUnknown: (message: string) => void,
): RenderableBlock[] {
  const result: RenderableBlock[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        result.push({ type: 'paragraph', text: block.text });
        break;
      case 'heading': {
        const id = block.id?.trim() || headingIdFromText(block.text, usedIds);
        if (block.id?.trim()) usedIds.add(id);
        result.push({ type: 'heading', level: block.level, text: block.text, id });
        break;
      }
      case 'unordered-list':
      case 'ordered-list':
        result.push({ type: block.type, items: block.items });
        break;
      case 'quote':
        result.push({
          type: 'quote',
          text: block.text,
          ...(block.attribution ? { attribution: block.attribution } : {}),
        });
        break;
      case 'image':
        result.push({
          type: 'image',
          src: block.image.src,
          alt: block.image.alt,
          width: block.image.width,
          height: block.image.height,
          ...(block.image.caption ? { caption: block.image.caption } : {}),
        });
        break;
      case 'link-paragraph':
        result.push({
          type: 'link-paragraph',
          parts: block.parts.map((part) => ({
            text: part.text,
            ...(sanitizeHref(part.href)
              ? {
                  href: sanitizeHref(part.href),
                  external: part.external === true || /^https?:\/\//i.test(part.href ?? ''),
                }
              : {}),
          })),
        });
        break;
      case 'two-column':
        result.push({
          type: 'two-column',
          columns: [
            prepareBlocks(block.columns[0], usedIds, onUnknown),
            prepareBlocks(block.columns[1], usedIds, onUnknown),
          ],
        });
        break;
      case 'embed-placeholder':
        result.push({ type: 'embed-placeholder', label: block.label });
        break;
      default:
        onUnknown(`Unknown content block skipped: ${JSON.stringify(block)}`);
    }
  }

  return result;
}

export function prepareBlogBody(
  body: BlogBody,
  options?: { isDev?: boolean },
): { blocks: RenderableBlock[]; warnings: string[] } {
  const warnings: string[] = [];
  const onUnknown = (message: string) => {
    warnings.push(message);
    if (options?.isDev) {
      console.warn(`[blog] ${message}`);
    }
  };

  if (body.format === 'lexical') {
    onUnknown('Lexical renderer is not registered yet; body skipped safely.');
    return { blocks: [], warnings };
  }

  if (body.format === 'html') {
    return { blocks: [], warnings };
  }

  if (body.format === 'portableText') {
    return { blocks: [], warnings };
  }

  return {
    blocks: prepareBlocks(body.blocks, new Set<string>(), onUnknown),
    warnings,
  };
}

export function collectTableOfContents(blocks: readonly RenderableBlock[]): TocItem[] {
  return blocks
    .filter((block): block is Extract<RenderableBlock, { type: 'heading' }> => block.type === 'heading' && block.level === 2)
    .map((block) => ({ id: block.id, text: block.text }));
}

export function collectPortableTextTableOfContents(value: readonly unknown[]): TocItem[] {
  const items: TocItem[] = [];
  for (const node of value) {
    if (!node || typeof node !== 'object') continue;
    const record = node as Record<string, unknown>;
    if (record._type !== 'block' || record.style !== 'h2') continue;
    const children = Array.isArray(record.children) ? record.children : [];
    const text = children
      .map((child) =>
        child && typeof child === 'object' && typeof (child as { text?: unknown }).text === 'string'
          ? (child as { text: string }).text
          : '',
      )
      .join('')
      .trim();
    if (!text) continue;
    const id = typeof record._key === 'string' && record._key ? record._key : headingIdFromText(text);
    items.push({ id, text });
  }
  return items;
}

export function shouldShowTableOfContents(items: readonly TocItem[]): boolean {
  return items.length >= 4;
}

export function tableOfContentsForBody(body: BlogBody): TocItem[] {
  if (body.format === 'blocks') {
    const { blocks } = prepareBlogBody(body);
    return collectTableOfContents(blocks);
  }
  if (body.format === 'portableText') {
    return collectPortableTextTableOfContents(body.value);
  }
  if (body.format === 'html') {
    return Array.from(body.html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi))
      .map((match) => {
        const text = match[1].replace(/<[^>]+>/g, '').trim();
        return text ? { id: headingIdFromText(text), text } : null;
      })
      .filter((item): item is TocItem => Boolean(item));
  }
  return [];
}

export function articleSeoTitle(post: BlogPost): string {
  return post.seo.title?.trim() || `${post.title} | روم سبا`;
}

/** Visible title description under the H1; also drives SEO/meta fallback. */
export function articleDescription(post: BlogPost): string {
  return post.excerpt.trim();
}

export function articleSeoDescription(post: BlogPost): string {
  const seoDescription = post.seo.description?.trim();
  if (seoDescription) return seoDescription;
  return articleDescription(post);
}
