import { defineField, defineType } from 'sanity';

export const blogImageBlock = defineType({
  name: 'blogImageBlock',
  title: 'Inline image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'blogImage',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'image.alt', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Inline image',
      media,
    }),
  },
});
