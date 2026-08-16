import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SNAP_PIXEL_ID,
  SNAP_EVENTS,
  compactSnapParams,
  contentFromBookingHref,
  contentFromPathname,
  isSnapPixelId,
  parseSnapPrice,
  resolveSnapPixelId,
  snapParamsFromBookingValue,
  trackSnapEvent,
  trackSnapPageView,
} from './snap-pixel.ts';

test('accepts Snap pixel UUIDs and rejects other values', () => {
  assert.equal(isSnapPixelId('3ad0997f-8b67-4f3f-866d-def7dfb6cbd2'), true);
  assert.equal(isSnapPixelId(' 3AD0997F-8B67-4F3F-866D-DEF7DFB6CBD2 '), true);
  assert.equal(isSnapPixelId('G-KKSXRY8MSN'), false);
  assert.equal(isSnapPixelId('3ad0997f8b674f3f866ddef7dfb6cbd2'), false);
  assert.equal(isSnapPixelId(''), false);
  assert.equal(isSnapPixelId(undefined), false);
});

test('resolveSnapPixelId prefers a valid override and falls back to the site pixel', () => {
  assert.equal(resolveSnapPixelId(undefined), DEFAULT_SNAP_PIXEL_ID);
  assert.equal(resolveSnapPixelId(''), DEFAULT_SNAP_PIXEL_ID);
  assert.equal(
    resolveSnapPixelId('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'),
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  );
});

test('parses numeric SAR prices and ignores menu-only labels', () => {
  assert.equal(parseSnapPrice('199'), 199);
  assert.equal(parseSnapPrice('٢٥٠ ر.س'), 250);
  assert.equal(parseSnapPrice('ضمن العروض'), undefined);
  assert.equal(parseSnapPrice('Via offers'), undefined);
  assert.equal(parseSnapPrice(''), undefined);
});

test('compacts Snap params and drops placeholders', () => {
  assert.deepEqual(
    compactSnapParams({
      price: 199,
      currency: 'SAR',
      item_ids: ['relaxation-massage'],
      item_category: 'service',
      number_items: 1,
      user_email: '__INSERT_USER_EMAIL__',
      user_phone_number: '0538770710',
      transaction_id: 'INSERT_TRANSACTION_ID',
    }),
    {
      price: 199,
      currency: 'SAR',
      item_ids: ['relaxation-massage'],
      item_category: 'service',
      number_items: 1,
      user_phone_number: '0538770710',
    },
  );
});

test('reads catalog content from public detail paths', () => {
  assert.deepEqual(contentFromPathname('/gift/'), {
    item_ids: ['gift'],
    item_category: 'gift',
  });
  assert.deepEqual(contentFromPathname('/form/'), {
    item_ids: ['contact-form'],
    item_category: 'form',
  });
  assert.deepEqual(contentFromPathname('/blogs/massage-guide/'), {
    item_ids: ['massage-guide'],
    item_category: 'blog',
  });
  assert.equal(contentFromPathname('/blogs/'), null);
  assert.equal(contentFromPathname('/'), null);
});

test('reads booking intent from WhatsApp and form links', () => {
  assert.deepEqual(contentFromBookingHref('/form/?service=service:relaxation-massage'), {
    item_ids: ['relaxation-massage'],
    item_category: 'service',
  });
  assert.deepEqual(
    contentFromBookingHref('https://roomspa-sa.com/form/?item=royal&department=package'),
    {
      item_ids: ['royal'],
      item_category: 'package',
    },
  );
  assert.equal(contentFromBookingHref('/gift/'), null);
  assert.equal(contentFromBookingHref('https://api.whatsapp.com/send/?phone=966538770710'), null);
});

test('builds purchase params from a booking select value', () => {
  assert.deepEqual(
    snapParamsFromBookingValue('package:royal', { phone: '0538770710' }),
    {
      item_ids: ['royal'],
      item_category: 'package',
      number_items: 1,
      currency: 'SAR',
      user_phone_number: '+966538770710',
    },
  );
  assert.equal(
    snapParamsFromBookingValue('', { phone: '966538770710' }).user_phone_number,
    '+966538770710',
  );
});

test('trackSnapEvent sends named events with cleaned params', () => {
  const calls: unknown[][] = [];
  globalThis.window = {
    snaptr(...args: unknown[]) {
      calls.push(args);
    },
  } as Window & typeof globalThis;

  trackSnapEvent(SNAP_EVENTS.viewContent, {
    item_ids: ['relaxation-massage'],
    item_category: 'service',
    user_email: '',
  });
  trackSnapPageView();

  assert.deepEqual(calls[0], [
    'track',
    'VIEW_CONTENT',
    { item_ids: ['relaxation-massage'], item_category: 'service' },
  ]);
  assert.deepEqual(calls[1], ['track', 'PAGE_VIEW']);
  delete (globalThis as { window?: unknown }).window;
});

test('trackSnapEvent is a no-op without snaptr', () => {
  assert.doesNotThrow(() => trackSnapEvent(SNAP_EVENTS.purchase));
});
