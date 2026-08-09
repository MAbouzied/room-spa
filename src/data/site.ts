/** Room Spa business details. */
export const site = {
  /** REPLACE: production domain (used for canonical, OG, sitemap, schema) */
  siteUrl: 'https://roomspa.sa',
  nameAr: 'روم سبا',
  nameEn: 'Room Spa',
  legalName: 'Room Spa',
  tagline: 'وجهة الرجل الأولى في حفر الباطن',
  description:
    'خدمات متكاملة بمعايير عالية، وكادر احترافي جاهز لاستقبالك في أي وقت.',
  seoDescription:
    'روم سبا — أفخم سبا رجالي في حفر الباطن. مساج، حمام مغربي، عناية بالبشرة وباقات فاخرة مع حجز عبر الواتساب.',
  locale: 'ar_SA',
  language: 'ar',
  city: 'حفر الباطن',
  country: 'SA',
  priceCurrency: 'SAR',
  phoneDisplay: '+966 53 877 0710',
  phoneTel: '+966538770710',
  whatsappNumber: '966538770710',
  whatsappBookUrl:
    'https://wa.me/966538770710?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%0A%D8%AD%D8%A7%D8%A8%20%D8%A7%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF',
  whatsappGiftUrl:
    'https://wa.me/966538770710?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A5%D9%87%D8%AF%D8%A7%D8%A1%20%D8%A8%D8%A7%D9%82%D8%A9%20%D9%88%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%AA%D9%83%D9%85%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D8%B1%D8%AA%D9%8A%D8%A8%D8%A7%D8%AA',
  social: {
    instagram: 'https://www.instagram.com/roomspa2',
  },
  vat: {
    registrationNumber: '302212729300003',
    crNumber: '2511020960',
    certificateUrl: '/images/legal/vat-certificate.png',
    badgeUrl: '/images/legal/vat-badge.svg',
    authorityNameAr: 'هيئة الزكاة والضريبة والجمارك',
    authorityUrl: 'https://zatca.gov.sa',
  },
  branches: [
    {
      id: 'hafr-al-batin',
      name: 'حفر الباطن',
      address: 'أبو بكر الصديق، المصيف - حفر الباطن 31993',
      hours: '24 ساعة • 7 أيام',
      mapsUrl: 'https://maps.app.goo.gl/H1G7H3mggavJdrJZ9',
    },
  ],
} as const;

export type Branch = (typeof site.branches)[number];
