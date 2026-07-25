/** PLACEHOLDER business details — replace with real Room Spa values. */
export const site = {
  /** REPLACE: production domain (used for canonical, OG, sitemap, schema) */
  siteUrl: 'https://roomspa.sa',
  nameAr: 'روم سبا',
  nameEn: 'Room Spa',
  legalName: 'Room Spa',
  tagline: 'وجهة الرجل الأولى في الرياض',
  description:
    'خدمات متكاملة بمعايير عالية، وكادر احترافي جاهز لاستقبالك في أي وقت.',
  seoDescription:
    'روم سبا — أفخم سبا رجالي في الرياض. مساج، حمام مغربي، عناية بالبشرة وباقات فاخرة مع حجز عبر الواتساب.',
  locale: 'ar_SA',
  language: 'ar',
  city: 'الرياض',
  country: 'SA',
  priceCurrency: 'SAR',
  phoneDisplay: '05XXXXXXXX',
  phoneTel: '05XXXXXXXX',
  whatsappNumber: '9665XXXXXXXX',
  whatsappBookUrl:
    'https://wa.me/9665XXXXXXXX?text=%D8%A7%D9%84%D8%B3%D9%84%D8%A7%D9%85%20%D8%B9%D9%84%D9%8A%D9%83%D9%85%0A%D8%AD%D8%A7%D8%A8%20%D8%A7%D8%AD%D8%AC%D8%B2%20%D9%85%D9%88%D8%B9%D8%AF',
  whatsappGiftUrl:
    'https://wa.me/9665XXXXXXXX?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D8%A8%D8%A5%D9%87%D8%AF%D8%A7%D8%A1%20%D8%A8%D8%A7%D9%82%D8%A9%20%D9%88%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%AA%D9%83%D9%85%20%D9%81%D9%8A%20%D8%A7%D9%84%D8%AA%D8%B1%D8%AA%D9%8A%D8%A8%D8%A7%D8%AA',
  social: {
    /** REPLACE: Snapchat profile URL */
    snapchat: '#',
    /** REPLACE: Instagram profile URL */
    instagram: '#',
    /** REPLACE: TikTok profile URL */
    tiktok: '#',
  },
  branches: [
    {
      id: 'branch-1',
      name: 'فرع العليا',
      address: 'طريق الملك فهد - حي العليا',
      hours: '24 ساعة • 7 أيام',
      /** REPLACE: Google Maps link */
      mapsUrl: '#',
    },
    {
      id: 'branch-2',
      name: 'فرع النرجس',
      address: 'طريق أنس بن مالك - حي النرجس',
      hours: '24 ساعة • 7 أيام',
      mapsUrl: '#',
    },
    {
      id: 'branch-3',
      name: 'فرع الملقا',
      address: 'طريق الملك عبدالعزيز - حي الملقا',
      hours: 'من 10 ص إلى 5 ص',
      mapsUrl: '#',
    },
    {
      id: 'branch-4',
      name: 'فرع الشفا',
      address: 'شارع الشفا - حي الشفا',
      hours: 'من 10 ص إلى 5 ص',
      mapsUrl: '#',
    },
  ],
} as const;

export type Branch = (typeof site.branches)[number];
