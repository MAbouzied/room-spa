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
  assert.equal(formCopy.ar.submit, 'إرسال عبر واتساب');
  assert.equal(formCopy.en.submit, 'Send on WhatsApp');
  assert.equal(formCopy.en.home, 'Home');
  assert.equal(formCopy.en.langSwitchLabel, 'AR');
});

test('places a language switch on the form landing', async () => {
  const html = await readFile(new URL('../components/FormLandingPage.astro', import.meta.url), 'utf8');
  assert.match(html, /LanguageSwitcher/);
});
