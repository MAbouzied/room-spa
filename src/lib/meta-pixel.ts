/** Room Spa Meta Pixel. Loaded on public pages in production only. */

const META_PIXEL_ID_RE = /^\d{15,16}$/;

export const DEFAULT_META_PIXEL_ID = '2637443456771271';

type FbqFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
};

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
    __roomMetaBound?: boolean;
  }
}

export function isMetaPixelId(value: unknown): value is string {
  return typeof value === 'string' && META_PIXEL_ID_RE.test(value.trim());
}

/** Returns a Meta Pixel id, or an empty string when the value is invalid. */
export function resolveMetaPixelId(value: unknown): string {
  if (!isMetaPixelId(value)) return '';
  return value.trim();
}

export function metaNoscriptSrc(pixelId: string): string {
  const id = resolveMetaPixelId(pixelId);
  if (!id) return '';
  return `https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`;
}

/** Sends PageView. Name, phone, and email are never attached. */
export function trackMetaPageView(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', 'PageView');
}
