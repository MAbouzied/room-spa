import { defineArrayMember, defineField, defineType } from 'sanity';

export const twoColumn = defineType({
  name: 'twoColumn',
  title: 'Two columns',
  type: 'object',
  fields: [
    defineField({
      name: 'left',
      title: 'Left column',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'right',
      title: 'Right column',
      type: 'array',
      of: [defineArrayMember({ type: 'block' })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Two columns' }),
  },
});
