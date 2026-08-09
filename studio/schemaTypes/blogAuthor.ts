import { defineField, defineType } from 'sanity';

export const blogAuthor = defineType({
  name: 'blogAuthor',
  title: 'Blog author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      validation: (rule) => rule.max(80),
    }),
    defineField({
      name: 'image',
      title: 'Portrait',
      type: 'blogImage',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
});
