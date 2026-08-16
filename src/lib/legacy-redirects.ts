/**
 * WordPress → current-site redirect map.
 * Source of truth for `public/_redirects` and redirect coverage tests.
 */

export type LegacyRedirect = {
  /** Canonical old path with leading slash and trailing slash (except `/`). */
  from: string;
  /** Relative destination, may include a fragment. */
  to: string;
  /** Why this mapping exists. */
  reason: 'exact' | 'section' | 'home-fallback';
};

/** Current public routes that must never appear as redirect sources. */
export const PROTECTED_PUBLIC_ROUTES = [
  '/',
  '/gift',
  '/gift/',
  '/blogs',
  '/blogs/',
  '/login',
  '/login/',
  '/form',
  '/form/',
  '/en/form',
  '/en/form/',
] as const;

/**
 * Exact 1:1 / section / home-fallback mappings for every audited old path.
 * `/` is excluded (same origin homepage).
 */
export const LEGACY_REDIRECTS: readonly LegacyRedirect[] = [
  // Core pages
  { from: '/home/', to: '/', reason: 'exact' },
  { from: '/حول/', to: '/#about', reason: 'exact' },
  { from: '/خدمات/', to: '/#services', reason: 'exact' },
  { from: '/الخدمات-البدنية/', to: '/#services', reason: 'section' },
  { from: '/مدونة/', to: '/blogs/', reason: 'exact' },
  { from: '/اتصل/', to: '/#branches', reason: 'section' },

  // Product categories
  { from: '/product-category/spa/', to: '/#services', reason: 'section' },
  { from: '/product-category/sport/', to: '/', reason: 'home-fallback' },

  // Exact service products → item anchors
  { from: '/product/مساج-روم-سبا/', to: '/#service-room-spa-massage', reason: 'exact' },
  { from: '/product/مساج-الإسترخاء/', to: '/#service-relaxation-massage', reason: 'exact' },
  { from: '/product/مساج-الشياتسو/', to: '/#service-shiatsu-massage', reason: 'exact' },
  { from: '/product/مساج-رفلكسولوجي/', to: '/#service-reflexology-massage', reason: 'exact' },
  { from: '/product/مساج-الريفلكسولوجي/', to: '/#service-reflexology-massage', reason: 'exact' },
  { from: '/product/مساح-الأحجار-الساخنة/', to: '/#services', reason: 'section' },
  { from: '/product/حمام-مغربي-كلاسيك/', to: '/#service-classic-hammam', reason: 'exact' },
  {
    from: '/product/حمام-بطين-البحر-الميت-أو-الأعشاب-العطر/',
    to: '/#service-dead-sea-hammam',
    reason: 'exact',
  },
  {
    from: '/product/قص-الأظافر-وتنظيف-وتنعيم-اليدين-والقد/',
    to: '/#service-hands-feet-pedicure',
    reason: 'exact',
  },

  // Exact offer products → item anchors
  { from: '/product/العرض-الملكي/', to: '/#offer-royal', reason: 'exact' },
  { from: '/product/عرض-ماجيستيك/', to: '/#offer-majestic', reason: 'exact' },
  { from: '/product/عرض-vip/', to: '/#offer-vip', reason: 'exact' },
  { from: '/product/عرض-كبار-الشخصيات/', to: '/#offer-vip-personalities', reason: 'exact' },
  { from: '/product/عرض-ديب-روم/', to: '/#offer-deep-room', reason: 'exact' },
  { from: '/product/عرض-تنفس/', to: '/#offer-breathe', reason: 'exact' },
  { from: '/product/عرض-كير/', to: '/#offer-care', reason: 'exact' },

  // Exact package product → package anchor
  { from: '/product/عرض-إليت/', to: '/#packages', reason: 'exact' },

  // Soft / non-1:1 products → home (per product request)
  { from: '/product/مساج-تايلندي/', to: '/#service-thai-massage', reason: 'exact' },
  { from: '/product/مساج-الزيت-الحار/', to: '/#service-hot-oil-massage', reason: 'exact' },
  { from: '/product/مساح-الكاسات-الصينية/', to: '/', reason: 'home-fallback' },
  { from: '/product/خدمات-الحلاقه-الرجاليه/', to: '/', reason: 'home-fallback' },
  { from: '/product/خدمات-المشي-على-سير-القدام/', to: '/', reason: 'home-fallback' },
  { from: '/product/الرياضه-البدنيه/', to: '/', reason: 'home-fallback' },

  // WooCommerce surfaces
  { from: '/السلة/', to: '/', reason: 'home-fallback' },
  { from: '/wishlist/', to: '/', reason: 'home-fallback' },
  { from: '/products-compare/', to: '/', reason: 'home-fallback' },

  // Authors
  { from: '/author/mahmoud/', to: '/', reason: 'home-fallback' },
  { from: '/author/ttb7741012/', to: '/', reason: 'home-fallback' },

  // Categories (theme demo)
  { from: '/category/uncategorized/', to: '/', reason: 'home-fallback' },
  { from: '/category/تصدير/', to: '/', reason: 'home-fallback' },
  { from: '/category/تكنولوجيا/', to: '/', reason: 'home-fallback' },
  { from: '/category/حديث/', to: '/', reason: 'home-fallback' },
  { from: '/category/روبوت/', to: '/', reason: 'home-fallback' },
  { from: '/category/مستورد/', to: '/', reason: 'home-fallback' },

  // Tags (theme demo)
  { from: '/tag/أصلي/', to: '/', reason: 'home-fallback' },
  { from: '/tag/بيع-عبر-الإنترنت/', to: '/', reason: 'home-fallback' },
  { from: '/tag/تأمين/', to: '/', reason: 'home-fallback' },
  { from: '/tag/تصدير/', to: '/', reason: 'home-fallback' },
  { from: '/tag/تكنولوجيا/', to: '/', reason: 'home-fallback' },
  { from: '/tag/حديث/', to: '/', reason: 'home-fallback' },
  { from: '/tag/خاص/', to: '/', reason: 'home-fallback' },
  { from: '/tag/داخلي/', to: '/', reason: 'home-fallback' },
  { from: '/tag/رقمي/', to: '/', reason: 'home-fallback' },
  { from: '/tag/روبوت/', to: '/', reason: 'home-fallback' },
  { from: '/tag/صناعي/', to: '/', reason: 'home-fallback' },
  { from: '/tag/ضمان/', to: '/', reason: 'home-fallback' },
  { from: '/tag/علامة-تجارية/', to: '/', reason: 'home-fallback' },
  { from: '/tag/مستعمل/', to: '/', reason: 'home-fallback' },
  { from: '/tag/مستورد/', to: '/', reason: 'home-fallback' },
  { from: '/tag/نانو/', to: '/', reason: 'home-fallback' },
  { from: '/tag/هدية/', to: '/', reason: 'home-fallback' },

  // Demo / widget pages
  { from: '/hello-world/', to: '/', reason: 'home-fallback' },
  { from: '/footer-about-widget/', to: '/', reason: 'home-fallback' },
  { from: '/footer-subscription/', to: '/', reason: 'home-fallback' },
  { from: '/آخر-الأخبار-المهمة-في-التكنولوجيا/', to: '/', reason: 'home-fallback' },
  { from: '/أنواع-البطاقات-الذكية-والرقمية/', to: '/', reason: 'home-fallback' },
  { from: '/الترجمة-والكتابة-بالحديث/', to: '/', reason: 'home-fallback' },
  { from: '/تصاميم-حديثة-وإبداعية/', to: '/', reason: 'home-fallback' },
  { from: '/كيف-نزيد-عدد-الزيارات؟/', to: '/', reason: 'home-fallback' },
  { from: '/وظائف-المستقبل-مع-الذكاء-الاصطناعي/', to: '/', reason: 'home-fallback' },
] as const;

