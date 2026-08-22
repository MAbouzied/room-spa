import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GTM_EVENTS,
  isGaMeasurementId,
  isGtmContainerId,
  isGtmEventName,
  pushGtmEvent,
  resolveContactEvent,
  gtmContactAttrs,
  trackGtmPageView,
} from './gtm.ts';

test('validates GA4 measurement ids', () => {
  assert.equal(isGaMeasurementId('G-D2NJJ1ZPF5'), true);
  assert.equal(isGaMeasurementId('G-XXXX'), true);
  assert.equal(isGaMeasurementId('GTM-ABC123'), false);
  assert.equal(isGaMeasurementId(''), false);
  assert.equal(isGaMeasurementId(undefined), false);
  assert.equal(isGtmContainerId('GTM-ABC123'), true);
  assert.equal(isGtmContainerId('G-D2NJJ1ZPF5'), false);
});

test('exposes contact and form event names', () => {
  assert.equal(GTM_EVENTS.whatsapp, 'contact_whatsapp');
  assert.equal(GTM_EVENTS.call, 'contact_call');
  assert.equal(GTM_EVENTS.email, 'contact_email');
  assert.equal(GTM_EVENTS.formSubmit, 'contact_form_submit');
  assert.equal(isGtmEventName('contact_whatsapp'), true);
  assert.equal(isGtmEventName('page_view'), false);
  assert.equal(isGtmEventName(''), false);
});

test('resolves contact event names from hrefs', () => {
  assert.equal(resolveContactEvent('tel:+966538770710'), 'contact_call');
  assert.equal(resolveContactEvent('mailto:info@roomspa-sa.com'), 'contact_email');
  assert.equal(
    resolveContactEvent('https://api.whatsapp.com/send/?phone=966538770710'),
    'contact_whatsapp',
  );
  assert.equal(resolveContactEvent('https://wa.me/966538770710'), 'contact_whatsapp');
  assert.equal(resolveContactEvent('/services/'), null);
  assert.equal(resolveContactEvent('#branches'), null);
});

test('builds data attributes for contact tracking', () => {
  assert.deepEqual(gtmContactAttrs('contact_whatsapp', 'header'), {
    'data-gtm-event': 'contact_whatsapp',
    'data-gtm-location': 'header',
  });
});

test('pushGtmEvent writes to window.dataLayer when available', () => {
  const dataLayer: Record<string, unknown>[] = [];
  globalThis.window = { dataLayer } as Window & typeof globalThis;

  pushGtmEvent('contact_whatsapp', { location: 'floating' });

  assert.equal(dataLayer.length, 1);
  assert.deepEqual(dataLayer[0], {
    event: 'contact_whatsapp',
    location: 'floating',
  });

  // @ts-expect-error test cleanup
  delete globalThis.window;
});

test('pushGtmEvent also forwards events to gtag when available', () => {
  const dataLayer: Record<string, unknown>[] = [];
  const gtagCalls: unknown[][] = [];
  globalThis.window = {
    dataLayer,
    gtag(...args: unknown[]) {
      gtagCalls.push(args);
    },
  } as Window & typeof globalThis;

  pushGtmEvent('contact_call', {
    location: 'header',
    eventCallback: () => {},
    eventTimeout: 150,
  });

  assert.equal(dataLayer.length, 1);
  assert.equal(gtagCalls.length, 1);
  assert.equal(gtagCalls[0][0], 'event');
  assert.equal(gtagCalls[0][1], 'contact_call');
  assert.equal((gtagCalls[0][2] as { location: string }).location, 'header');
  assert.equal(typeof (gtagCalls[0][2] as { event_callback: unknown }).event_callback, 'function');
  assert.equal((gtagCalls[0][2] as { event_timeout: number }).event_timeout, 150);

  // @ts-expect-error test cleanup
  delete globalThis.window;
});

test('pushGtmEvent is a no-op without a browser dataLayer', () => {
  assert.doesNotThrow(() => pushGtmEvent('contact_call', { location: 'footer' }));
});

test('trackGtmPageView sends a page_view event to gtag', () => {
  const gtagCalls: unknown[][] = [];
  globalThis.window = {
    location: {
      pathname: '/gift',
      href: 'https://roomspa-sa.com/gift',
    },
    gtag(...args: unknown[]) {
      gtagCalls.push(args);
    },
  } as Window & typeof globalThis;

  trackGtmPageView();

  assert.equal(gtagCalls.length, 1);
  assert.equal(gtagCalls[0][0], 'event');
  assert.equal(gtagCalls[0][1], 'page_view');
  assert.deepEqual(gtagCalls[0][2], {
    page_path: '/gift',
    page_location: 'https://roomspa-sa.com/gift',
  });

  // @ts-expect-error test cleanup
  delete globalThis.window;
});

test('trackGtmPageView is a no-op without gtag', () => {
  assert.doesNotThrow(() => trackGtmPageView());
});
