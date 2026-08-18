import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

const projectRoot = new URL('../../', import.meta.url);

describe('site media assets', () => {
  it('uses an accessible autoplaying hero image slider', async () => {
    const hero = await readFile(new URL('src/components/Hero.astro', projectRoot), 'utf8');

    assert.match(hero, /heroImages/);
    assert.match(hero, /data-hero-slider/);
    assert.match(hero, /data-hero-track/);
    assert.match(hero, /aria-roledescription="carousel"/);
    assert.match(hero, /loading=\{index === 0 \? 'eager' : 'lazy'\}/);
    assert.match(hero, /fetchpriority=\{index === 0 \? 'high' : 'low'\}/);
    assert.match(hero, /prefers-reduced-motion/);
    assert.match(hero, /astro:before-swap/);
    assert.doesNotMatch(hero, /data-hero-video/);
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
