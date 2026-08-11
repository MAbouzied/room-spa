# WordPress → Custom Site URL Audit

**Status:** Redirects implemented via [`public/_redirects`](../public/_redirects)  
**Source of truth:** [`src/lib/legacy-redirects.ts`](../src/lib/legacy-redirects.ts)  
**Generated file:** `npm run generate:redirects` writes [`public/_redirects`](../public/_redirects) (also runs automatically before `npm run build`)  
**Domain audited:** `https://roomspa-sa.com`  
**Sources:** Wayback Machine CDX (68 paths) + Google SERP sample (20 paths)

---

## Redirect policy

| Case | Action |
|---|---|
| Exact page/section/item equivalent | `301` to that target (item-level when available) |
| No equivalent in the new site | `301` to `/` |
| New-only routes (`/gift`, new blog posts) | No legacy redirect needed |

Implementation notes:

- Anchors use stable IDs: `/#service-*`, `/#offer-*`, `/#package-*`
- Rules ship as Cloudflare Workers Assets `_redirects` (not Astro middleware)
- Each old path is covered with trailing-slash, no-slash, and percent-encoded variants
- Edit mappings only in `src/lib/legacy-redirects.ts`, then regenerate (or build)
- Query strings on old URLs are allowed; Cloudflare may preserve them on the `Location` header while the path/fragment stay correct

---

## Current public routes (new app)

| Route | Purpose |
|---|---|
| `/` | Home |
| `/gift` | Gift landing |
| `/blogs/` | Blog index |
| `/blogs/page/[page]` | Blog pagination |
| `/blogs/[slug]` | Blog post |
| `/login`, `/admin/*` | Staff only (noindex) |

### Item anchors on home

| Anchor pattern | Content |
|---|---|
| `/#about`, `/#services`, `/#offers`, `/#packages`, `/#branches`, … | Sections |
| `/#service-{id}` | Individual service cards |
| `/#offer-{id}` | Individual offer cards |
| `/#package-{id}` | Individual package cards |

---

## Exact mappings (`301`)

### Core pages

| Old URL | New URL |
|---|---|
| `/home/` | `/` |
| `/حول/` | `/#about` |
| `/خدمات/` | `/#services` |
| `/الخدمات-البدنية/` | `/#services` |
| `/مدونة/` | `/blogs/` |
| `/اتصل/` | `/#branches` |
| `/product-category/spa/` | `/#services` |

### Services → item anchors

| Old URL | New URL |
|---|---|
| `/product/مساج-روم-سبا/` | `/#service-room-spa-massage` |
| `/product/مساج-الإسترخاء/` | `/#service-relaxation-massage` |
| `/product/مساج-الشياتسو/` | `/#service-shiatsu-massage` |
| `/product/مساج-رفلكسولوجي/` | `/#service-reflexology-massage` |
| `/product/مساح-الأحجار-الساخنة/` | `/#service-hot-stone-massage` |
| `/product/حمام-مغربي-كلاسيك/` | `/#service-classic-hammam` |
| `/product/حمام-بطين-البحر-الميت-أو-الأعشاب-العطر/` | `/#service-dead-sea-hammam` |
| `/product/قص-الأظافر-وتنظيف-وتنعيم-اليدين-والقد/` | `/#service-hands-feet-pedicure` |

### Offers → item anchors

| Old URL | New URL |
|---|---|
| `/product/العرض-الملكي/` | `/#offer-royal` |
| `/product/عرض-ماجيستيك/` | `/#offer-majestic` |
| `/product/عرض-vip/` | `/#offer-vip` |
| `/product/عرض-كبار-الشخصيات/` | `/#offer-vip-personalities` |
| `/product/عرض-ديب-روم/` | `/#offer-deep-room` |
| `/product/عرض-تنفس/` | `/#offer-breathe` |
| `/product/عرض-كير/` | `/#offer-care` |

### Packages → item anchors

| Old URL | New URL |
|---|---|
| `/product/عرض-إليت/` | `/#package-elite` |

---

## No equivalent → home (`301` to `/`)

### Removed / non-1:1 products

| Old URL |
|---|
| `/product/مساج-تايلندي/` |
| `/product/مساج-الزيت-الحار/` |
| `/product/مساح-الكاسات-الصينية/` |
| `/product/خدمات-الحلاقه-الرجاليه/` |
| `/product/خدمات-المشي-على-سير-القدام/` |
| `/product/الرياضه-البدنيه/` |
| `/product-category/sport/` |

### WooCommerce

| Old URL |
|---|
| `/السلة/` |
| `/wishlist/` |
| `/products-compare/` |

### Taxonomy catch-alls

| Pattern |
|---|
| `/tag/*` |
| `/category/*` |
| `/author/*` |

Audited examples under those patterns (all → `/`):

- `/author/mahmoud/`, `/author/ttb7741012/`
- `/category/uncategorized/`, `/category/تصدير/`, `/category/تكنولوجيا/`, `/category/حديث/`, `/category/روبوت/`, `/category/مستورد/`
- All archived `/tag/*` demo tags (`مستعمل`, `روبوت`, `تكنولوجيا`, …)

### Theme demo / widget pages

| Old URL |
|---|
| `/hello-world/` |
| `/footer-about-widget/` |
| `/footer-subscription/` |
| `/آخر-الأخبار-المهمة-في-التكنولوجيا/` |
| `/أنواع-البطاقات-الذكية-والرقمية/` |
| `/الترجمة-والكتابة-بالحديث/` |
| `/تصاميم-حديثة-وإبداعية/` |
| `/كيف-نزيد-عدد-الزيارات؟/` |
| `/وظائف-المستقبل-مع-الذكاء-الاصطناعي/` |

---

## New-only pages (no old URL)

| New URL | Notes |
|---|---|
| `/gift` (+ gift anchors) | New gift funnel |
| `/blogs/[slug]` posts | New Sanity/mock content |
| `/blogs/page/[n]` | New pagination |
| `/login`, `/admin/*` | Private |

---

## Summary

| Bucket | Count |
|---|---|
| Exact / section mappings | 24 |
| Home fallback (audited explicit paths) | 43 |
| Taxonomy splat catch-alls | 3 patterns |
| Protected current routes (no redirect source) | `/`, `/gift`, `/blogs/*`, `/login` |

---

## Verification

1. Regenerate rules: `npm run generate:redirects`
2. Unit tests: `npm run test:redirects` (includes `_redirects` sync guard)
3. Local Cloudflare preview: `npm run preview:cf`
4. Probe script: `npm run verify:redirects`
   - Covers exact, encoded, no-slash, and taxonomy splat routes
   - Also probes representative routes with `?utm_*` query strings
   - Asserts `301`, correct path/fragment, no redirect loop, and a healthy final page
   - Allows Cloudflare query-string preservation on the `Location` header
