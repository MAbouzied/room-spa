import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [
  baseLayout,
  gtmComponent,
  astroConfig,
  wrangler,
  adminLayout,
  header,
  footer,
  whatsAppFloat,
  contactForm,
  formActions,
] = await Promise.all([
  readFile(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/Gtm.astro', import.meta.url), 'utf8'),
  readFile(new URL('../../astro.config.mjs', import.meta.url), 'utf8'),
  readFile(new URL('../../wrangler.toml', import.meta.url), 'utf8'),
  readFile(new URL('../layouts/AdminLayout.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/Header.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/Footer.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/WhatsAppFloat.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/ContactForm.astro', import.meta.url), 'utf8'),
  readFile(new URL('../components/FormActions.astro', import.meta.url), 'utf8'),
]);

test('loads GA4 gtag only in production when the measurement id is valid', () => {
  assert.match(baseLayout, /import Gtm from '\.\.\/components\/Gtm\.astro'/);
  assert.match(baseLayout, /PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(baseLayout, /import\.meta\.env\.PROD/);
  assert.match(baseLayout, /isGaMeasurementId/);
  assert.match(baseLayout, /<Gtm measurementId=\{gaMeasurementId\} \/>/);
  assert.match(astroConfig, /PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(wrangler, /PUBLIC_GA_MEASUREMENT_ID = "G-D2NJJ1ZPF5"/);
});

test('embeds the Google Analytics gtag snippet', () => {
  assert.match(gtmComponent, /googletagmanager\.com\/gtag\/js\?id=\$\{scriptId\}/);
  assert.match(gtmComponent, /resolveGoogleTagScriptId\(\[googleTagId, googleAdsId, gtmId\]\)/);
  assert.match(gtmComponent, /<script is:inline async src=\{scriptSrc\}><\/script>/);
  assert.doesNotMatch(gtmComponent, /encodeURIComponent\(gtmId\)/);
  assert.match(gtmComponent, /gtag\('config', gtmId\)/);
  assert.match(gtmComponent, /window\.dataLayer/);
  assert.match(gtmComponent, /isGaMeasurementId/);
  assert.match(gtmComponent, /astro:page-load/);
  assert.match(gtmComponent, /trackGtmPageView/);
});

test('adds the Google Ads tag and contact conversion to the existing tag', () => {
  assert.match(gtmComponent, /GOOGLE_TAG_ID/);
  assert.match(gtmComponent, /GOOGLE_ADS_ID/);
  assert.match(gtmComponent, /gtag\('config', googleTagId\)/);
  assert.match(gtmComponent, /gtag\('config', googleAdsId\)/);
  assert.match(gtmComponent, /GOOGLE_ADS_CONTACT_SEND_TO/);
  assert.match(gtmComponent, /trackGoogleAdsConversion\(GOOGLE_ADS_CONTACT_SEND_TO\)/);
  assert.doesNotMatch(adminLayout, /GOOGLE_ADS_ID|AW-18495851809/);
});

test('keeps Google Analytics off admin chrome pages', () => {
  assert.doesNotMatch(adminLayout, /Gtm|gtm-container-id|googletagmanager|gtag/);
});

test('marks header, footer, and floating contact buttons for GTM events', () => {
  assert.match(header, /gtmContactAttrs\(GTM_EVENTS\.whatsapp, 'header'\)/);
  assert.match(footer, /gtmContactAttrs\(GTM_EVENTS\.call, 'footer'\)/);
  assert.match(footer, /gtmContactAttrs\(GTM_EVENTS\.whatsapp, 'footer'\)/);
  assert.match(whatsAppFloat, /gtmContactAttrs\(GTM_EVENTS\.whatsapp, 'floating'\)/);
});

test('marks form landing contact actions for GTM events', () => {
  assert.match(contactForm, /gtmContactAttrs\(GTM_EVENTS\.whatsapp, 'form_landing'\)/);
  assert.match(formActions, /gtmContactAttrs\(GTM_EVENTS\.call, 'form_landing'\)/);
  assert.match(formActions, /gtmContactAttrs\(GTM_EVENTS\.whatsapp, 'form_landing_offers'\)/);
});