/** Extra splat rules that catch taxonomy URLs beyond the audited list. */
export const LEGACY_SPLAT_REDIRECTS: readonly LegacyRedirect[] = [
  { from: '/tag/*', to: '/', reason: 'home-fallback' },
  { from: '/category/*', to: '/', reason: 'home-fallback' },
  { from: '/author/*', to: '/', reason: 'home-fallback' },
  { from: '/product/*', to: '/', reason: 'home-fallback' },
  { from: '/product-category/*', to: '/', reason: 'home-fallback' },
  { from: '/feed/*', to: '/', reason: 'home-fallback' },
  { from: '/page/*', to: '/', reason: 'home-fallback' },
] as const;

/** Expected unique DOM fragment targets used by exact redirects (without leading `#`). */
export const EXPECTED_FRAGMENT_TARGETS = [
  'about',
  'services',
  'branches',
  'service-room-spa-massage',
  'service-relaxation-massage',
  'service-shiatsu-massage',
  'service-reflexology-massage',
  'service-thai-massage',
  'service-hot-oil-massage',
  'service-classic-hammam',
  'service-dead-sea-hammam',
  'service-hands-feet-pedicure',
  'offer-royal',
  'offer-majestic',
  'offer-vip',
  'offer-vip-personalities',
  'offer-deep-room',
  'offer-breathe',
  'offer-care',
  'packages',
] as const;

