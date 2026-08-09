export type SpaOffer = {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  features: string[];
  whatsappText: string;
};

export const offers: SpaOffer[] = [
  {
    id: 'majestic',
    name: 'عرض ماجيستيك',
    image: '/images/offers/majestic.jpg',
    price: 249,
    originalPrice: 312,
    features: ['مساج تايلندي', 'مساج سويدي', 'حمام مغربي ملكي + جلسة بخار'],
    whatsappText: 'مرحبا، أرغب بحجز عرض ماجيستيك',
  },
  {
    id: 'wellness',
    name: 'عرض الاستجمام',
    image: '/images/offers/wellness.jpg',
    price: 240,
    originalPrice: 300,
    features: ['جلسة بخار', 'حمام مغربي', 'بدكير يدين وقدمين'],
    whatsappText: 'مرحبا، أرغب بحجز عرض الاستجمام',
  },
  {
    id: 'vip-personalities',
    name: 'عرض كبار الشخصيات',
    image: '/images/offers/vip-personalities.jpg',
    price: 349,
    originalPrice: 437,
    features: ['حمام مغربي ملكي + جلسة بخار', 'روم سبا مساج 3 بلس', 'بدكير يدين وقدمين'],
    whatsappText: 'مرحبا، أرغب بحجز عرض كبار الشخصيات',
  },
  {
    id: 'vip',
    name: 'عرض VIP',
    image: '/images/offers/vip.jpg',
    price: 333,
    originalPrice: 417,
    features: ['حمام مغربي ملكي + جلسة بخار', 'روم سبا مساج 3 بلس', 'الكاسات الصينية', 'مساج الأحجار الساخنة'],
    whatsappText: 'مرحبا، أرغب بحجز عرض VIP',
  },
  {
    id: 'royal',
    name: 'العرض الملكي',
    image: '/images/offers/royal.jpg',
    price: 449,
    originalPrice: 562,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
      'مساج الأحجار الساخنة',
    ],
    whatsappText: 'مرحبا، أرغب بحجز العرض الملكي',
  },
  {
    id: 'deep-room',
    name: 'عرض ديب روم',
    image: '/images/offers/deep-room.jpg',
    price: 199,
    originalPrice: 249,
    features: ['مساج تايلندي', 'مساج سويدي', 'مساج الأحجار الساخنة'],
    whatsappText: 'مرحبا، أرغب بحجز عرض ديب روم',
  },
  {
    id: 'breathe',
    name: 'عرض تنفس',
    image: '/images/offers/breathe.jpg',
    price: 199,
    originalPrice: 249,
    features: ['مساج تايلندي', 'مساج سويدي', 'مساج الكاسات الصينية'],
    whatsappText: 'مرحبا، أرغب بحجز عرض تنفس',
  },
  {
    id: 'care',
    name: 'عرض كير',
    image: '/images/offers/care.jpg',
    price: 249,
    originalPrice: 312,
    features: ['مساج تايلندي', 'مساج سويدي', 'بدكير يدين وقدمين'],
    whatsappText: 'مرحبا، أرغب بحجز عرض كير',
  },
];
