// @ts-check
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { cacheCloudflare } from '@astrojs/cloudflare/cache';
import { defineConfig, envField } from 'astro/config';
import icon from 'astro-icon';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const site = 'https://roomspa-sa.com';

// astro-icon pulls CJS into the Cloudflare Workers runner and crashes `astro dev`
// with "module is not defined". Use Node SSR for local dev; Cloudflare for build/deploy.
const isDev = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  site,
  ...(isDev
    ? {}
    : {
        adapter: cloudflare({ imageService: 'compile' }),
        cache: { provider: cacheCloudflare() },
      }),
  trailingSlash: 'ignore',
  env: {
    schema: {
      BLOG_PROVIDER: envField.enum({
        context: 'server',
        access: 'public',
        values: ['mock', 'sanity'],
        optional: true,
        default: 'mock',
      }),
      SANITY_PROJECT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_DATASET: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_API_VERSION: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_API_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_WRITE_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      BLOG_REVALIDATE_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      SANITY_AUTH_DATASET: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
        default: 'staff-auth',
      }),
      SANITY_AUTH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_AUTH_DISABLED: envField.boolean({
        context: 'server',
        access: 'secret',
        optional: true,
        default: false,
      }),
      PUBLIC_SANITY_STUDIO_URL: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      BETTER_AUTH_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_CLIENT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      GOOGLE_CLIENT_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  integrations: [
    icon(),
    react(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'ar',
        locales: {
          ar: 'ar-SA',
        },
      },
      filter: (page) => {
        try {
          const path = new URL(page).pathname;
          return !/\/(api|admin|login)(\/|$)/.test(path);
        } catch {
          return !/\/(api|admin|login)(\/|$)/.test(page);
        }
      },
      serialize(item) {
        try {
          const path = new URL(item.url).pathname;
          if (path === '/blogs' || path === '/blogs/' || path.startsWith('/blogs/')) {
            return {
              ...item,
              links: [{ url: item.url, lang: 'ar' }],
            };
          }
        } catch {
          /* keep default item */
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
