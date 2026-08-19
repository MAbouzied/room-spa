import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { formCopy, switchFormPath } from './form-copy.ts';

test('switches the form landing between Arabic and English paths', () => {
  assert.equal(switchFormPath('/form'), '/en/form');
  assert.equal(switchFormPath('/form/'), '/en/form');
  assert.equal(switchFormPath('/en/form'), '/form');
  assert.equal(switchFormPath('/en/form/'), '/form');
});

test('exposes Arabic and English chrome for the form landing', () => {
  assert.equal(formCopy.ar.pageTitle, 'تواصل معنا - روم سبا');
  assert.equal(formCopy.en.pageTitle, 'Contact us - Room Spa');
  assert.equal(formCopy.ar.whatsappAction, 'تواصل واتساب');
  assert.equal(formCopy.en.whatsappAction, 'WhatsApp');
  assert.equal(formCopy.ar.callAction, 'اتصال');
  assert.equal(formCopy.en.callAction, 'Call');
  assert.equal(formCopy.ar.locationAction, 'الموقع');
  assert.equal(formCopy.en.locationAction, 'Location');
  assert.equal(formCopy.ar.offersAction, 'العروض');
  assert.equal(formCopy.en.offersAction, 'Offers');
  assert.equal(formCopy.en.home, 'Home');
  assert.equal(formCopy.en.langSwitchLabel, 'AR');
});

test('places a language switch and quick actions on the form landing', async () => {
  const html = await readFile(new URL('../components/FormLandingPage.astro', import.meta.url), 'utf8');
  assert.match(html, /LanguageSwitcher/);
  assert.match(html, /ContactForm/);
  assert.match(html, /FormActions/);
  assert.ok(html.indexOf('FormBranches') < html.indexOf('<FormActions'));
  assert.ok(html.indexOf('<FormActions') < html.indexOf('<ContactForm'));
});

test('keeps the WhatsApp submit button and drops the contact form fields', async () => {
  const html = await readFile(new URL('../components/ContactForm.astro', import.meta.url), 'utf8');
  assert.match(html, /whatsappBookUrl/);
  assert.match(html, /copy\.submit/);
  assert.doesNotMatch(html, /<form/);
  assert.doesNotMatch(html, /name="phone"/);
  assert.doesNotMatch(html, /name="service"/);
  assert.doesNotMatch(html, /getContactBookingGroups/);
});

test('form actions link to WhatsApp, call, maps, and WhatsApp offers', async () => {
  const html = await readFile(new URL('../components/FormActions.astro', import.meta.url), 'utf8');
  assert.match(html, /whatsappBookUrl/);
  assert.match(html, /tel:\$\{site\.phoneTel\}/);
  assert.match(html, /mapsUrl/);
  assert.match(html, /buildOffersWhatsAppUrl/);
  assert.doesNotMatch(html, /\/#offers/);
});

test('form landing uses two columns with info first and WhatsApp contact second', async () => {
  const html = await readFile(new URL('../components/FormLandingPage.astro', import.meta.url), 'utf8');
  assert.ok(html.indexOf('form-landing__info') < html.indexOf('form-landing__form'));
  assert.match(html, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/);
});

test('form landing keeps the logo static and drops home chrome', async () => {
  const html = await readFile(new URL('../components/FormLandingPage.astro', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /href=\{brandHref\}/);
  assert.doesNotMatch(html, /data-form-landing-crumb/);
  assert.doesNotMatch(html, /fullSite/);
});
