import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const PIXEL_ID = '2637443456771271';

const [baseLayout, metaPixel, metaLib, adminLayout] = await Promise.all([
  readFile(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/MetaPixel.astro', import.meta.url), 'utf8'),
  readFile(new URL('./meta-pixel.ts', import.meta.url), 'utf8'),
  readFile(new URL('../layouts/AdminLayout.astro', import.meta.url), 'utf8'),
]);

test('embeds Meta Pixel init and PageView on public pages in production', () => {
  assert.match(baseLayout, /import MetaPixel from '\.\.\/components\/MetaPixel\.astro'/);
  assert.match(baseLayout, /import\.meta\.env\.PROD \? DEFAULT_META_PIXEL_ID : ''/);
  assert.match(baseLayout, /\{metaPixelId && <MetaPixel pixelId=\{metaPixelId\} \/>\}/);
  assert.match(metaPixel, /name="meta-pixel-id"/);
  assert.match(metaPixel, /https:\/\/connect\.facebook\.net\/en_US\/fbevents\.js/);
  assert.match(metaPixel, /window\.fbq\('init', metaPixelId\)/);
  assert.match(metaPixel, /window\.fbq\('track', 'PageView'\)/);
  assert.match(metaPixel, /<img height="1" width="1" style="display:none" src=\{noscriptSrc\} alt="" \/>/);
  assert.match(metaLib, new RegExp(`DEFAULT_META_PIXEL_ID = '${PIXEL_ID}'`));
  assert.match(
    metaLib,
    /https:\/\/www\.facebook\.com\/tr\?id=\$\{id\}&ev=PageView&noscript=1/,
  );
});

test('keeps Meta Pixel off admin chrome pages', () => {
  assert.doesNotMatch(adminLayout, /MetaPixel|meta-pixel-id|fbevents\.js|fbq\(/);
});
