import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { offers } from '../data/offers.ts';
import { packages } from '../data/packages.ts';
import { serviceAnchorId, serviceCategories } from '../data/services.ts';
import {
  buildRedirectsFile,
  encodePathSegments,
  EXPECTED_FRAGMENT_TARGETS,
  expandRedirectSources,
  findRedirect,
  LEGACY_REDIRECTS,
  LEGACY_SPLAT_REDIRECTS,
  PROTECTED_PUBLIC_ROUTES,
} from './legacy-redirects.ts';

const projectRoot = new URL('../../', import.meta.url);

describe('legacy WordPress redirects', () => {
  it('covers every audited path with exactly one canonical mapping', () => {
    const sources = LEGACY_REDIRECTS.map((rule) => rule.from);
    assert.equal(new Set(sources).size, sources.length, 'duplicate from paths');
    assert.equal(sources.length, 68, 'expected 68 audited old paths (homepage excluded)');
  });

  it('never redirects current public routes', () => {
    for (const route of PROTECTED_PUBLIC_ROUTES) {
      assert.equal(findRedirect(route), undefined, `protected route redirected: ${route}`);
    }
    assert.equal(
      LEGACY_REDIRECTS.some((rule) =>
        PROTECTED_PUBLIC_ROUTES.includes(rule.from as (typeof PROTECTED_PUBLIC_ROUTES)[number]),
      ),
      false,
    );
  });

  it('sends non-equivalent URLs home and exact matches to unique fragments', () => {
    for (const rule of LEGACY_REDIRECTS) {
      if (rule.reason === 'home-fallback') {
        assert.equal(rule.to, '/');
        continue;
      }

      if (rule.to.includes('#')) {
        const fragment = rule.to.split('#')[1];
        assert.ok(fragment, `missing fragment for ${rule.from}`);
        assert.ok(
          (EXPECTED_FRAGMENT_TARGETS as readonly string[]).includes(fragment),
          `unexpected fragment ${fragment} for ${rule.from}`,
        );
      } else {
        assert.ok(rule.to === '/blogs/' || rule.to === '/', `unexpected path target ${rule.to}`);
      }
    }
  });

  it('targets only anchors that exist in current data/components', async () => {
    const serviceIds = new Set(
      serviceCategories.flatMap((category) => category.items.map((item) => serviceAnchorId(item.id))),
    );
    const offerIds = new Set(offers.map((offer) => `offer-${offer.id}`));
    const packageIds = new Set(packages.map((pkg) => `package-${pkg.id}`));
    const sectionIds = new Set(['about', 'services', 'branches', 'offers', 'packages']);

    for (const fragment of EXPECTED_FRAGMENT_TARGETS) {
      const known =
        serviceIds.has(fragment) ||
        offerIds.has(fragment) ||
        packageIds.has(fragment) ||
        sectionIds.has(fragment);
      assert.ok(known, `missing data/DOM target for #${fragment}`);
    }

    const servicesAstro = await readFile(new URL('src/components/ServiceCategoryCard.astro', projectRoot), 'utf8');
    const offersAstro = await readFile(new URL('src/components/Offers.astro', projectRoot), 'utf8');
    const packagesAstro = await readFile(new URL('src/components/Packages.astro', projectRoot), 'utf8');

    assert.match(servicesAstro, /id=\{serviceAnchorId\(item\.id\)\}/);
    assert.match(offersAstro, /id=\{`offer-\$\{offer\.id\}`\}/);
    assert.match(packagesAstro, /id=\{`package-\$\{pkg\.id\}`\}/);
    assert.match(servicesAstro, /scroll-margin-top:\s*calc\(var\(--header-h\) \+ 1\.5rem\)/);
    assert.match(offersAstro, /scroll-margin-top:\s*calc\(var\(--header-h\) \+ 1\.5rem\)/);
    assert.match(packagesAstro, /scroll-margin-top:\s*calc\(var\(--header-h\) \+ 1\.5rem\)/);
  });

  it('keeps public/_redirects in sync with the TypeScript source of truth', async () => {
    const expected = buildRedirectsFile();
    const actual = await readFile(new URL('public/_redirects', projectRoot), 'utf8');
    assert.equal(actual.replace(/\r\n/g, '\n'), expected.replace(/\r\n/g, '\n'));
  });

  it('emits percent-encoded variants so Cloudflare matches encoded requests', () => {
    const body = buildRedirectsFile();
    assert.match(body, /\/%D8%AD%D9%88%D9%84\/ \/#about 301/);
    assert.match(body, /\/%D8%AE%D8%AF%D9%85%D8%A7%D8%AA\/ \/#services 301/);
    assert.match(
      body,
      /\/product\/%D9%85%D8%B3%D8%A7%D8%AC-%D8%A7%D9%84%D8%B1%D9%8A%D9%81%D9%84%D9%83%D8%B3%D9%88%D9%84%D9%88%D8%AC%D9%8A\/ \/#service-reflexology-massage 301/,
    );
  });


  it('expands trailing-slash variants without duplicating encoded forms', () => {
    const sources = expandRedirectSources('/حول/');
    assert.deepEqual(sources, ['/حول/', '/حول']);
    assert.equal(encodePathSegments('/حول/'), '/%D8%AD%D9%88%D9%84/');
  });

  it('expands trailing-slash variants only, dedupes, and drops the bare root', () => {
    // Normalizes a no-slash input to the same two canonical variants.
    assert.deepEqual(expandRedirectSources('/حول'), ['/حول/', '/حول']);
    // Root `/` is never emitted as a redirect source.
    assert.deepEqual(expandRedirectSources('/'), []);
    // Splat rules pass through unchanged.
    assert.deepEqual(expandRedirectSources('/tag/*'), ['/tag/*']);
    // Already-normalized Arabic input yields no duplicates.
    assert.deepEqual(expandRedirectSources('/حول/'), ['/حول/', '/حول']);
  });

  it('encodes each path segment for Cloudflare percent-encoded matching', () => {
    assert.equal(encodePathSegments('/حول/'), '/%D8%AD%D9%88%D9%84/');
    assert.equal(encodePathSegments('/حول'), '/%D8%AD%D9%88%D9%84');
    assert.equal(
      encodePathSegments('/product/مساج-روم-سبا/'),
      '/product/%D9%85%D8%B3%D8%A7%D8%AC-%D8%B1%D9%88%D9%85-%D8%B3%D8%A8%D8%A7/',
    );
    // ASCII and splat paths are left untouched.
    assert.equal(encodePathSegments('/home/'), '/home/');
    assert.equal(encodePathSegments('/tag/*'), '/tag/*');
    assert.equal(encodePathSegments('/'), '/');
  });

  it('round-trips: every Unicode source decodes from its encoded form', () => {
    for (const rule of LEGACY_REDIRECTS) {
      const encoded = encodePathSegments(rule.from);
      if (encoded === rule.from) continue; // ASCII / no-op
      assert.equal(
        decodeURIComponent(encoded),
        rule.from,
        `encoded form of ${rule.from} does not decode back`,
      );
    }
  });

  it('emits an encoded rule for every non-ASCII audited path', () => {
    const body = buildRedirectsFile();
    for (const rule of LEGACY_REDIRECTS) {
      const encoded = encodePathSegments(rule.from);
      if (encoded === rule.from) continue; // ASCII paths encoded as themselves
      assert.ok(
        body.includes(`${encoded} ${rule.to} 301`),
        `missing encoded rule for ${rule.from} (${encoded})`,
      );
    }
  });

  it('exact rules are ordered before any catch-all splat rule', () => {
    const body = buildRedirectsFile();
    const lines = body
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'));
    const firstSplatIndex = lines.findIndex((l) => l.includes('/*'));
    const lastExactIndex = lines.findLastIndex((l) => !l.includes('/*'));
    assert.notEqual(firstSplatIndex, -1, 'expected at least one splat rule');
    assert.ok(firstSplatIndex > lastExactIndex, 'splat rules must be ordered after exact rules');
  });

  it('emits every catch-all splat rule into the generated file', () => {
    const body = buildRedirectsFile();
    for (const rule of LEGACY_SPLAT_REDIRECTS) {
      assert.ok(body.includes(`${rule.from} ${rule.to} 301`), `missing splat rule ${rule.from}`);
    }
  });

  it('covered splats match real WordPress surface prefixes', () => {
    const samples: Array<[string, string]> = [
      ['/tag/new-topic/', '/tag/*'],
      ['/category/cars/', '/category/*'],
      ['/author/admin1/', '/author/*'],
      ['/product/mystery/', '/product/*'],
      ['/product-category/gym/', '/product-category/*'],
      ['/feed/atom/', '/feed/*'],
      ['/page/3/', '/page/*'],
    ];
    for (const [path, expectedFrom] of samples) {
      const rule = findRedirect(path);
      assert.ok(rule, `no rule for ${path}`);
      assert.equal(rule?.from, expectedFrom);
      assert.equal(rule?.to, '/');
    }
  });

  it('an exact product mapping wins over the /product/* catch-all', () => {
    const exact = findRedirect('/product/مساج-روم-سبا/');
    assert.ok(exact);
    assert.equal(exact?.to, '/#service-room-spa-massage');
    assert.notEqual(exact?.reason, 'home-fallback');
  });

  it('/product-category/ resolves to its own splat, not the /product/ splat', () => {
    const rule = findRedirect('/product-category/some-archive/');
    assert.ok(rule);
    assert.equal(rule?.from, '/product-category/*');
  });

  it('handles malformed percent-encoding without throwing', () => {
    const rule = findRedirect('/product/%ZZ-invalid/');
    // Falls back to the /product/* catch-all rather than throwing.
    assert.ok(rule);
    assert.equal(rule?.from, '/product/*');
  });

  it('both reflexology spellings resolve to the same fragment target', () => {
    const withArticle = findRedirect('/product/مساج-الريفلكسولوجي/');
    const withoutArticle = findRedirect('/product/مساج-رفلكسولوجي/');
    assert.ok(withArticle);
    assert.ok(withoutArticle);
    assert.equal(withArticle?.to, '/#service-reflexology-massage');
    assert.equal(withoutArticle?.to, '/#service-reflexology-massage');
  });

  it('resolves lookup for encoded and unencoded audited paths', () => {
    const arabic = findRedirect('/product/عرض-vip/');
    assert.ok(arabic);
    assert.equal(arabic?.to, '/#offer-vip');

    const encoded = findRedirect('/product/%D8%B9%D8%B1%D8%B6-vip/');
    assert.ok(encoded);
    assert.equal(encoded?.to, '/#offer-vip');

    // Indexed reflexology URL uses the definite article (الريفلكسولوجي).
    const reflex = findRedirect('/product/مساج-الريفلكسولوجي/');
    assert.ok(reflex);
    assert.equal(reflex?.to, '/#service-reflexology-massage');

    const tagCatchAll = findRedirect('/tag/something-new/');
    assert.ok(tagCatchAll);
    assert.equal(tagCatchAll?.to, '/');

    // New catch-all splats for remaining WordPress surfaces.
    const productCatchAll = findRedirect('/product/some-unknown/');
    assert.ok(productCatchAll);
    assert.equal(productCatchAll?.to, '/');
    const feedCatchAll = findRedirect('/feed/atom/');
    assert.ok(feedCatchAll);
    assert.equal(feedCatchAll?.to, '/');
    const pageCatchAll = findRedirect('/page/2/');
    assert.ok(pageCatchAll);
    assert.equal(pageCatchAll?.to, '/');
    assert.equal(LEGACY_SPLAT_REDIRECTS.length, 7);
  });

  it('marks every redirect as a 301 rule in the generated file', () => {
    const body = buildRedirectsFile();
    const rules = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));

    assert.ok(rules.length > LEGACY_REDIRECTS.length);
    for (const line of rules) {
      assert.match(line, / 301$/);
    }
  });

  it('uses the canonical roomspa-sa.com domain in config, data, and robots.txt', async () => {
    const astroConfig = await readFile(new URL('astro.config.mjs', projectRoot), 'utf8');
    const siteData = await readFile(new URL('src/data/site.ts', projectRoot), 'utf8');
    const robots = await readFile(new URL('public/robots.txt', projectRoot), 'utf8');

    assert.match(astroConfig, /https:\/\/roomspa-sa\.com/);
    assert.match(siteData, /siteUrl: 'https:\/\/roomspa-sa\.com'/);
    assert.match(robots, /Sitemap: https:\/\/roomspa-sa\.com\/sitemap-index\.xml/);

    // Regression guard: the old roomspa.sa domain must not reappear anywhere.
    assert.doesNotMatch(astroConfig, /roomspa\.sa\b/);
    assert.doesNotMatch(siteData, /roomspa\.sa\b/);
    assert.doesNotMatch(robots, /roomspa\.sa\b/);
  });
});
