import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { serviceAnchorId, serviceCategories } from './services.ts';

/** Summer price list — the public services catalog source of truth. */
const summerServices = [
  { id: 'relaxation-massage', name: 'مساج الإسترخاء', price: 150, durationMinutes: 45, category: 'massage' },
  { id: 'reflexology-massage', name: 'مساج رفلكسولوجي', price: 150, durationMinutes: 45, category: 'massage' },
  { id: 'hot-oil-massage', name: 'مساج الزيت الحار', price: 150, durationMinutes: 45, category: 'massage' },
  { id: 'shiatsu-massage', name: 'مساج الشياتسو', price: 200, durationMinutes: 60, category: 'massage' },
  { id: 'thai-massage', name: 'مساج تايلندي', price: 185, durationMinutes: 60, category: 'massage' },
  { id: 'sports-massage', name: 'المساج الرياضي', price: 199, durationMinutes: 60, category: 'massage' },
  { id: 'room-spa-massage', name: 'مساج روم سبا', price: 249, durationMinutes: 80, category: 'massage' },
  { id: 'classic-hammam', name: 'حمام مغربي كلاسيك', price: 150, durationMinutes: 40, category: 'hammam' },
  {
    id: 'dead-sea-hammam',
    name: 'حمام بطين البحر الميت أو الأعشاب العطرية',
    price: 200,
    durationMinutes: 50,
    category: 'hammam',
  },
  {
    id: 'hands-feet-pedicure',
    name: 'قص الأظافر وتنظيف وتنعيم اليدين والقدمين',
    price: 150,
    durationMinutes: undefined,
    category: 'pedicure',
  },
] as const;

const retiredServiceIds = [
  'hot-stone-massage',
  'deep-tissue-massage',
  'royal-argan-hammam',
  'hands-pedicure',
  'feet-pedicure',
  'signature-facial',
] as const;

describe('services catalog', () => {
  it('matches the summer price list in flyer order', () => {
    const items = serviceCategories.flatMap((category) =>
      category.items.map((item) => ({ ...item, category: category.id })),
    );

    assert.deepEqual(
      items.map((item) => item.id),
      summerServices.map((item) => item.id),
    );

    for (const [index, expected] of summerServices.entries()) {
      const actual = items[index];
      assert.equal(actual.name, expected.name);
      assert.equal(actual.price, expected.price);
      assert.equal(actual.durationMinutes, expected.durationMinutes);
      assert.equal(actual.category, expected.category);
      assert.equal(serviceAnchorId(actual.id), `service-${expected.id}`);
    }
  });

  it('drops retired services and the skin category', () => {
    const ids = serviceCategories.flatMap((category) => category.items.map((item) => item.id));
    const categoryIds = serviceCategories.map((category) => category.id);

    for (const retiredId of retiredServiceIds) {
      assert.equal(ids.includes(retiredId), false, `retired service still listed: ${retiredId}`);
    }

    assert.equal(categoryIds.includes('skin'), false);
    assert.deepEqual(categoryIds, ['massage', 'hammam', 'pedicure']);
  });
});
