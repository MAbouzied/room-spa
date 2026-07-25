export type SpaPackage = {
  id: string;
  name: string;
  description: string;
  giftDescription?: string;
  price: number;
  originalPrice: number;
  savingsPercent: number;
  features: string[];
  featured?: boolean;
  giftWhatsappText: string;
};

export const packages: SpaPackage[] = [
  {
    id: 'royal',
    name: 'رويال',
    description: 'قمة الفخامة وتجربة ملكية متكاملة',
    giftDescription: 'الأرقى — لحظة ملكية كاملة لا تُنسى',
    price: 999,
    originalPrice: 1250,
    savingsPercent: 20,
    features: [
      'جلسة تدليك روم سبا 70 دقيقة',
      'حمام مغربي ملكي بزيت الآرجان',
      'بديكير اليدين والقدمين',
      'تنظيف البشرة المميز',
    ],
    giftWhatsappText: 'مرحبا، أرغب بإهداء رويال وأحتاج مساعدتكم في الترتيبات',
  },
  {
    id: 'majestic',
    name: 'ماجيستيك',
    description: 'تجربة فاخرة متكاملة تجمع بين الاسترخاء والعناية الراقية',
    giftDescription: 'تجربة استثنائية لمن يستحق التميز',
    price: 599,
    originalPrice: 750,
    savingsPercent: 20,
    featured: true,
    features: [
      'جلسة تدليك الأنسجة العميقة',
      'حمام مغربي بالطين المغربي أو الأعشاب العطرية',
      'بديكير اليدين والقدمين أو تنظيف البشرة المميز',
    ],
    giftWhatsappText: 'مرحبا، أرغب بإهداء ماجيستيك وأحتاج مساعدتكم في الترتيبات',
  },
  {
    id: 'elite',
    name: 'إليت',
    description: 'تجربة مميزة لاسترخاء عميق وتجديد كامل لحيويتك',
    giftDescription: 'اختيار راقٍ يجمع بين الراحة والفخامة',
    price: 499,
    originalPrice: 710,
    savingsPercent: 30,
    features: [
      'جلسة تدليك 45 دقيقة',
      'حمام مغربي كلاسيك',
      'بديكير اليدين والقدمين',
    ],
    giftWhatsappText: 'مرحبا، أرغب بإهداء إليت وأحتاج مساعدتكم في الترتيبات',
  },
  {
    id: 'classic',
    name: 'كلاسيك',
    description: 'تجربة استرخاء مثالية للبدء ولحظات هدوء تستحقها',
    giftDescription: 'بداية مثالية لتجربة هادئة',
    price: 299,
    originalPrice: 500,
    savingsPercent: 40,
    features: ['جلسة تدليك 60 دقيقة', 'حمام مغربي بالطين المغربي'],
    giftWhatsappText: 'مرحبا، أرغب بإهداء كلاسيك وأحتاج مساعدتكم في الترتيبات',
  },
];

export function giftWhatsappUrl(text: string, number: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
