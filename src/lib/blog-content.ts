const ALLOWED_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'h4',
  'strong',
  'em',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'cite',
  'a',
  'br',
  'figure',
  'figcaption',
  'img',
  'div',
  'video',
  'source',
  'iframe',
]);

const URL_ATTRIBUTES = new Set(['href', 'src', 'poster']);
const SAFE_ATTRIBUTES = new Set(['alt', 'title', 'target', 'rel', 'class', 'style', 'width', 'height']);

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /^data:/i.test(trimmed) || /^javascript:/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return trimmed;
  }
  return null;
}

function sanitizeAttributes(raw: string, tag: string): string {
  const attributes: string[] = [];
  const matcher = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(raw))) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    if (name.startsWith('on') || (!SAFE_ATTRIBUTES.has(name) && !URL_ATTRIBUTES.has(name))) continue;
    if (URL_ATTRIBUTES.has(name)) {
      const url = safeUrl(value);
      if (!url) continue;
      if (tag === 'iframe' && name === 'src' && !/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|player\.vimeo\.com)\//i.test(url)) {
        continue;
      }
      attributes.push(`${name}="${escapeHtml(url).replace(/"/g, '&quot;')}"`);
      continue;
    }
    if (name === 'style') {
      const style = value
        .split(';')
        .map((rule) => rule.trim())
        .filter((rule) => /^(text-align|max-width|object-fit|border-radius)\s*:/i.test(rule))
        .join('; ');
      if (!style) continue;
      attributes.push(`style="${escapeHtml(style).replace(/"/g, '&quot;')}"`);
      continue;
    }
    attributes.push(`${name}="${escapeHtml(value).replace(/"/g, '&quot;')}"`);
  }
  if (tag === 'a' && attributes.some((item) => item.startsWith('href='))) {
    attributes.push('rel="noopener noreferrer"');
  }
  return attributes.length ? ` ${attributes.join(' ')}` : '';
}

/** Allowlist sanitizer for editor output before it is stored or rendered. */
export function sanitizeBlogHtml(input: string): string {
  const withoutDangerousBlocks = input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\s*(script|style|object|embed|form)[^>]*>[\s\S]*?<\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|style|object|embed|form)[^>]*\/?>/gi, '');

  return withoutDangerousBlocks.replace(/<\/?\s*([:\w-]+)([^>]*)>/g, (full, rawTag: string, rawAttributes: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (full.startsWith('</')) return `</${tag}>`;
    const selfClosing = /\/\s*>$/.test(full) || tag === 'br' || tag === 'img' || tag === 'source';
    return `<${tag}${sanitizeAttributes(rawAttributes, tag)}${selfClosing ? ' />' : '>'}`;
  });
}

export function htmlToPlainText(input: string): string {
  return input
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
