import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { galleryImages, galleryImageSize } from './gallery.ts';

function readJpegSize(bytes: Buffer) {
  let offset = 2;
  while (offset < bytes.length - 8) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    if (marker === undefined) break;
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: bytes.readUInt16BE(offset + 5),
        width: bytes.readUInt16BE(offset + 7),
      };
    }
    const length = bytes.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  throw new Error('JPEG size not found');
}

const projectRoot = new URL('../../', import.meta.url);
const maxImageBytes = 350 * 1024;

describe('gallery photos', () => {
  it('keeps the front photos first and then the interior set', () => {
    assert.equal(galleryImages.length, 22);
    assert.equal(galleryImages.filter((image) => image.featured).length, 1);
    assert.equal(galleryImages[0]?.src, '/images/gallery/front-night.jpg');
    assert.match(galleryImages[0]?.alt ?? '', /واجهة|مدخل/);
    assert.equal(galleryImages[6]?.src, '/images/gallery/interior-01.jpg');

    const paths = galleryImages.map((image) => image.src);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.some((src) => src.includes('front')));
    assert.ok(paths.some((src) => src.includes('entrance')));
    assert.equal(paths.filter((src) => src.includes('interior-')).length, 16);
    assert.ok(paths.every((src) => !src.includes('spa-pool') && !src.includes('spa-reception')));
  });

  it('ships optimized files that the gallery component actually uses', async () => {
    const galleryAstro = await readFile(new URL('src/components/Gallery.astro', projectRoot), 'utf8');

    assert.match(galleryAstro, /galleryImages/);
    assert.match(galleryAstro, /data-gallery-track/);
    assert.match(galleryAstro, /data-gallery-prev/);
    assert.match(galleryAstro, /data-gallery-next/);
    assert.doesNotMatch(galleryAstro, /gallery__grid/);
    assert.match(galleryAstro, /object-fit:\s*cover/);
    assert.match(galleryAstro, /opacity:\s*0/);
    assert.match(galleryAstro, /transition:[^;]*opacity/);
    assert.match(galleryAstro, /\.gallery__dots\s*\{[^}]*linear-gradient/);
    assert.match(galleryAstro, /\.gallery__dot::after\s*\{[^}]*var\(--color-text\)/);
    assert.match(
      galleryAstro,
      new RegExp(`aspect-ratio:\\s*${galleryImageSize.width}\\s*/\\s*${galleryImageSize.height}`),
    );
    assert.doesNotMatch(galleryAstro, /aspect-ratio:\s*16\s*\/\s*9/);

    for (const image of galleryImages) {
      const relative = `public${image.src}`;
      const file = await stat(new URL(relative, projectRoot));
      assert.ok(file.size > 0, `${image.src} is empty`);
      assert.ok(
        file.size <= maxImageBytes,
        `${image.src} is ${file.size} bytes; keep gallery photos under 350KB`,
      );

      const bytes = await readFile(new URL(relative, projectRoot));
      const size = readJpegSize(bytes);
      assert.deepEqual(
        size,
        { width: galleryImageSize.width, height: galleryImageSize.height },
        `${image.src} must be ${galleryImageSize.width}x${galleryImageSize.height}`,
      );
    }
  });
});
