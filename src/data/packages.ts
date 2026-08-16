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
    id: 'bisht',
    name: 'باقة البشت',
    description: 'تجربة خاصة ليوم العرس بأناقة تليق بالمناسبة',
    giftDescription: 'اختيار فاخر يليق بيومه الخاص',
    price: 399,
    originalPrice: 499,
    savingsPercent: 20,
    features: [
      'حمام مغربي ملكي + جلسة بخار',
      'روم سبا مساج 3 بلس',
      'بدكير يدين وقدمين',
      'الكاسات الصينية',
    ],
    giftWhatsappText: 'مرحبا، أرغب بإهداء باقة البشت وأحتاج مساعدتكم في الترتيبات',
  },
  {
    id: 'naeem-room',
    name: 'باقة نعيم روم',
    description: 'رفاهية متكاملة مع ضيافة تُكمل الاسترخاء',
    giftDescription: 'لحظة نعيم كاملة لمن تحبين',
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
    giftWhatsappText: 'مرحبا، أرغب بإهداء باقة نعيم روم وأحتاج مساعدتكم في الترتيبات',
  },
  {
    id: 'ihdaa',
    name: 'باقة الإهداء',
    description: 'باقة إهداء كاملة مع حلا وباقة ورد',
    giftDescription: 'الهدية الأجمل — تجربة كاملة مع ورد وحلا',
    featured: true,
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
    giftWhatsappText: 'مرحبا، أرغب بإهداء باقة الإهداء وأحتاج مساعدتكم في الترتيبات',
  },
];

export function giftWhatsappUrl(text: string, number: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
