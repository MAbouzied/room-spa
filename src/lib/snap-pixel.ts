const SNAP_PIXEL_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLACEHOLDER = /insert|__insert/i;
const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const DEFAULT_SNAP_PIXEL_ID = '3ad0997f-8b67-4f3f-866d-def7dfb6cbd2';

export const SNAP_EVENTS = {
  pageView: 'PAGE_VIEW',
  viewContent: 'VIEW_CONTENT',
  addCart: 'ADD_CART',
  purchase: 'PURCHASE',
} as const;

export type SnapEventName = (typeof SNAP_EVENTS)[keyof typeof SNAP_EVENTS];

export type SnapContent = {
  item_ids: string[];
  item_category: string;
};

export type SnapEventParams = {
  price?: number;
  currency?: string;
  transaction_id?: string;
  item_ids?: string[];
  item_category?: string;
  number_items?: number;
  user_email?: string;
  user_phone_number?: string;
};

export type SnaptrFn = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  handleRequest?: (...args: unknown[]) => void;
};

declare global {
  interface Window {
    snaptr?: SnaptrFn;
    __roomSnapBound?: boolean;
  }
}

export function isSnapPixelId(value: unknown): value is string {
  return typeof value === 'string' && SNAP_PIXEL_ID.test(value.trim());
}

export function resolveSnapPixelId(value: unknown): string {
  if (isSnapPixelId(value)) {
    return value.trim();
  }

  return DEFAULT_SNAP_PIXEL_ID;
}

export function parseSnapPrice(value: unknown): number | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const normalized = String(value)
    .replace(/[٠-٩]/gu, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit)))
    .replace(/[^\d.]/gu, '')
    .replace(/^\.+|\.+$/gu, '');

  if (!normalized) {
    return undefined;
  }

  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

function isUsableValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 && !PLACEHOLDER.test(trimmed);
  }

  if (Array.isArray(value)) {
    return value.some((item) => isUsableValue(item));
  }

  return false;
}

export function compactSnapParams(params: SnapEventParams): Record<string, unknown> {
  const next: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!isUsableValue(value)) {
      continue;
    }

    if (Array.isArray(value)) {
      const items = value
        .map((item) => String(item).trim())
        .filter((item) => item && !PLACEHOLDER.test(item));
      if (items.length > 0) {
        next[key] = items;
      }
      continue;
    }

    next[key] = typeof value === 'string' ? value.trim() : value;
  }

  return next;
}

function localeNeutralPath(pathname: string): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return path.endsWith('/') || path === '/' ? path : `${path}/`;
}

export function contentFromPathname(pathname: string): SnapContent | null {
  const path = localeNeutralPath(pathname);

  if (path === '/gift/') {
    return { item_ids: ['gift'], item_category: 'gift' };
  }

  if (path === '/form/') {
    return { item_ids: ['contact-form'], item_category: 'form' };
  }

  const blogMatch = path.match(/^\/blogs\/([^/]+)\/?$/);
  if (!blogMatch) {
    return null;
  }

  const slug = decodeURIComponent(blogMatch[1]).trim();
  if (!slug || slug === 'page') {
    return null;
  }

  return {
    item_ids: [slug],
    item_category: 'blog',
  };
}

export function contentFromBookingHref(href: string): SnapContent | null {
  let url: URL;
  try {
    url = new URL(href, 'https://roomspa-sa.com');
  } catch {
    return null;
  }

  if (localeNeutralPath(url.pathname) !== '/form/') {
    return null;
  }

  const service = url.searchParams.get('service')?.trim();
  if (service?.includes(':')) {
    const [item_category, itemId] = service.split(':');
    if (item_category && itemId) {
      return { item_ids: [itemId], item_category };
    }
  }

  const department = url.searchParams.get('department')?.trim();
  const item = url.searchParams.get('item')?.trim();
  if (!department || department === 'general' || !item) {
    return null;
  }

  return {
    item_ids: [item],
    item_category: department,
  };
}

function toE164Saudi(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) return `+${digits}`;
  if (digits.startsWith('05') || (digits.startsWith('5') && digits.length === 9)) {
    return `+966${digits.replace(/^0/, '')}`;
  }
  return phone;
}

export function snapParamsFromBookingValue(
  value: string,
  extras: { phone?: string; price?: number; transactionId?: string } = {},
): SnapEventParams {
  const [item_category, itemId] = value.split(':');
  return compactSnapParams({
    item_category: item_category || undefined,
    item_ids: itemId ? [itemId] : undefined,
    number_items: 1,
    currency: 'SAR',
    user_phone_number: extras.phone ? toE164Saudi(extras.phone) : undefined,
    price: extras.price,
    transaction_id: extras.transactionId,
  }) as SnapEventParams;
}

export function trackSnapEvent(event: SnapEventName, params: SnapEventParams = {}): void {
  if (typeof window === 'undefined' || typeof window.snaptr !== 'function') {
    return;
  }

  const cleaned = compactSnapParams(params);
  if (Object.keys(cleaned).length === 0) {
    window.snaptr('track', event);
    return;
  }

  window.snaptr('track', event, cleaned);
}

export function trackSnapPageView(params: SnapEventParams = {}): void {
  trackSnapEvent(SNAP_EVENTS.pageView, params);
}

export function trackSnapViewContent(params: SnapEventParams = {}): void {
  trackSnapEvent(SNAP_EVENTS.viewContent, params);
}

export function trackSnapAddCart(params: SnapEventParams = {}): void {
  trackSnapEvent(SNAP_EVENTS.addCart, { number_items: 1, currency: 'SAR', ...params });
}

export function trackSnapPurchase(params: SnapEventParams = {}): void {
  trackSnapEvent(SNAP_EVENTS.purchase, { number_items: 1, currency: 'SAR', ...params });
}
