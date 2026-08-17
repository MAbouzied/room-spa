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
];
