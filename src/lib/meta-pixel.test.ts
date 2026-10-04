import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_META_PIXEL_ID,
  isMetaPixelId,
  metaNoscriptSrc,
  resolveMetaPixelId,
  trackMetaPageView,
} from './meta-pixel.ts';

test('accepts Meta pixel ids and rejects other values', () => {
  assert.equal(isMetaPixelId(DEFAULT_META_PIXEL_ID), true);
  assert.equal(isMetaPixelId(` ${DEFAULT_META_PIXEL_ID} `), true);
  assert.equal(isMetaPixelId('G-KKSXRY8MSN'), false);
  assert.equal(isMetaPixelId('26374434567712'), false);
  assert.equal(isMetaPixelId('26374434567712711'), false);
  assert.equal(isMetaPixelId(`${DEFAULT_META_PIXEL_ID}<script>`), false);
  assert.equal(isMetaPixelId(''), false);
  assert.equal(isMetaPixelId(undefined), false);
});

test('resolveMetaPixelId keeps a valid id and drops invalid input', () => {
  assert.equal(resolveMetaPixelId(DEFAULT_META_PIXEL_ID), DEFAULT_META_PIXEL_ID);
  assert.equal(resolveMetaPixelId(` ${DEFAULT_META_PIXEL_ID} `), DEFAULT_META_PIXEL_ID);
  assert.equal(resolveMetaPixelId(''), '');
  assert.equal(resolveMetaPixelId('not-a-pixel'), '');
  assert.equal(resolveMetaPixelId(undefined), '');
});

test('metaNoscriptSrc builds the PageView image URL', () => {
  assert.equal(
    metaNoscriptSrc(DEFAULT_META_PIXEL_ID),
    `https://www.facebook.com/tr?id=${DEFAULT_META_PIXEL_ID}&ev=PageView&noscript=1`,
  );
  assert.equal(metaNoscriptSrc('abc'), '');
});

test('trackMetaPageView sends PageView without visitor details', () => {
  const calls: unknown[][] = [];
  const previous = globalThis.window;
  globalThis.window = {
    fbq(...args: unknown[]) {
      calls.push(args);
    },
  } as Window & typeof globalThis;

  try {
    trackMetaPageView();
    assert.deepEqual(calls, [['track', 'PageView']]);
  } finally {
    globalThis.window = previous;
  }
});
