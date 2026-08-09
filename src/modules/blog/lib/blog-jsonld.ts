import type { BlogPost } from '../model/blog-types.ts';

type JsonLd = Record<string, unknown>;

const absoluteUrl = (site: URL, path = '/'): string => new URL(path, site).href;

export function organizationId(site: URL): string {
  return `${site.origin}/#business`;
}

export function websiteId(site: URL): string {
  return `${site.origin}/#website`;
}

/** Escape literal `<` so CMS text cannot terminate a JSON-LD script element. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}

export function buildBlogPostingSchema(options: {
  site: URL;
  post: BlogPost;
  path: string;
  readingTimeMinutes?: number;
}): JsonLd {
  const url = absoluteUrl(options.site, options.path);
  const { post } = options;
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#blogposting`,
    headline: post.title,
    description: post.seo.description?.trim() || post.excerpt.trim(),
    image: absoluteUrl(options.site, post.cover.src),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: 'ar-SA',
    articleSection: post.category.label,
    author: {
      '@type': 'Person',
      name: post.author.name,
      ...(post.author.role ? { jobTitle: post.author.role } : {}),
    },
    publisher: { '@id': organizationId(options.site) },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
    },
    ...(typeof options.readingTimeMinutes === 'number'
      ? { timeRequired: `PT${Math.max(1, Math.round(options.readingTimeMinutes))}M` }
      : {}),
  };
}

export function buildCollectionPageSchema(options: {
  site: URL;
  path: string;
  name: string;
  description: string;
}): JsonLd {
  const url = absoluteUrl(options.site, options.path);
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: options.name,
    description: options.description,
    inLanguage: 'ar-SA',
    isPartOf: { '@id': websiteId(options.site) },
    about: { '@id': organizationId(options.site) },
  };
}

export function buildBlogItemListSchema(options: {
  site: URL;
  path: string;
  name: string;
  description: string;
  posts: readonly BlogPost[];
}): JsonLd {
  const url = absoluteUrl(options.site, options.path);
  return {
    '@type': 'ItemList',
    '@id': `${url}#itemlist`,
    name: options.name,
    description: options.description,
    numberOfItems: options.posts.length,
    itemListElement: options.posts.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: post.title,
      url: absoluteUrl(options.site, `/blogs/${post.slug}/`),
      item: {
        '@type': 'BlogPosting',
        name: post.title,
        description: post.excerpt,
        url: absoluteUrl(options.site, `/blogs/${post.slug}/`),
        image: absoluteUrl(options.site, post.cover.src),
      },
    })),
  };
}

export function buildBlogBreadcrumbSchema(site: URL): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: absoluteUrl(site, '/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'المدونة',
        item: absoluteUrl(site, '/blogs/'),
      },
    ],
  };
}

export function buildBlogWebPageSchema(options: {
  site: URL;
  path: string;
  name: string;
  description: string;
  mainEntityId?: string;
}): JsonLd {
  const url = absoluteUrl(options.site, options.path);
  const schema: JsonLd = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: options.name,
    description: options.description,
    inLanguage: 'ar-SA',
    isPartOf: { '@id': websiteId(options.site) },
    about: { '@id': organizationId(options.site) },
  };

  if (options.mainEntityId) {
    schema.mainEntity = { '@id': options.mainEntityId };
  }

  return schema;
}

export function buildBlogDetailBreadcrumbSchema(
  site: URL,
  postTitle: string,
  path: string,
): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(site, path)}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: absoluteUrl(site, '/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'المدونة',
        item: absoluteUrl(site, '/blogs/'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: postTitle,
        item: absoluteUrl(site, path),
      },
    ],
  };
}

export function buildBlogCollectionSchemas(options: {
  site: URL;
  path: string;
  name: string;
  description: string;
  posts: readonly BlogPost[];
}): JsonLd[] {
  return [
    buildCollectionPageSchema(options),
    buildBlogBreadcrumbSchema(options.site),
    buildBlogItemListSchema(options),
  ];
}
