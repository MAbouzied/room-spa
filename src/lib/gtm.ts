/** Validate a Google Analytics 4 measurement ID (G-XXXXXXXX). */
export function isGaMeasurementId(value: unknown): value is string {
  return typeof value === 'string' && /^G-[A-Z0-9]+$/i.test(value.trim());
}

export function isGtmContainerId(value: unknown): value is string {
  return typeof value === 'string' && /^GTM-[A-Z0-9]+$/i.test(value.trim());
}

export const GTM_EVENTS = {
  whatsapp: 'contact_whatsapp',
  call: 'contact_call',
  email: 'contact_email',
  formSubmit: 'contact_form_submit',
} as const;

export function isGtmEventName(value: unknown): value is string {
  return typeof value === 'string' && (Object.values(GTM_EVENTS) as string[]).includes(value);
}

export type GtmContactEvent =
  | (typeof GTM_EVENTS)[keyof typeof GTM_EVENTS];

export type GtmEventParams = {
  location?: string;
  link_url?: string;
  form_id?: string;
  service?: string;
  eventCallback?: () => void;
  eventTimeout?: number;
  [key: string]: string | number | (() => void) | undefined;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    __roomGtmBound?: boolean;
  }
}

export function resolveContactEvent(href: string): GtmContactEvent | null {
  const value = href.trim().toLowerCase();

  if (value.startsWith('tel:')) {
    return GTM_EVENTS.call;
  }

  if (value.startsWith('mailto:')) {
    return GTM_EVENTS.email;
  }

  if (
    value.includes('api.whatsapp.com')
    || value.includes('wa.me/')
    || value.includes('whatsapp.com')
  ) {
    return GTM_EVENTS.whatsapp;
  }

  return null;
}

export function gtmContactAttrs(
  event: GtmContactEvent,
  location: string,
): Record<'data-gtm-event' | 'data-gtm-location', string> {
  return {
    'data-gtm-event': event,
    'data-gtm-location': location,
  };
}

export function gtmAttrsForHref(
  href: string,
  location: string,
): Record<'data-gtm-event' | 'data-gtm-location', string> | Record<string, never> {
  const event = resolveContactEvent(href);
  if (!event) {
    return {};
  }

  return gtmContactAttrs(event, location);
}

export function trackGtmPageView(): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: window.location.pathname,
    page_location: window.location.href,
  });
}

export function pushGtmEvent(event: string, params: GtmEventParams = {}): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    ...params,
  });

  if (typeof window.gtag !== 'function') {
    return;
  }

  const { eventCallback, eventTimeout, ...gtagParams } = params;
  window.gtag('event', event, {
    ...gtagParams,
    ...(eventCallback ? { event_callback: eventCallback } : {}),
    ...(typeof eventTimeout === 'number' ? { event_timeout: eventTimeout } : {}),
  });
}
