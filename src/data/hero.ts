export interface HeroImage {
  src: string;
  alt: string;
}

export const heroImageSize = {
  width: 1600,
  height: 1067,
} as const;

export const heroImages: HeroImage[] = [
  { src: '/images/hero/hero-01.jpg', alt: 'صالة انتظار روم سبا مع جلسة فاخرة' },
  { src: '/images/hero/hero-02.jpg', alt: 'تفاصيل داخل روم سبا' },
  { src: '/images/hero/hero-03.jpg', alt: 'ركن من داخل روم سبا' },
  { src: '/images/hero/hero-04.jpg', alt: 'أجواء روم سبا' },
  { src: '/images/hero/hero-05.jpg', alt: 'قاعة داخل روم سبا' },
  { src: '/images/hero/hero-06.jpg', alt: 'تجهيزات روم سبا' },
  { src: '/images/hero/hero-07.jpg', alt: 'ركن استرخاء في روم سبا' },
  { src: '/images/hero/hero-08.jpg', alt: 'تفاصيل إضاءة روم سبا' },
  { src: '/images/hero/hero-09.jpg', alt: 'مساحة داخل روم سبا' },
  { src: '/images/hero/hero-10.jpg', alt: 'جلسة داخل روم سبا' },
  { src: '/images/hero/hero-11.jpg', alt: 'ركن خدمة في روم سبا' },
  { src: '/images/hero/hero-12.jpg', alt: 'قاعة فسيحة داخل روم سبا' },
  { src: '/images/hero/hero-13.jpg', alt: 'ديكور روم سبا' },
  { src: '/images/hero/hero-14.jpg', alt: 'تفاصيل داخلية من روم سبا' },
  { src: '/images/hero/hero-15.jpg', alt: 'ركن ضيافة في روم سبا' },
  { src: '/images/hero/hero-16.jpg', alt: 'لمحة من داخل روم سبا' },
];
