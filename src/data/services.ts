export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  description: string;
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
        id: 'room-spa-massage',
        name: 'مساج روم سبا',
        price: 300,
        description:
          'المساج الملكي الذي يجمع جميع أنواعنا الخمسة: الاسترخاء، الأنسجة العميقة، الأحجار الساخنة، الشياتسو، والريفلكسولوجي؛ لتعزيز استرخاء العضلات واستقرار الجسم.',
      },
      {
        id: 'hot-stone-massage',
        name: 'مساج الأحجار الساخنة',
        price: 280,
        description:
          'مساج فاخر يعتمد على وضع أحجار ساخنة على نقاط محددة من الجسم لتعزيز الاسترخاء وتخفيف توتر العضلات وتحسين الدورة الدموية.',
      },
      {
        id: 'shiatsu-massage',
        name: 'مساج شياتسو',
        price: 280,
        description:
          'تقنية يابانية تعتمد على ضغط قوي بالأصابع أو راحة اليد أو المرفقين على نقاط محددة في الجسم؛ لتقليل التوتر وتحفيز الاسترخاء.',
      },
      {
        id: 'relaxation-massage',
        name: 'مساج الإسترخاء',
        price: 250,
        description:
          'مساج سويدي لطيف يحسّن الدورة الدموية ويقلّل الشد العضلي ويعزّز الاسترخاء العام.',
      },
      {
        id: 'deep-tissue-massage',
        name: 'مساج الأنسجة العميقة',
        price: 250,
        description:
          'تقنية تستهدف طبقات العضلات العميقة بضغط خفيف إلى متوسط لتخفيف الألم العضلي المزمن والتوتر.',
      },
      {
        id: 'reflexology-massage',
        name: 'مساج رفلكسولوجي',
        price: 230,
        description:
          'مساج يركّز على القدمين بمفهوم المنعكسات لتحفيز أنظمة الجسم واستعادة توازنها.',
      },
    ],
  },
  {
    id: 'hammam',
    title: 'الحمام المغربي',
    items: [
      {
        id: 'royal-argan-hammam',
        name: 'حمام ملكي بزيت الأرجان',
        price: 450,
        description:
          'جلسة ملكية فاخرة بالصابون البلدي والطين المغربي وطين البحر الميت، مع صنفرة بزيت الأرجان وجلسات بخار متتابعة.',
      },
      {
        id: 'dead-sea-hammam',
        name: 'حمام مغربي بطين البحر الميت والأعشاب العطرية',
        price: 250,
        description:
          'طقوس الحمام المغربي التقليدي مع طين البحر الميت وأعشاب عطرية وجلسات بخار لتنقية البشرة وتهدئة العضلات.',
      },
      {
        id: 'classic-hammam',
        name: 'حمام مغربي كلاسيك بالطين المغربي',
        price: 230,
        description:
          'الوصفة المغربية الأصيلة بالصابون البلدي والطين المغربي وجلسة البخار لتقشير البشرة وتنعيمها.',
      },
    ],
  },
  {
    id: 'pedicure',
    title: 'البديكير',
    items: [
      {
        id: 'hands-feet-pedicure',
        name: 'بديكير اليدين والقدمين',
        price: 250,
        description:
          'عناية متكاملة بتنظيف اليدين والقدمين، إزالة الجلد الميت، قص الأظافر وبردها، باستخدام أملاح البحر الميت وملح الحليب.',
      },
      {
        id: 'hands-pedicure',
        name: 'بديكير اليدين',
        price: 150,
        description: 'جلسة مخصصة لليدين لإزالة الجلد الميت وترطيب عميق وتنسيق الأظافر.',
      },
      {
        id: 'feet-pedicure',
        name: 'بديكير القدمين',
        price: 150,
        description: 'تنظيف وتقشير للقدمين مع ترطيب وتدليك لمنحك إحساساً بالانتعاش.',
      },
    ],
  },
  {
    id: 'skin',
    title: 'البشرة',
    items: [
      {
        id: 'signature-facial',
        name: 'تنظيف البشرة المميز',
        price: 250,
        description:
          'جلسة عناية متقدمة بتقنية الهيدرافيشيال لتنظيف البشرة بعمق مع ترطيب فوري بأمصال مغذية تمنح الوجه نضارة وإشراقاً.',
      },
    ],
  },
];

/** Public fragment target for a service item, e.g. `service-room-spa-massage`. */
export function serviceAnchorId(serviceId: string): string {
  return `service-${serviceId}`;
}
