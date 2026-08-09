import { defineArrayMember, defineField, defineType } from 'sanity';

const unicodeKebabCase = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u;
const arabicDiacritics = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/gu;
const tatweel = /\u0640/gu;

function studioSlugify(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ar')
    .replace(tatweel, '')
    .replace(arabicDiacritics, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return Array.from(normalized).slice(0, 96).join('').replace(/-+$/g, '');
}

function isValidStudioSlug(value: string): boolean {
  const length = Array.from(value).length;
  return (
    length >= 3 &&
    length <= 96 &&
    unicodeKebabCase.test(value) &&
    value === studioSlugify(value)
  );
}

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().min(8).max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96, slugify: studioSlugify },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current;
          if (!current) return 'Slug is required';
          if (!isValidStudioSlug(current)) {
            return 'Use normalized Arabic or lowercase Latin kebab-case (3–96 characters)';
          }
          return true;
        }),
    }),
    defineField({
      name: 'locale',
      title: 'Locale',
      type: 'string',
      initialValue: 'ar',
      options: {
        list: [{ title: 'Arabic', value: 'ar' }],
        layout: 'radio',
      },
      validation: (rule) => rule.required().custom((value) => (value === 'ar' ? true : 'Only Arabic posts are supported')),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().min(40).max(220),
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'blogImage',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'blogAuthor' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'blogCategory' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated at',
      type: 'datetime',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'blogSeo',
    }),
    defineField({
      name: 'bodyFormat',
      title: 'Body format',
      type: 'string',
      initialValue: 'portableText',
      options: { list: [{ title: 'Portable Text', value: 'portableText' }, { title: 'Lexical JSON', value: 'lexical' }, { title: 'HTML', value: 'html' }] },
    }),
    defineField({
      name: 'bodyJson',
      title: 'Lexical body JSON',
      type: 'text',
      hidden: ({ document }) => document?.bodyFormat !== 'lexical',
      readOnly: true,
      validation: (rule) => rule.custom((value, context) => context.document?.bodyFormat === 'lexical' && (!value || !String(value).trim()) ? 'Lexical body JSON is required when body format is Lexical' : true),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    validation: (rule) =>
                      rule.required().custom((value) => {
                        if (typeof value !== 'string' || !value.trim()) return 'URL is required';
                        if (!/^(https?:\/\/|\/|#)/i.test(value)) {
                          return 'Use http(s), absolute path, or hash links';
                        }
                        if (/^(javascript:|data:)/i.test(value)) return 'Unsafe URL scheme';
                        return true;
                      }),
                  },
                ],
              },
            ],
          },
        }),
        defineArrayMember({ type: 'blogImageBlock' }),
        defineArrayMember({ type: 'twoColumn' }),
        defineArrayMember({ type: 'embedPlaceholder' }),
        defineArrayMember({ type: 'image', options: { hotspot: true }, fields: [
          {
            name: 'alt',
            type: 'string',
            title: 'Alternative text',
            validation: (rule) => rule.required().min(8).max(160),
          },
          {
            name: 'caption',
            type: 'string',
            title: 'Caption',
            validation: (rule) => rule.max(200),
          },
        ] }),
      ],
      hidden: ({ document }) => document?.bodyFormat === 'lexical' || document?.bodyFormat === 'html',
      validation: (rule) => rule.custom((value, context) => context.document?.bodyFormat === 'lexical' || context.document?.bodyFormat === 'html' ? true : Array.isArray(value) && value.length > 0 ? true : 'Body is required'),
    }),
    defineField({
      name: 'relatedPosts',
      title: 'Related posts',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'blogPost' }] })],
      validation: (rule) => rule.max(6),
    }),
    defineField({
      name: 'readingTimeMinutes',
      title: 'Reading time (minutes)',
      type: 'number',
      validation: (rule) => rule.min(1).max(60).integer(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
      media: 'cover',
    },
  },
  orderings: [
    {
      title: 'Published date, newest',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
});
