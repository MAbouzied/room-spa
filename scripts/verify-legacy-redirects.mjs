/**
 * Probe a running local Cloudflare preview and assert every legacy redirect.
 *
 * Usage:
 *   node --experimental-strip-types scripts/verify-legacy-redirects.mjs [baseUrl]
 *
 * Defaults to http://127.0.0.1:8787
 */

import { LEGACY_REDIRECTS, LEGACY_SPLAT_REDIRECTS, encodePathSegments, expandRedirectSources } from '../src/lib/legacy-redirects.ts';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:8787').replace(/\/$/, '');

/** @type {{ path: string, expected: string, ok: boolean, detail: string }[]} */
const results = [];

function normalizeLocation(location, requestUrl) {
  if (!location) return '';
  try {
    const absolute = new URL(location, requestUrl);
    return `${absolute.pathname}${absolute.search}${absolute.hash}`;
  } catch {
    return location;
  }
}

function destinationPath(target) {
  const hashIndex = target.indexOf('#');
  if (hashIndex === -1) return target;
  const path = target.slice(0, hashIndex) || '/';
  return path;
}

function splitTarget(target) {
  const hashIndex = target.indexOf('#');
  if (hashIndex === -1) {
    return { pathname: target || '/', hash: '' };
  }
  return {
    pathname: target.slice(0, hashIndex) || '/',
    hash: target.slice(hashIndex + 1),
  };
}

/**
 * Cloudflare preserves query strings on redirects. Compare path + fragment and
 * allow the request query to appear on the Location header.
 */
function locationMatchesExpected(location, expectedTo, requestQuery = '') {
  if (!location) return false;
  if (!requestQuery) return location === expectedTo;

  let absolute;
  try {
    absolute = new URL(location, 'http://example.test');
  } catch {
    return false;
  }

  const expected = splitTarget(expectedTo);
  const pathOk = absolute.pathname === expected.pathname;
  const hashOk = absolute.hash === (expected.hash ? `#${expected.hash}` : '');
  const queryOk = absolute.search === requestQuery || absolute.search === '';
  return pathOk && hashOk && queryOk;
}

