import { defineField, defineType } from 'sanity';

export const blogSeo = defineType({
  name: 'blogSeo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'SEO title',
      type: 'string',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'description',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.max(180),
    }),
  ],
});
