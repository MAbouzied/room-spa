import { defineField, defineType } from 'sanity';

export const blogImage = defineType({
  name: 'blogImage',
  title: 'Blog image',
  type: 'image',
  options: {
    hotspot: true,
  },
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      validation: (rule) => rule.required().min(8).max(160),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      validation: (rule) => rule.max(200),
    }),
  ],
});
