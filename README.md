# Room Spa (روم سبا)

Static Astro website for Room Spa, deployed to Cloudflare Workers.

## Requirements

- Node.js 22.12 or newer
- npm

## Local development

```sh
npm install
npm run dev
```

## Cloudflare deployment

Same approach as Najma Spa: build into `dist/` and serve with Wrangler static assets.
No GitHub Actions worker — deploy via Wrangler CLI or Cloudflare Git integration.

```sh
npm run preview:cf
npm run deploy
```

For Cloudflare Git integration (Workers → Connect to Git), use:

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build output directory: `dist` (only when the dashboard requests it)
- Node.js version: `22`

## Project notes

- Placeholder business data: `src/data/site.ts`
- Routes: `/`, `/gift`, `404`
- Soft client navigation via Astro `ClientRouter`
