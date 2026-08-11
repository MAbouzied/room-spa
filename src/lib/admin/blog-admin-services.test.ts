import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { serviceCategories } from '../../data/services.ts';
import { listAdminServices } from './blog-admin-services.ts';

describe('listAdminServices', () => {
  it('keeps persisted relatedServiceId values compatible with existing posts', () => {
    const services = listAdminServices();

    assert.equal(services[0]?.id, 'massage-1');
    assert.equal(services[1]?.id, 'massage-2');
    assert.ok(services.some((service) => service.id === 'hammam-1'));
    assert.ok(services.some((service) => service.id === 'pedicure-1'));
    assert.ok(services.some((service) => service.id === 'skin-1'));

    // Public ServiceItem.id values must not replace the admin option IDs.
    assert.equal(
      services.some((service) => service.id === 'room-spa-massage'),
      false,
    );
  });

  it('exposes one admin option per service item in catalog order', () => {
    const services = listAdminServices();
    const expectedCount = serviceCategories.reduce((total, category) => total + category.items.length, 0);

    assert.equal(services.length, expectedCount);
    assert.equal(services[0]?.title, 'المساج — مساج روم سبا');
  });
});