function stripTrailingSlash(path: string): string {
  if (path.length <= 1) return path;
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/** Encode each path segment so Cloudflare can match percent-encoded requests. */
export function encodePathSegments(path: string): string {
  if (path.includes('*')) return path;
  const trailing = path.endsWith('/') && path !== '/';
  const encoded = path
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(segment) : ''))
    .join('/');
  if (trailing && !encoded.endsWith('/')) return `${encoded}/`;
  return encoded;
}

/**
 * Expand one redirect into the trailing-slash and no-slash source variants we
 * ship. Percent-encoded variants are added separately in `buildRedirectsFile`.
 */
export function expandRedirectSources(from: string): string[] {
  if (from.includes('*')) return [from];

  const withSlash = from.endsWith('/') ? from : `${from}/`;
  const withoutSlash = stripTrailingSlash(withSlash);
  return [withSlash, withoutSlash].filter((source, index, all) => {
    if (source === '/') return false;
    return all.indexOf(source) === index;
  });
}

/** Build the Cloudflare `_redirects` file body. */
export function buildRedirectsFile(
  redirects: readonly LegacyRedirect[] = LEGACY_REDIRECTS,
  splats: readonly LegacyRedirect[] = LEGACY_SPLAT_REDIRECTS,
): string {
  const lines: string[] = [
    '# Auto-generated from src/lib/legacy-redirects.ts — do not edit by hand.',
    '# WordPress legacy URL redirects (301).',
    '',
  ];

  const seen = new Set<string>();

  for (const rule of redirects) {
    for (const source of expandRedirectSources(rule.from)) {
      if (seen.has(source)) continue;
      seen.add(source);
      lines.push(`${source} ${rule.to} 301`);
      // Browsers/search engines percent-encode non-ASCII paths (e.g. Arabic).
      // Cloudflare _redirects does NOT normalize encoded requests to Unicode
      // rules, so ship an explicit percent-encoded variant too.
      const encoded = encodePathSegments(source);
      if (encoded !== source && !seen.has(encoded)) {
        seen.add(encoded);
        lines.push(`${encoded} ${rule.to} 301`);
      }
    }
  }

  lines.push('');
  lines.push('# Taxonomy catch-alls for any remaining WordPress archive URLs');
  for (const rule of splats) {
    if (seen.has(rule.from)) continue;
    seen.add(rule.from);
    lines.push(`${rule.from} ${rule.to} 301`);
  }

  lines.push('');
  return lines.join('\n');
}

export function findRedirect(pathname: string): LegacyRedirect | undefined {
  const normalized = pathname === '/' ? '/' : pathname.endsWith('/') ? pathname : `${pathname}/`;
  const decoded = (() => {
    try {
      return decodeURIComponent(normalized);
    } catch {
      return normalized;
    }
  })();

  const exact = LEGACY_REDIRECTS.find((rule) => rule.from === decoded || rule.from === normalized);
  if (exact) return exact;

  // Derive splat prefixes from the same definitions we ship, most specific
  // (longest) first so `/product-category/` is matched before `/product/`.
  const splatPrefixes = [...LEGACY_SPLAT_REDIRECTS]
    .map((rule) => ({ prefix: rule.from.replace('/*', '/'), rule }))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  for (const { prefix, rule } of splatPrefixes) {
    if (decoded.startsWith(prefix) || normalized.startsWith(prefix)) {
      return rule;
    }
  }

  return undefined;
}
