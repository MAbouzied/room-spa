/** Raw Sanity projections used by GROQ queries. */

export interface SanityImageAsset {
  _id?: string;
  url?: string;
  metadata?: {
    dimensions?: { width?: number; height?: number };
  };
}

export interface SanityImageValue {
  asset?: SanityImageAsset | null;
  alt?: string | null;
  caption?: string | null;
  hotspot?: { x?: number; y?: number } | null;
  crop?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  } | null;
}

export interface SanityAuthorRef {
  name?: string | null;
  role?: string | null;
  image?: SanityImageValue | null;
}

export interface SanityCategoryRef {
  categoryId?: string | null;
  label?: string | null;
}

export interface SanitySeo {
  title?: string | null;
  description?: string | null;
  focusKeyword?: string | null;
  canonicalUrl?: string | null;
}

export interface SanityRelatedPost {
  slug?: string | null;
}

export interface SanityBlogPostDoc {
  _id: string;
  title?: string | null;
  slug?: string | null;
  locale?: string | null;
  excerpt?: string | null;
  coverUrl?: string | null;
  cover?: SanityImageValue | null;
  author?: SanityAuthorRef | null;
  category?: SanityCategoryRef | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  featured?: boolean | null;
  seo?: SanitySeo | null;
  body?: unknown[] | null;
  bodyFormat?: string | null;
  bodyHtml?: string | null;
  relatedServiceId?: string | null;
  relatedPosts?: SanityRelatedPost[] | null;
  readingTimeMinutes?: number | null;
}
