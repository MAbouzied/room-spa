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
    assert.equal(sources.length, 67, 'expected 67 audited old paths (homepage excluded)');
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

    const servicesAstro = await readFile(new URL('src/components/Services.astro', projectRoot), 'utf8');
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

  it('expands trailing-slash variants without duplicating encoded forms', () => {
    const sources = expandRedirectSources('/حول/');
    assert.deepEqual(sources, ['/حول/', '/حول']);
    // Encoded requests still resolve via lookup helpers / Cloudflare normalization.
    assert.equal(encodePathSegments('/حول/'), '/%D8%AD%D9%88%D9%84/');
  });

  it('resolves lookup for encoded and unencoded audited paths', () => {
    const arabic = findRedirect('/product/عرض-vip/');
    assert.ok(arabic);
    assert.equal(arabic?.to, '/#offer-vip');

    const encoded = findRedirect('/product/%D8%B9%D8%B1%D8%B6-vip/');
    assert.ok(encoded);
    assert.equal(encoded?.to, '/#offer-vip');

    const tagCatchAll = findRedirect('/tag/something-new/');
    assert.ok(tagCatchAll);
    assert.equal(tagCatchAll?.to, '/');
    assert.equal(LEGACY_SPLAT_REDIRECTS.length, 3);
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
});
