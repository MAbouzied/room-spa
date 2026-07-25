# Room Spa (روم سبا)

Static Arabic RTL marketing site for Room Spa — Astro + Cloudflare Workers.

Live structure mirrors a luxury men’s spa landing experience: home + gift pages, SEO schema, and soft client-side navigation.

## Stack

- [Astro](https://astro.build/) (static)
- `astro-icon` + Iconify sets
- `@astrojs/sitemap`
- Cloudflare Workers static assets via Wrangler

## Commands

| Command | Action |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Local Astro dev server |
| `npm run build` | Production build to `./dist` |
| `npm run preview` | Preview the Astro build locally |
| `npm run deploy` | Build + deploy to Cloudflare Workers |
| `npm run cf:dev` | Build + run Wrangler local Workers preview |

## Deploy to Cloudflare Workers

This repo is configured for [Cloudflare Workers static assets](https://developers.cloudflare.com/workers/static-assets/) using `wrangler.jsonc`.

### One-time setup

1. Create a Cloudflare account and note your **Account ID**.
2. Create an API token with **Workers Scripts:Edit** (and Account read if needed).
3. Locally (optional):

```sh
npx wrangler login
npm run deploy
```

### GitHub Actions (recommended)

Add repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Push to `main` (or run **Deploy to Cloudflare Workers** manually). The workflow builds the site and runs `wrangler deploy`.

### Custom domain

In Cloudflare Dashboard → Workers & Pages → `room-spa` → Settings → Domains, attach your domain (e.g. `roomspa.sa`). Keep `site` in `astro.config.mjs` aligned with the production URL for sitemap/canonicals.

## Project notes

- Content/config placeholders live in `src/data/site.ts`
- Routes: `/` (home), `/gift` (gift landing)
- No CMS / no blog
