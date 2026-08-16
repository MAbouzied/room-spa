import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { offers } from './offers.ts';

const projectRoot = new URL('../../', import.meta.url);

/** Remaining price-quote flyers that stay on the offers section. */
const quoteOffers = [
  {
    id: 'wellness',
    name: 'عرض الاستجمام',
    price: 240,
    originalPrice: 300,
    features: ['جلسة بخار', 'حمام مغربي', 'بدكير يدين وقدمين'],
  },
  {
    id: 'vip-personalities',
    name: 'عرض كبار الشخصيات',
    price: 349,
    originalPrice: 437,
    features: ['حمام مغربي ملكي + جلسة بخار', 'روم سبا مساج 3 بلس', 'بدكير يدين وقدمين'],
  },
  {
    id: 'deep-room',
    name: 'عرض ديب روم',
    price: 199,
    originalPrice: 249,
    features: ['مساج تايلندي', 'مساج سويدي', 'مساج الأحجار الساخنة'],
  },
  {
    id: 'breathe',
    name: 'عرض تنفس',
    price: 199,
    originalPrice: 249,
    features: ['مساج تايلندي', 'مساج سويدي', 'مساج الكاسات الصينية'],
  },
  {
    id: 'care',
    name: 'عرض كير',
    price: 249,
    originalPrice: 312,
    features: ['مساج تايلندي', 'مساج سويدي', 'بدكير يدين وقدمين'],
  },
  {
    id: 'majestic',
    name: 'عرض ماجيستيك',
    price: 249,
    originalPrice: 312,
    features: ['مساج تايلندي', 'مساج سويدي', 'حمام مغربي ملكي + جلسة بخار'],
  },
  {
    id: 'vip',
    name: 'عرض VIP',
    price: 333,
    originalPrice: 417,
    features: ['حمام مغربي ملكي + جلسة بخار', 'روم سبا مساج 3 بلس', 'الكاسات الصينية', 'مساج الأحجار الساخنة'],
  },
  {
    id: 'royal',
    name: 'العرض الملكي',
    price: 449,
    originalPrice: 562,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
      'مساج الأحجار الساخنة',
    ],
  },
] as const;

const retiredOfferIds = ['groom', 'luxury', 'gift'] as const;

describe('offers catalog', () => {
  it('has unique offer ids', () => {
    const ids = offers.map((offer) => offer.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate offer id found');
  });

  it('includes every priced item from the quote flyer', () => {
    const byId = new Map(offers.map((offer) => [offer.id, offer]));

    for (const expected of quoteOffers) {
      const actual = byId.get(expected.id);
      assert.ok(actual, `missing offer ${expected.id} (${expected.name})`);
      assert.equal(actual.name, expected.name);
      assert.equal(actual.price, expected.price);
      assert.equal(actual.originalPrice, expected.originalPrice);
      assert.ok(actual.price < actual.originalPrice, `${expected.id} sale price must be below original`);
      assert.deepEqual(actual.features, [...expected.features]);
      assert.ok(actual.whatsappText.includes(expected.name));
    }
  });

  it('drops quote flyers that now live in packages', () => {
    const ids = offers.map((offer) => offer.id);
    for (const retiredId of retiredOfferIds) {
      assert.equal(ids.includes(retiredId), false, `retired offer still listed: ${retiredId}`);
    }
  });

  it('keeps a flyer image on disk for every offer', () => {
    for (const offer of offers) {
      assert.match(offer.image, /^\/images\/offers\/.+\.jpg$/);
      const relative = `public${offer.image}`;
      const imagePath = fileURLToPath(new URL(relative, projectRoot));
      assert.equal(existsSync(imagePath), true, `missing image ${offer.image}`);
    }
  });
});