async function assertRedirect(path, expectedTo, { allowQueryPreservation = false } = {}) {
  const requestUrl = `${baseUrl}${path}`;
  let requestQuery = '';
  try {
    requestQuery = new URL(requestUrl).search;
  } catch {
    requestQuery = '';
  }

  let response;
  try {
    response = await fetch(requestUrl, { redirect: 'manual' });
  } catch (error) {
    results.push({
      path,
      expected: expectedTo,
      ok: false,
      detail: `fetch failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    return;
  }

  const location = normalizeLocation(response.headers.get('location'), requestUrl);
  const statusOk = response.status === 301;
  const locationOk = allowQueryPreservation
    ? locationMatchesExpected(location, expectedTo, requestQuery)
    : location === expectedTo;
  const ok = statusOk && locationOk;

  results.push({
    path,
    expected: expectedTo,
    ok,
    detail: ok ? 'ok' : `status=${response.status} location=${location || '(none)'}`,
  });

  if (!ok) return;

  // Follow once and ensure destination is healthy (no chain, no 404).
  const followUrl = `${baseUrl}${destinationPath(expectedTo)}`;
  const followed = await fetch(followUrl, { redirect: 'manual' });
  if (followed.status >= 300 && followed.status < 400) {
    results.push({
      path: `${path}→follow`,
      expected: '200 (no chain)',
      ok: false,
      detail: `redirect chain status=${followed.status} location=${followed.headers.get('location')}`,
    });
    return;
  }
  if (followed.status !== 200) {
    results.push({
      path: `${path}→follow`,
      expected: '200',
      ok: false,
      detail: `destination status=${followed.status}`,
    });
    return;
  }

  const html = await followed.text();
  if (/الصفحة غير موجودة|404/i.test(html) && followed.status === 200) {
    // Soft check: custom 404 page content should not appear on real destinations.
    if (html.includes('id="main-content"') === false && html.includes('services') === false) {
      results.push({
        path: `${path}→follow`,
        expected: 'public page',
        ok: false,
        detail: 'destination looks like a 404 page',
      });
    }
  }

  const fragment = expectedTo.includes('#') ? expectedTo.split('#')[1] : '';
  if (fragment) {
    const idCount = (html.match(new RegExp(`id=["']${fragment}["']`, 'g')) || []).length;
    if (idCount !== 1) {
      results.push({
        path: `${path}→anchor`,
        expected: `unique #${fragment}`,
        ok: false,
        detail: `found ${idCount} matching id attributes`,
      });
    }
  }
}

async function assertPublicOk(path) {
  let response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  let detail = `status=${response.status}`;

  // Cloudflare auto-trailing-slash may emit a same-path 307 (/gift -> /gift/).
  if (response.status >= 300 && response.status < 400) {
    const location = normalizeLocation(response.headers.get('location'), `${baseUrl}${path}`);
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    if (location === normalizedPath || location === path) {
      response = await fetch(`${baseUrl}${location}`, { redirect: 'manual' });
      detail = `trailing-slash ${location} then status=${response.status}`;
    } else {
      results.push({
        path,
        expected: '200 (current route)',
        ok: false,
        detail: `unexpected redirect to ${location}`,
      });
      return;
    }
  }

  const ok = response.status === 200;
  results.push({
    path,
    expected: '200 (current route)',
    ok,
    detail: ok ? (detail.includes('trailing-slash') ? detail : 'ok') : detail,
  });
}

async function main() {
  console.log(`Probing ${baseUrl}`);

  // Health check
  const health = await fetch(`${baseUrl}/`, { redirect: 'manual' });
  if (health.status !== 200) {
    console.error(`Server not healthy at ${baseUrl}/ (status ${health.status})`);
    process.exit(1);
  }

  for (const rule of LEGACY_REDIRECTS) {
    const variants = expandRedirectSources(rule.from);
    // Probe the canonical unicode form and one encoded form when different.
    const toProbe = [rule.from];
    const encoded = encodePathSegments(rule.from);
    if (encoded !== rule.from) toProbe.push(encoded);
    // Also include no-trailing-slash variant
    for (const variant of variants) {
      if (!toProbe.includes(variant) && !variant.includes('%') && variant === rule.from.replace(/\/$/, '')) {
        toProbe.push(variant);
      }
    }

    for (const path of toProbe) {
      await assertRedirect(path, rule.to);
    }
  }

  for (const splat of LEGACY_SPLAT_REDIRECTS) {
    const sample = splat.from.replace('*', 'sample-test-slug/');
    await assertRedirect(sample, splat.to);
  }

  // Query-string coverage: Cloudflare may preserve tracking params on Location.
  const query = '?utm_source=google&utm_medium=cpc';
  const queryCases = [
    {
      path: `/product/مساج-روم-سبا/${query}`,
      expected: '/#service-room-spa-massage',
      label: 'exact + query',
    },
    {
      path: `/product/مساج-تايلندي/${query}`,
      expected: '/',
      label: 'fallback + query',
    },
    {
      path: `${encodePathSegments('/product/مساج-روم-سبا/')}${query}`,
      expected: '/#service-room-spa-massage',
      label: 'encoded Arabic + query',
    },
    {
      path: `/product/مساج-روم-سبا${query}`,
      expected: '/#service-room-spa-massage',
      label: 'no-slash + query',
    },
    {
      path: `/tag/sample-test-slug/${query}`,
      expected: '/',
      label: 'taxonomy splat + query',
    },
  ];

  for (const testCase of queryCases) {
    await assertRedirect(testCase.path, testCase.expected, { allowQueryPreservation: true });
  }

  // Regression: current public routes must stay 200 and not redirect.
  await assertPublicOk('/');
  await assertPublicOk('/gift');
  await assertPublicOk('/blogs/');

  const blogIndex = await fetch(`${baseUrl}/blogs/`);
  const blogHtml = await blogIndex.text();
  const slugMatches = [...blogHtml.matchAll(/href="(\/blogs\/[a-z0-9-]+\/?)"/g)].map((m) => m[1]);
  const uniqueSlugs = [...new Set(slugMatches)].filter((href) => !href.includes('/page/'));
  for (const slugPath of uniqueSlugs.slice(0, 8)) {
    await assertPublicOk(slugPath.endsWith('/') ? slugPath : `${slugPath}/`);
  }

  const failed = results.filter((row) => !row.ok);
  const passed = results.filter((row) => row.ok);

  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length) {
    for (const row of failed) {
      console.error(`FAIL ${row.path} → expected ${row.expected} | ${row.detail}`);
    }
    process.exit(1);
  }

  console.log('All legacy redirect probes passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
