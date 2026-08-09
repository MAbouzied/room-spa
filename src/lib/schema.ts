import { site } from '../data/site';
import { serviceCategories } from '../data/services';
import { packages } from '../data/packages';
import { faqItems } from '../data/faq';

type JsonLd = Record<string, unknown>;

const absoluteUrl = (path = '/') => {
  const base = site.siteUrl.replace(/\/$/, '');
  if (!path || path === '/') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};

const logoUrl = absoluteUrl('/images/logo-mark.png');
const imageUrl = absoluteUrl('/images/logo-full.png');

const sameAs = [site.social.instagram].filter((url) => url && url !== '#');

export function organizationSchema(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': `${absoluteUrl('/')}#organization`,
    name: site.nameAr,
    alternateName: [site.nameEn, site.legalName],
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: logoUrl,
      width: 512,
      height: 512,
    },
    image: imageUrl,
    description: site.seoDescription,
    telephone: site.phoneTel,
    vatID: site.vat.registrationNumber,
    taxID: site.vat.crNumber,
    areaServed: {
      '@type': 'City',
      name: site.city,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressCountry: site.country,
    },
    sameAs,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.phoneTel,
        contactType: 'customer service',
        availableLanguage: ['Arabic'],
        areaServed: site.country,
      },
    ],
  };
}

export function websiteSchema(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': `${absoluteUrl('/')}#website`,
    url: absoluteUrl('/'),
    name: site.nameAr,
    alternateName: site.nameEn,
    description: site.seoDescription,
    inLanguage: site.language,
    publisher: { '@id': `${absoluteUrl('/')}#organization` },
  };
}

export function localBusinessSchema(): JsonLd {
  return {
    '@type': ['HealthAndBeautyBusiness', 'DaySpa'],
    '@id': `${absoluteUrl('/')}#localbusiness`,
    name: site.nameAr,
    alternateName: site.nameEn,
    url: absoluteUrl('/'),
    image: [imageUrl, logoUrl],
    logo: logoUrl,
    description: site.seoDescription,
    telephone: site.phoneTel,
    vatID: site.vat.registrationNumber,
    taxID: site.vat.crNumber,
    priceRange: '$$',
    currenciesAccepted: site.priceCurrency,
    paymentAccepted: 'Cash, Credit Card',
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.city,
      addressCountry: site.country,
    },
    areaServed: {
      '@type': 'City',
      name: site.city,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '00:00',
        closes: '23:59',
      },
    ],
    hasMap: site.google.mapsUrl,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: site.google.ratingValue,
      reviewCount: site.google.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
    sameAs: [...sameAs, site.google.mapsUrl],
    parentOrganization: { '@id': `${absoluteUrl('/')}#organization` },
  };
}

export function branchListSchema(): JsonLd {
  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl('/')}#branches`,
    name: `موقع ${site.nameAr}`,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: site.branches.length,
    itemListElement: site.branches.map((branch, index) => {
      const [street, district] = branch.address.split(' - ');
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          '@id': `${absoluteUrl('/')}#branch-${branch.id}`,
          name: `${site.nameAr} — ${branch.name}`,
          telephone: site.phoneTel,
          url: absoluteUrl('/#branches'),
          image: logoUrl,
          address: {
            '@type': 'PostalAddress',
            streetAddress: street,
            addressLocality: district || site.city,
            addressRegion: site.city,
            addressCountry: site.country,
          },
          hasMap: branch.mapsUrl !== '#' ? branch.mapsUrl : undefined,
          parentOrganization: { '@id': `${absoluteUrl('/')}#organization` },
        },
      };
    }),
  };
}

export function servicesItemListSchema(): JsonLd {
  const services = serviceCategories.flatMap((category) =>
    category.items.map((item) => ({
      category: category.title,
      ...item,
    })),
  );

  return {
    '@type': 'ItemList',
    '@id': `${absoluteUrl('/')}#services`,
    name: `خدمات ${site.nameAr}`,
    description: 'قائمة خدمات المساج والحمام المغربي والعناية في روم سبا',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: services.length,
    itemListElement: services.map((service, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: { '@id': `${absoluteUrl('/')}#localbusiness` },
        areaServed: site.city,
        category: service.category,
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: site.priceCurrency,
          availability: 'https://schema.org/InStock',
          url: absoluteUrl('/#services'),
        },
      },
    })),
  };
}

export function packagesItemListSchema(pagePath = '/'): JsonLd {
  const pageUrl = absoluteUrl(pagePath);
  return {
    '@type': 'ItemList',
    '@id': `${pageUrl}#packages`,
    name: `باقات ${site.nameAr}`,
    description: 'باقات السبا الفاخرة في روم سبا',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: packages.length,
    itemListElement: packages.map((pkg, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        '@id': `${pageUrl}#package-${pkg.id}`,
        name: `باقة ${pkg.name}`,
        description: pkg.description,
        brand: {
          '@type': 'Brand',
          name: site.nameAr,
        },
        category: 'Spa Package',
        image: logoUrl,
        offers: {
          '@type': 'Offer',
          url: `${pageUrl}#packages`,
          price: pkg.price,
          priceCurrency: site.priceCurrency,
          availability: 'https://schema.org/InStock',
          priceValidUntil: `${new Date().getFullYear()}-12-31`,
        },
        additionalProperty: pkg.features.map((feature) => ({
          '@type': 'PropertyValue',
          name: 'includes',
          value: feature,
        })),
      },
    })),
  };
}

export function faqPageSchema(): JsonLd {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl('/')}#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: Array<{ name: string; path: string }>,
): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(items[items.length - 1]?.path || '/')}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webPageSchema(options: {
  title: string;
  description: string;
  path: string;
  type?: string;
}): JsonLd {
  const url = absoluteUrl(options.path);
  return {
    '@type': options.type || 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: options.title,
    description: options.description,
    inLanguage: site.language,
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
    about: { '@id': `${absoluteUrl('/')}#organization` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: imageUrl,
    },
  };
}

export function buildGraph(nodes: JsonLd[]): JsonLd {
  const cleaned = nodes.map((node) => {
    const next: JsonLd = {};
    for (const [key, value] of Object.entries(node)) {
      if (value !== undefined && value !== null && value !== '') {
        next[key] = value;
      }
    }
    return next;
  });

  return {
    '@context': 'https://schema.org',
    '@graph': cleaned,
  };
}

export { absoluteUrl };
