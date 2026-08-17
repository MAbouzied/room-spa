import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { galleryImages } from './gallery.ts';

const projectRoot = new URL('../../', import.meta.url);
const maxImageBytes = 350 * 1024;

describe('gallery photos', () => {
  it('keeps a short front-and-entrance set of 5 or 6 photos', () => {
    assert.ok(galleryImages.length >= 5 && galleryImages.length <= 6);
    assert.equal(galleryImages.filter((image) => image.featured).length, 1);
    assert.equal(galleryImages[0]?.src, '/images/gallery/front-night.jpg');
    assert.match(galleryImages[0]?.alt ?? '', /واجهة|مدخل/);

    const paths = galleryImages.map((image) => image.src);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.some((src) => src.includes('front')));
    assert.ok(paths.some((src) => src.includes('entrance')));
    assert.ok(paths.every((src) => !src.includes('spa-pool') && !src.includes('spa-reception')));
  });

  it('ships optimized files that the gallery component actually uses', async () => {
    const galleryAstro = await readFile(new URL('src/components/Gallery.astro', projectRoot), 'utf8');

    assert.match(galleryAstro, /galleryImages/);
    assert.match(galleryAstro, /gallery__grid/);
    assert.match(galleryAstro, /object-fit:\s*cover/);
    assert.match(galleryAstro, /@media \(min-width:/);

    for (const image of galleryImages) {
      const relative = `public${image.src}`;
      const file = await stat(new URL(relative, projectRoot));
      assert.ok(file.size > 0, `${image.src} is empty`);
      assert.ok(
        file.size <= maxImageBytes,
        `${image.src} is ${file.size} bytes; keep gallery photos under 350KB`,
      );
    }
  });
});
