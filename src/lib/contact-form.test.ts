import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { offers } from '../data/offers.ts';
import { packages } from '../data/packages.ts';
import { serviceCategories } from '../data/services.ts';
import {
  buildContactWhatsAppMessage,
  buildContactWhatsAppUrl,
  getContactBookingGroups,
  isSaudiMobile,
} from './contact-form.ts';

describe('contact form booking groups', () => {
  it('lists every service, package, and offer for the landing form', () => {
    const groups = getContactBookingGroups();
    const serviceCount = serviceCategories.reduce((total, category) => total + category.items.length, 0);

    assert.deepEqual(
      groups.map((group) => group.id),
      ['service', 'package', 'offer'],
    );
    assert.equal(groups[0]?.options.length, serviceCount);
    assert.equal(groups[1]?.options.length, packages.length);
    assert.equal(groups[2]?.options.length, offers.length);
    assert.ok(groups[0]?.options.some((option) => option.value === 'service:relaxation-massage'));
    assert.ok(groups[1]?.options.some((option) => option.value === 'package:royal'));
    assert.ok(groups[2]?.options.some((option) => option.value === 'offer:majestic'));
  });
});

describe('contact form WhatsApp payload', () => {
  it('builds an Arabic booking message and skips empty notes', () => {
    assert.equal(
      buildContactWhatsAppMessage({
        name: 'زياد',
        phone: '0538770710',
        bookingLabel: 'مساج الإسترخاء',
      }),
      ['*الاسم:* زياد', '*الجوال:* 0538770710', '*الحجز:* مساج الإسترخاء'].join('\n'),
    );
    assert.match(
      buildContactWhatsAppMessage({
        name: 'زياد',
        phone: '0538770710',
        bookingLabel: 'مساج الإسترخاء',
        note: 'بعد المغرب',
      }),
      /\*ملاحظات:\* بعد المغرب/,
    );
  });

  it('opens WhatsApp with the Room Spa number', () => {
    const url = buildContactWhatsAppUrl('مرحبا');
    assert.equal(url, `https://wa.me/966538770710?text=${encodeURIComponent('مرحبا')}`);
  });
});

describe('Saudi mobile check', () => {
  it('accepts local and international Saudi mobiles', () => {
    assert.equal(isSaudiMobile('0538770710'), true);
    assert.equal(isSaudiMobile('966538770710'), true);
    assert.equal(isSaudiMobile('+966538770710'), true);
    assert.equal(isSaudiMobile('123'), false);
  });
});
