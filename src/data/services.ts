export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  description: string;
  durationMinutes?: number;
};

export type ServiceCategory = {
  id: string;
  title: string;
  items: ServiceItem[];
};

export const serviceCategories: ServiceCategory[] = [
  {
    id: 'massage',
    title: 'المساج',
    items: [
      {
        id: 'relaxation-massage',
        name: 'مساج الإسترخاء',
        price: 150,
        durationMinutes: 45,
        description:
          'مساج سويدي لطيف يحسّن الدورة الدموية ويقلّل الشد العضلي ويعزّز الاسترخاء العام.',
      },
      {
        id: 'reflexology-massage',
        name: 'مساج رفلكسولوجي',
        price: 150,
        durationMinutes: 45,
        description:
          'مساج يركّز على القدمين بمفهوم المنعكسات لتحفيز أنظمة الجسم واستعادة توازنها.',
      },
      {
        id: 'hot-oil-massage',
        name: 'مساج الزيت الحار',
        price: 150,
        durationMinutes: 45,
        description:
          'مساج بزيت دافئ يرخّي العضلات ويرطّب البشرة ويخفّف التوتر بلمسة عميقة ومريحة.',
      },
      {
        id: 'shiatsu-massage',
        name: 'مساج الشياتسو',
        price: 200,
        durationMinutes: 60,
        description:
          'تقنية يابانية تعتمد على ضغط قوي بالأصابع أو راحة اليد أو المرفقين على نقاط محددة في الجسم؛ لتقليل التوتر وتحفيز الاسترخاء.',
      },
      {
        id: 'thai-massage',
        name: 'مساج تايلندي',
        price: 185,
        durationMinutes: 60,
        description:
          'مساج يعتمد على الإطالة والضغط لتحرير الشد العضلي وتحسين المرونة ونطاق الحركة.',
      },
      {
        id: 'sports-massage',
        name: 'المساج الرياضي',
        price: 199,
        durationMinutes: 60,
        description:
          'مساج موجّه للعضلات المستخدمة بكثافة لتجهيز الجسم قبل الجهد أو تسريع الاستشفاء بعده.',
      },
      {
        id: 'room-spa-massage',
        name: 'مساج روم سبا',
        price: 249,
        durationMinutes: 80,
        description:
          'جلسة مميزة تجمع تقنيات الاسترخاء والشياتسو والريفلكسولوجي لتعزيز استرخاء العضلات واستقرار الجسم.',
      },
    ],
  },
  {
    id: 'hammam',
    title: 'الحمام المغربي',
    items: [
      {
        id: 'classic-hammam',
        name: 'حمام مغربي كلاسيك',
        price: 150,
        durationMinutes: 40,
        description:
          'الوصفة المغربية الأصيلة بالصابون البلدي والطين المغربي وجلسة البخار لتقشير البشرة وتنعيمها.',
      },
      {
        id: 'dead-sea-hammam',
        name: 'حمام بطين البحر الميت أو الأعشاب العطرية',
        price: 200,
        durationMinutes: 50,
        description:
          'طقوس الحمام المغربي التقليدي مع طين البحر الميت أو أعشاب عطرية وجلسات بخار لتنقية البشرة وتهدئة العضلات.',
      },
    ],
  },
  {
    id: 'pedicure',
    title: 'بدكير',
    items: [
      {
        id: 'hands-feet-pedicure',
        name: 'قص الأظافر وتنظيف وتنعيم اليدين والقدمين',
        price: 150,
        description:
          'عناية متكاملة بتنظيف اليدين والقدمين، إزالة الجلد الميت، قص الأظافر وبردها، باستخدام أملاح البحر الميت وملح الحليب.',
      },
    ],
  },
];

/** Public fragment target for a service item, e.g. `service-room-spa-massage`. */
export function serviceAnchorId(serviceId: string): string {
  return `service-${serviceId}`;
}
