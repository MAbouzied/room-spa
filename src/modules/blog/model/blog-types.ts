export type BlogLocale = 'ar';

export interface BlogCategory {
  id: string;
  label: string;
}

export interface BlogAuthor {
  name: string;
  role?: string;
  image?: BlogImage;
}

export interface BlogImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
  focalPoint?: { x: number; y: number };
}

export interface BlogSeo {
  title?: string;
  description?: string;
  focusKeyword?: string;
  canonicalUrl?: string;
  ogImage?: BlogImage;
}

export type BlogContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; text: string; id?: string }
  | { type: 'unordered-list'; items: string[] }
  | { type: 'ordered-list'; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'image'; image: BlogImage }
  | {
      type: 'link-paragraph';
      parts: Array<{ text: string; href?: string; external?: boolean }>;
    }
  | {
      type: 'two-column';
      columns: [BlogContentBlock[], BlogContentBlock[]];
    }
  | { type: 'embed-placeholder'; label: string; provider?: string };

export type BlogBody =
  | { format: 'blocks'; blocks: BlogContentBlock[] }
  | { format: 'portableText'; value: readonly unknown[] }
  | { format: 'lexical'; version: number; json: string }
  | { format: 'html'; html: string };

export interface BlogPost {
  id: string;
  slug: string;
  locale: BlogLocale;
  title: string;
  excerpt: string;
  category: BlogCategory;
  author: BlogAuthor;
  cover: BlogImage;
  publishedAt: string;
  updatedAt?: string;
  featured: boolean;
  draft: boolean;
  seo: BlogSeo;
  body: BlogBody;
  relatedSlugs?: string[];
  relatedServiceId?: string;
  tags?: BlogCategory[];
  readingTimeMinutes?: number;
}

export interface BlogListingLabels {
  pageTitle: string;
  pageIntro: string;
  featuredEyebrow: string;
  readArticle: string;
  recentHeading: string;
  emptyTitle: string;
  emptyDescription: string;
  articleCount: (count: number) => string;
  previousPage: string;
  nextPage: string;
  pageLabel: (page: number, total: number) => string;
}

export interface BlogArticleLabels {
  updatedPrefix: string;
  tableOfContents: string;
  relatedHeading: string;
  readArticle: string;
  minutesToRead: (minutes: number) => string;
}

export const BLOG_PAGE_SIZE = 9;

export const DEFAULT_BLOG_LISTING_LABELS: BlogListingLabels = {
  pageTitle: 'مدونة روم سبا',
  pageIntro:
    'مقالات عربية مبسّطة حول المساج والحمام المغربي والاسترخاء والعناية الشخصية من روم سبا في حفر الباطن.',
  featuredEyebrow: 'مقال مميز',
  readArticle: 'قراءة المقال',
  recentHeading: 'أحدث المقالات',
  emptyTitle: 'لا توجد مقالات منشورة حالياً',
  emptyDescription: 'نجهّز محتوى مفيداً قريباً. يمكنك حجز موعد أو التواصل معنا في أي وقت.',
  articleCount: (count) =>
    count === 1 ? 'مقال واحد منشور' : `${count} مقالات منشورة`,
  previousPage: 'السابق',
  nextPage: 'التالي',
  pageLabel: (page, total) => `صفحة ${page} من ${total}`,
};

export const DEFAULT_BLOG_ARTICLE_LABELS: BlogArticleLabels = {
  updatedPrefix: 'آخر تحديث',
  tableOfContents: 'محتويات المقال',
  relatedHeading: 'مقالات ذات صلة',
  readArticle: 'قراءة المقال',
  minutesToRead: (minutes) =>
    minutes === 1 ? 'دقيقة قراءة واحدة' : `${minutes} دقائق قراءة`,
};
