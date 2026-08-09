import type { BlogPost } from '../model/blog-types.ts';

/**
 * Mock Arabic blog fixtures for Room Spa launch.
 * Replace or switch BLOG_PROVIDER=sanity when CMS content is ready.
 */
export const mockBlogPosts: BlogPost[] = [
  {
    id: 'post-massage-guide',
    slug: 'dalil-anwaa-almasaj-hafr-albatin',
    locale: 'ar',
    title: 'دليل أنواع المساج في حفر الباطن: أي جلسة تناسبك؟',
    excerpt:
      'شرح مبسّط لأنواع المساج الشائعة — من الاسترخاء إلى الرياضي — لمساعدتك على اختيار الجلسة المناسبة قبل الحجز.',
    category: { id: 'massage', label: 'المساج' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
      image: {
        src: '/images/logo.png',
        alt: 'شعار روم سبا',
        width: 512,
        height: 512,
      },
    },
    cover: {
      src: '/images/offers/deep-room.jpg',
      alt: 'جلسة مساج استرخاء في أجواء هادئة',
      width: 1600,
      height: 1067,
      caption: 'اختيار نوع المساج يعتمد على هدفك من الزيارة.',
    },
    publishedAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-28T10:00:00.000Z',
    featured: true,
    draft: false,
    seo: {
      title: 'دليل أنواع المساج في حفر الباطن | روم سبا',
      description:
        'تعرّف على أنواع المساج في روم سبا بحفر الباطن، والفروقات بينها، وكيف تختار الجلسة المناسبة لاحتياجك.',
    },
    relatedSlugs: ['fawaid-almasaj-alistirkha', 'masaj-riyadi-mata-yufid'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'كثير من الزائرين يسألون عن الفرق بين مساج الاسترخاء والمساج الرياضي والتايلندي قبل الحجز. هذا الدليل يوضّح الأسس العامة فقط، والاختيار النهائي يتم مع الفريق حسب هدفك من الجلسة.',
        },
        {
          type: 'paragraph',
          text: 'الهدف هنا مساعدتك على طرح الأسئلة الصحيحة: هل تريد تهدئة عامة؟ تخفيف شد عضلي؟ أم استعادة بعد مجهود؟',
        },
        { type: 'heading', level: 2, text: 'مساج الاسترخاء' },
        {
          type: 'paragraph',
          text: 'يناسب من يبحث عن هدوء عام وتقليل التوتر. الإيقاع عادة أهدأ، والتركيز على التنفس والأجواء أكثر من الضغط العميق.',
        },
        { type: 'heading', level: 3, text: 'متى تختاره؟' },
        {
          type: 'unordered-list',
          items: [
            'بعد يوم طويل أو ضغط عمل مرتفع.',
            'إذا كنت جديداً على جلسات المساج.',
            'عندما تريد تجربة هادئة دون ضغط عميق.',
          ],
        },
        { type: 'heading', level: 2, text: 'المساج بالزيت الحار والحجر' },
        {
          type: 'paragraph',
          text: 'يساعد الدفء على الشعور بالراحة في العضلات المتشنجة. أخبر المعالج بأي حساسية للحرارة أو مشاكل جلدية قبل الجلسة.',
        },
        {
          type: 'ordered-list',
          items: [
            'تحديد مناطق الشد أو الإرهاق.',
            'اختيار مستوى الضغط المناسب لك.',
            'الاسترخاء بعد الجلسة وشرب الماء حسب التوجيه.',
          ],
        },
        {
          type: 'image',
          image: {
            src: '/images/offers/majestic.jpg',
            alt: 'جلسة مساج بالحجارة الساخنة',
            width: 1600,
            height: 1067,
            caption: 'الدفء جزء من تجربة الاسترخاء وليس بديلاً عن التقييم الشخصي.',
          },
        },
        { type: 'heading', level: 2, text: 'المساج الرياضي والتايلندي' },
        {
          type: 'paragraph',
          text: 'غالباً يناسبان من يمارس نشاطاً بدنياً أو يحتاج تمدداً أعمق. الضغط والإيقاع يختلفان، لذا وضّح مستواك وتاريخك الصحي باختصار قبل البدء.',
        },
        {
          type: 'quote',
          text: 'أفضل جلسة هي التي تناسب هدفك اليوم — لا أكثر الجلسات شهرة بالضرورة.',
          attribution: 'فريق روم سبا',
        },
        { type: 'heading', level: 2, text: 'مقارنة سريعة' },
        {
          type: 'two-column',
          columns: [
            [
              { type: 'heading', level: 3, text: 'اختر الاسترخاء عندما' },
              {
                type: 'unordered-list',
                items: ['تريد تهدئة عامة', 'تفضل ضغطاً خفيفاً إلى متوسطاً', 'تفضل أجواء هادئة وخاصة'],
              },
            ],
            [
              { type: 'heading', level: 3, text: 'اختر الرياضي أو التايلندي عندما' },
              {
                type: 'unordered-list',
                items: ['تحتاج تمدداً أعمق', 'تعاني شدّاً عضلياً بعد مجهود', 'تستطيع التواصل عن مستوى الضغط'],
              },
            ],
          ],
        },
        {
          type: 'embed-placeholder',
          label: 'فيديو قصير عن أجواء الجلسة داخل روم سبا (قريباً)',
          provider: 'future-video',
        },
        { type: 'heading', level: 2, text: 'متى تحجز؟' },
        {
          type: 'paragraph',
          text: 'إذا كنت غير متأكد من النوع المناسب، ابدأ بجلسة استرخاء أو أخبر الفريق بهدفك عبر واتساب ليساعدوك على الاختيار.',
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'يمكنك ' },
            { text: 'حجز موعد', href: '/book/' },
            { text: ' أو الاطلاع على ' },
            { text: 'خدمات المساج', href: '/#services' },
            { text: ' ثم التواصل مع الفريق.' },
          ],
        },
      ],
    },
  },
  {
    id: 'post-moroccan-bath',
    slug: 'hammam-maghribi-madha-tatawaqqa',
    locale: 'ar',
    title: 'الحمام المغربي: ماذا تتوقع قبل الجلسة وبعدها؟',
    excerpt:
      'خطوات عملية لفهم تجربة الحمام المغربي، من التحضير إلى العناية بعده، دون وعود مبالغ فيها.',
    category: { id: 'bath', label: 'الحمام المغربي' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
    },
    cover: {
      src: '/images/offers/majestic.jpg',
      alt: 'تجربة حمام مغربي بإضاءة هادئة',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-07-15T08:00:00.000Z',
    featured: false,
    draft: false,
    seo: {
      title: 'الحمام المغربي في حفر الباطن | روم سبا',
      description:
        'تعرّف على خطوات الحمام المغربي في روم سبا بحفر الباطن وما ينبغي معرفته قبل الحجز وبعد الجلسة.',
    },
    relatedSlugs: ['dalil-anwaa-almasaj-hafr-albatin', 'inah-baad-aljalsa'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'الحمام المغربي تجربة عناية وتنظيف عميق للبشرة مع استرخاء. المسار يختلف قليلاً حسب الباقة، لكن التحضير البسيط يحسّن راحتك خلال الجلسة.',
        },
        { type: 'heading', level: 2, text: 'قبل الجلسة' },
        {
          type: 'unordered-list',
          items: [
            'أخبر الفريق بأي حساسية جلدية أو تهيج حديث.',
            'تجنّب المنتجات القاسية مباشرة قبل الموعد إن أمكن.',
            'احضر في وقت مناسب دون استعجال.',
          ],
        },
        { type: 'heading', level: 2, text: 'بعد الجلسة' },
        {
          type: 'paragraph',
          text: 'رطّب بشرتك حسب التوجيه، وتجنّب التعرض الشديد للشمس أو المنتجات القاسية في الساعات الأولى إن نصحك الفريق بذلك.',
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'اطّلع على ' },
            { text: 'خدمة الحمام المغربي', href: '/#servicesmoroccan-bath/' },
            { text: ' أو ' },
            { text: 'احجز موعداً', href: '/book/' },
            { text: '.' },
          ],
        },
      ],
    },
  },
  {
    id: 'post-relaxation-benefits',
    slug: 'fawaid-almasaj-alistirkha',
    locale: 'ar',
    title: 'فوائد مساج الاسترخاء: لماذا يفضّله كثير من الزائرين؟',
    excerpt:
      'نظرة عامة على ما يبحث عنه الناس في جلسات الاسترخاء وكيف تستفيد أكثر من زيارتك.',
    category: { id: 'relaxation', label: 'الاسترخاء' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
    },
    cover: {
      src: '/images/offers/majestic.jpg',
      alt: 'أجواء عطرية هادئة في جلسة سبا',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-07-10T11:30:00.000Z',
    featured: false,
    draft: false,
    seo: {
      description:
        'تعرّف على فوائد مساج الاسترخاء وكيف تجهّز نفسك لجلسة مريحة في روم سبا بحفر الباطن.',
    },
    relatedSlugs: ['dalil-anwaa-almasaj-hafr-albatin', 'inah-baad-aljalsa'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'مساج الاسترخاء يساعد كثيراً من الزائرين على تهدئة الإيقاع اليومي وإعادة الشعور بالراحة. النتيجة تختلف من شخص لآخر، والأهم وضوح هدفك من الجلسة.',
        },
        { type: 'heading', level: 2, text: 'كيف تستفيد أكثر؟' },
        {
          type: 'unordered-list',
          items: [
            'وضّح مناطق الإزعاج أو التوتر للمعالج.',
            'اختر مستوى ضغط يناسبك ولا تتردد في التعديل.',
            'امنح نفسك دقائق بعد الجلسة قبل العودة للاندفاع.',
          ],
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'ابدأ من ' },
            { text: 'مساج الاسترخاء', href: '/#services' },
            { text: ' أو ' },
            { text: 'احجز الآن', href: '/book/' },
            { text: '.' },
          ],
        },
      ],
    },
  },
  {
    id: 'post-sports-massage',
    slug: 'masaj-riyadi-mata-yufid',
    locale: 'ar',
    title: 'المساج الرياضي: متى يفيدك وكيف تستعد؟',
    excerpt:
      'إرشادات عملية حول المساج الرياضي بعد المجهود أو التمرين، ومتى تفضّل جلسة ألطف.',
    category: { id: 'massage', label: 'المساج' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
    },
    cover: {
      src: '/images/offers/majestic.jpg',
      alt: 'جلسة مساج عميق للعضلات',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-07-05T07:45:00.000Z',
    featured: false,
    draft: false,
    seo: {},
    relatedSlugs: ['dalil-anwaa-almasaj-hafr-albatin'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'المساج الرياضي غالباً يناسب من يمارس نشاطاً بدنياً أو يشعر بشد عضلي بعد مجهود. إن كان لديك إصابة حديثة أو ألم حاد، أخبر الفريق قبل الحجز.',
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'تعرّف على ' },
            { text: 'مساج روم سبا', href: '/#services' },
            { text: ' مباشرة.' },
          ],
        },
      ],
    },
  },
  {
    id: 'post-aftercare',
    slug: 'inah-baad-aljalsa',
    locale: 'ar',
    title: 'العناية بعد جلسة السبا: عادات بسيطة تحافظ على الراحة',
    excerpt:
      'نصائح عامة بعد المساج أو الحمام المغربي للحفاظ على شعور الاسترخاء أطول فترة ممكنة.',
    category: { id: 'care', label: 'العناية الشخصية' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
    },
    cover: {
      src: '/images/offers/majestic.jpg',
      alt: 'عناية شخصية بعد جلسة سبا',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-06-28T12:00:00.000Z',
    featured: false,
    draft: false,
    seo: {
      title: 'العناية بعد جلسة السبا | مدونة روم سبا',
      description:
        'نصائح عملية بعد جلسة المساج أو الحمام المغربي في روم سبا بحفر الباطن.',
    },
    relatedSlugs: ['hammam-maghribi-madha-tatawaqqa', 'fawaid-almasaj-alistirkha'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'بعد الجلسة، الجسم يحتاج إيقاعاً هادئاً قليلاً. اشرب الماء إن نصحك الفريق، وتجنّب الوجبات الثقيلة جداً مباشرة إن شعرت بدوخة خفيفة أو تعب.',
        },
        { type: 'heading', level: 2, text: 'عادات مفيدة' },
        {
          type: 'unordered-list',
          items: [
            'راحة قصيرة قبل القيادة لمسافة طويلة إن أمكن.',
            'تجنّب الرياضة العنيفة مباشرة بعد الجلسات العميقة.',
            'رطّب البشرة بعد الحمام المغربي حسب التوجيه.',
          ],
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'جاهز لزيارتك التالية؟ ' },
            { text: 'احجز موعداً', href: '/book/' },
            { text: ' أو تصفّح ' },
            { text: 'الباقات', href: '/packages/' },
            { text: '.' },
          ],
        },
      ],
    },
  },
  {
    id: 'post-first-visit',
    slug: 'awwal-ziyara-li-room-spa',
    locale: 'ar',
    title: 'أول زيارة لروم سبا: ماذا تحضّر قبل الموعد؟',
    excerpt:
      'دليل سريع لأول زيارة — من الوصول إلى الفرع وحتى اختيار الخدمة المناسبة.',
    category: { id: 'relaxation', label: 'الاسترخاء' },
    author: {
      name: 'فريق روم سبا',
      role: 'محتوى تثقيفي عن الاسترخاء والعناية',
    },
    cover: {
      src: '/images/offers/wellness.jpg',
      alt: 'أجواء داخلية هادئة في روم سبا',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-06-20T09:15:00.000Z',
    featured: false,
    draft: false,
    seo: {
      description:
        'نصائح لأول زيارة إلى روم سبا في حفر الباطن: كيف تحجز، ماذا تتوقع، وكيف تختار خدمتك الأولى.',
    },
    relatedSlugs: ['dalil-anwaa-almasaj-hafr-albatin', 'inah-baad-aljalsa'],
    body: {
      format: 'blocks',
      blocks: [
        {
          type: 'paragraph',
          text: 'زيارتك الأولى أسهل عندما تعرف المسار: احجز عبر واتساب أو صفحة الحجز، وصل قبل الموعد بقليل، وأخبر الفريق بأي ملاحظات صحية مهمة.',
        },
        { type: 'heading', level: 2, text: 'خطوات سريعة' },
        {
          type: 'ordered-list',
          items: [
            'اختر الخدمة أو الباقة المناسبة.',
            'سجّل بياناتك واحجز الموعد.',
            'وصل مرتاحاً ووضّح هدفك من الجلسة.',
          ],
        },
        {
          type: 'link-paragraph',
          parts: [
            { text: 'ابدأ من ' },
            { text: 'صفحة الحجز', href: '/book/' },
            { text: ' أو تعرّف علينا عبر ' },
            { text: 'من نحن', href: '/about/' },
            { text: '.' },
          ],
        },
      ],
    },
  },
  // Draft + future posts exercise filtering (excluded from public routes).
  {
    id: 'post-draft-internal',
    slug: 'draft-internal-notes-only',
    locale: 'ar',
    title: 'مسودة داخلية غير منشورة',
    excerpt: 'هذه المسودة يجب ألا تظهر في الموقع.',
    category: { id: 'massage', label: 'المساج' },
    author: { name: 'فريق التحرير' },
    cover: {
      src: '/images/offers/deep-room.jpg',
      alt: 'صورة غلاف للمسودة',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2026-07-01T00:00:00.000Z',
    featured: false,
    draft: true,
    seo: {},
    body: {
      format: 'blocks',
      blocks: [{ type: 'paragraph', text: 'محتوى مسودة للاختبار فقط.' }],
    },
  },
  {
    id: 'post-future-scheduled',
    slug: 'maqal-mustaqbali-mukhatat',
    locale: 'ar',
    title: 'مقال مجدول للنشر لاحقاً',
    excerpt: 'يجب استبعاد هذا المقال حتى يحين تاريخ نشره.',
    category: { id: 'care', label: 'العناية الشخصية' },
    author: { name: 'فريق التحرير' },
    cover: {
      src: '/images/offers/majestic.jpg',
      alt: 'صورة غلاف لمقال مجدول',
      width: 1600,
      height: 1067,
    },
    publishedAt: '2099-01-01T00:00:00.000Z',
    featured: true,
    draft: false,
    seo: {},
    body: {
      format: 'blocks',
      blocks: [{ type: 'paragraph', text: 'محتوى مجدول للمستقبل.' }],
    },
  },
];
