import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { serviceCategories } from '../../data/services.ts';
import { listAdminServices } from './blog-admin-services.ts';

describe('listAdminServices', () => {
  it('keeps persisted relatedServiceId values compatible with existing posts', () => {
    const services = listAdminServices();
    const byTitle = (part: string) => services.find((service) => service.title.includes(part));

    assert.equal(byTitle('مساج روم سبا')?.id, 'massage-1');
    assert.equal(byTitle('مساج الشياتسو')?.id, 'massage-3');
    assert.equal(byTitle('مساج الإسترخاء')?.id, 'massage-4');
    assert.equal(byTitle('مساج رفلكسولوجي')?.id, 'massage-6');
    assert.equal(byTitle('حمام مغربي كلاسيك')?.id, 'hammam-3');
    assert.equal(byTitle('قص الأظافر')?.id, 'pedicure-1');

    assert.equal(
      services.some((service) => service.id === 'skin-1'),
      false,
    );
    assert.equal(
      services.some((service) => service.id === 'room-spa-massage'),
      false,
    );
  });

  it('exposes one admin option per service item in catalog order', () => {
    const services = listAdminServices();
    const expectedCount = serviceCategories.reduce((total, category) => total + category.items.length, 0);

    assert.equal(services.length, expectedCount);
    assert.equal(services[0]?.title, 'المساج — مساج الإسترخاء');
    assert.equal(
      services.every((service) => /^(massage|hammam|pedicure)-\d+$/.test(service.id)),
      true,
    );
  });
});
