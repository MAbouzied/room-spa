export interface GalleryImage {
  src: string;
  alt: string;
  featured?: boolean;
}

export const galleryImageSize = {
  width: 1400,
  height: 933,
} as const;

export const galleryImages: GalleryImage[] = [
  {
    src: '/images/gallery/front-night.jpg',
    alt: 'واجهة روم سبا ليلاً مع شعار المفاتيح المتقاطعة ومدخل الزجاج',
    featured: true,
  },
  {
    src: '/images/gallery/front-wide.jpg',
    alt: 'الواجهة الأمامية لروم سبا ومدخل الصالون',
  },
  {
    src: '/images/gallery/entrance.jpg',
    alt: 'مدخل روم سبا من الزجاج مع إضاءة الواجهة',
  },
  {
    src: '/images/gallery/front-sign.jpg',
    alt: 'لافتة روم سبا على الواجهة الخارجية',
  },
  {
    src: '/images/gallery/entrance-sign.jpg',
    alt: 'لوحة روم سبا عند المدخل',
  },
  {
    src: '/images/gallery/reception.jpg',
    alt: 'استقبال روم سبا عند المدخل',
  },
  { src: '/images/gallery/interior-01.jpg', alt: 'صالة انتظار روم سبا مع جلسة فاخرة' },
  { src: '/images/gallery/interior-02.jpg', alt: 'تفاصيل داخل روم سبا' },
  { src: '/images/gallery/interior-03.jpg', alt: 'ركن من داخل روم سبا' },
  { src: '/images/gallery/interior-04.jpg', alt: 'أجواء روم سبا' },
  { src: '/images/gallery/interior-05.jpg', alt: 'قاعة داخل روم سبا' },
  { src: '/images/gallery/interior-06.jpg', alt: 'تجهيزات روم سبا' },
  { src: '/images/gallery/interior-07.jpg', alt: 'ركن استرخاء في روم سبا' },
  { src: '/images/gallery/interior-08.jpg', alt: 'تفاصيل إضاءة روم سبا' },
  { src: '/images/gallery/interior-09.jpg', alt: 'مساحة داخل روم سبا' },
  { src: '/images/gallery/interior-10.jpg', alt: 'جلسة داخل روم سبا' },
  { src: '/images/gallery/interior-11.jpg', alt: 'ركن خدمة في روم سبا' },
  { src: '/images/gallery/interior-12.jpg', alt: 'قاعة فسيحة داخل روم سبا' },
  { src: '/images/gallery/interior-13.jpg', alt: 'ديكور روم سبا' },
  { src: '/images/gallery/interior-14.jpg', alt: 'تفاصيل داخلية من روم سبا' },
  { src: '/images/gallery/interior-15.jpg', alt: 'ركن ضيافة في روم سبا' },
  { src: '/images/gallery/interior-16.jpg', alt: 'لمحة من داخل روم سبا' },
];
