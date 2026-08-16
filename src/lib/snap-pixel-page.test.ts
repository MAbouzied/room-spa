import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const PIXEL_ID = '3ad0997f-8b67-4f3f-866d-def7dfb6cbd2';

const [baseLayout, snapPixel, snapLib, adminLayout, contactForm] = await Promise.all([
  readFile(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/SnapPixel.astro', import.meta.url), 'utf8'),
  readFile(new URL('./snap-pixel.ts', import.meta.url), 'utf8'),
  readFile(new URL('../layouts/AdminLayout.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/ContactForm.astro', import.meta.url), 'utf8'),
]);

test('embeds Snap Pixel in the public layout head', () => {
  assert.match(baseLayout, /SnapPixel/);
  assert.match(baseLayout, /DEFAULT_SNAP_PIXEL_ID/);
  assert.match(snapPixel, /https:\/\/sc-static\.net\/scevent\.min\.js/);
  assert.match(snapPixel, /window\.snaptr\('init', snapPixelId/);
  assert.match(snapPixel, /window\.snaptr\('track', 'PAGE_VIEW'/);
  assert.doesNotMatch(snapPixel, /user_email:\s*['"]?__INSERT/);
  assert.doesNotMatch(snapPixel, /INSERT_PRICE|INSERT_CURRENCY|INSERT_ITEM/);
  assert.match(snapLib, new RegExp(`DEFAULT_SNAP_PIXEL_ID = '${PIXEL_ID}'`));
});

test('fires priced VIEW_CONTENT, ADD_CART, and PURCHASE from the contact form', () => {
  assert.match(contactForm, /trackSnapViewContent/);
  assert.match(contactForm, /trackSnapAddCart/);
  assert.match(contactForm, /trackSnapPurchase/);
});

test('keeps Snap Pixel off admin chrome pages', () => {
  assert.doesNotMatch(adminLayout, /SnapPixel|snap-pixel-id|sc-static\.net|snaptr/);
});
