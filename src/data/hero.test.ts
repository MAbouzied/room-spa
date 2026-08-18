import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { heroImages, heroImageSize } from './hero.ts';

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
const maxImageBytes = 280 * 1024;

describe('hero slider photos', () => {
  it('lists the full interior set with unique paths', () => {
    assert.equal(heroImages.length, 16);
    assert.equal(heroImages[0]?.src, '/images/hero/hero-01.jpg');
    assert.match(heroImages[0]?.alt ?? '', /روم سبا/);

    const paths = heroImages.map((image) => image.src);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(paths.every((src) => src.startsWith('/images/hero/hero-')));
  });

  it('ships optimized files that the hero slider actually uses', async () => {
    const heroAstro = await readFile(new URL('src/components/Hero.astro', projectRoot), 'utf8');

    assert.match(heroAstro, /heroImages/);
    assert.match(heroAstro, /data-hero-slider/);
    assert.match(heroAstro, /object-fit:\s*cover/);

    for (const image of heroImages) {
      const relative = `public${image.src}`;
      const file = await stat(new URL(relative, projectRoot));
      assert.ok(file.size > 0, `${image.src} is empty`);
      assert.ok(
        file.size <= maxImageBytes,
        `${image.src} is ${file.size} bytes; keep hero photos under 280KB`,
      );

      const bytes = await readFile(new URL(relative, projectRoot));
      const size = readJpegSize(bytes);
      assert.deepEqual(
        size,
        { width: heroImageSize.width, height: heroImageSize.height },
        `${image.src} must be ${heroImageSize.width}x${heroImageSize.height}`,
      );
    }
  });
});
