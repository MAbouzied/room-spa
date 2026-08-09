import type { BlogBody, BlogContentBlock, BlogPost } from '../model/blog-types.ts';

const WORDS_PER_MINUTE = 180;

function extractFromBlocks(blocks: readonly BlogContentBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
      case 'heading':
      case 'quote':
        parts.push(block.text);
        break;
      case 'unordered-list':
      case 'ordered-list':
        parts.push(...block.items);
        break;
      case 'link-paragraph':
        parts.push(...block.parts.map((part) => part.text));
        break;
      case 'image':
        if (block.image.caption) parts.push(block.image.caption);
        parts.push(block.image.alt);
        break;
      case 'two-column':
        parts.push(extractFromBlocks(block.columns[0]));
        parts.push(extractFromBlocks(block.columns[1]));
        break;
      case 'embed-placeholder':
        parts.push(block.label);
        break;
      default:
        break;
    }
  }

  return parts.join(' ');
}

function extractFromPortableText(value: readonly unknown[]): string {
  const parts: string[] = [];

  const walk = (nodes: readonly unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const record = node as Record<string, unknown>;
      if (typeof record.text === 'string') parts.push(record.text);
      if (typeof record.alt === 'string') parts.push(record.alt);
      if (typeof record.caption === 'string') parts.push(record.caption);
      if (typeof record.label === 'string') parts.push(record.label);
      if (Array.isArray(record.children)) walk(record.children);
      if (Array.isArray(record.left)) walk(record.left);
      if (Array.isArray(record.right)) walk(record.right);
    }
  };

  walk(value);
  return parts.join(' ');
}

export function extractBlogText(body: BlogBody): string {
  if (body.format === 'blocks') {
    return extractFromBlocks(body.blocks);
  }

  if (body.format === 'portableText') {
    return extractFromPortableText(body.value);
  }

  if (body.format === 'html') {
    return body.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  try {
    const parsed = JSON.parse(body.json) as { text?: string };
    return typeof parsed.text === 'string' ? parsed.text : '';
  } catch {
    return '';
  }
}

export function countWords(text: string): number {
  const matches = text.trim().match(/[\p{L}\p{N}]+/gu);
  return matches?.length ?? 0;
}

export function calculateReadingTimeMinutes(text: string): number {
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function readingTimeForPost(post: BlogPost): number {
  if (typeof post.readingTimeMinutes === 'number' && post.readingTimeMinutes >= 1) {
    return Math.round(post.readingTimeMinutes);
  }
  return calculateReadingTimeMinutes(extractBlogText(post.body));
}
