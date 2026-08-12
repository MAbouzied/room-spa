import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { describe, it } from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

describe('site media assets', () => {
  it('uses deferred, accessible hero video sources with a poster fallback', async () => {
    const hero = await readFile(new URL('src/components/Hero.astro', projectRoot), 'utf8');

    assert.match(hero, /data-hero-video/);
    assert.match(hero, /data-src="\/videos\/room-spa-hero\.webm"/);
    assert.match(hero, /data-src="\/videos\/room-spa-hero\.mp4"/);
    assert.match(hero, /src="\/images\/hero-poster\.webp"/);
    assert.match(hero, /prefers-reduced-motion/);
    assert.match(hero, /saveData/);
    assert.match(hero, /astro:before-swap/);
    assert.match(hero, /cancelIdleCallback/);
    assert.match(hero, /await video\.play\(\)/);
  });

  it('keeps optimized hero files within their performance budgets', async () => {
    const mp4 = await stat(new URL('public/videos/room-spa-hero.mp4', projectRoot));
    const webm = await stat(new URL('public/videos/room-spa-hero.webm', projectRoot));
    const poster = await stat(new URL('public/images/hero-poster.webp', projectRoot));

    assert.ok(mp4.size <= 8 * 1024 * 1024, `MP4 is ${mp4.size} bytes`);
    assert.ok(webm.size <= 8 * 1024 * 1024, `WebM is ${webm.size} bytes`);
    assert.ok(poster.size <= 250 * 1024, `Poster is ${poster.size} bytes`);
  });

  it('uses the supplied Room Spa logo dimensions in shared placements', async () => {
    const logo = await readFile(new URL('src/components/Logo.astro', projectRoot), 'utf8');
    const footer = await readFile(new URL('src/components/Footer.astro', projectRoot), 'utf8');

    assert.match(logo, /width="354"/);
    assert.match(logo, /height="472"/);
    assert.match(footer, /width="354"/);
    assert.match(footer, /height="472"/);
  });

  it('gives testimonial star groups an img role so aria-label is permitted', async () => {
    const testimonials = await readFile(
      new URL('src/components/Testimonials.astro', projectRoot),
      'utf8',
    );

    assert.match(testimonials, /testimonials__stars"[^>]*role="img"/);
    assert.match(testimonials, /testimonials__google-score"[^>]*role="img"/);
  });
});
