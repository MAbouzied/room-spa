import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { packages } from './packages.ts';

/** Price-quote flyers that now live in the packages section. */
const quotePackages = [
  {
    id: 'bisht',
    name: 'باقة البشت',
    price: 399,
    originalPrice: 499,
    savingsPercent: 20,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
    ],
  },
  {
    id: 'naeem-room',
    name: 'باقة نعيم روم',
    price: 549,
    originalPrice: 685,
    savingsPercent: 20,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
      'مساج الأحجار الساخنة',
      'كوب قهوة',
      'حلا',
    ],
  },
  {
    id: 'ihdaa',
    name: 'باقة الإهداء',
    price: 590,
    originalPrice: 735,
    savingsPercent: 20,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
      'مساج الأحجار الساخنة',
      'حلا',
      'باقة ورد',
    ],
  },
] as const;

describe('packages catalog', () => {
  it('has unique package ids', () => {
    const ids = packages.map((pkg) => pkg.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate package id found');
  });

  it('includes the quote flyers moved out of offers', () => {
    const byId = new Map(packages.map((pkg) => [pkg.id, pkg]));

    for (const expected of quotePackages) {
      const actual = byId.get(expected.id);
      assert.ok(actual, `missing package ${expected.id} (${expected.name})`);
      assert.equal(actual.name, expected.name);
      assert.equal(actual.price, expected.price);
      assert.equal(actual.originalPrice, expected.originalPrice);
      assert.equal(actual.savingsPercent, expected.savingsPercent);
      assert.ok(actual.price < actual.originalPrice, `${expected.id} sale price must be below original`);
      assert.deepEqual(actual.features, [...expected.features]);
      assert.ok(actual.giftWhatsappText.includes(expected.name));
    }
  });
});
