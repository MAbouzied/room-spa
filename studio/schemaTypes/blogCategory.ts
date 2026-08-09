import { defineField, defineType } from 'sanity';

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const blogCategory = defineType({
  name: 'blogCategory',
  title: 'Blog category',
  type: 'document',
  fields: [
    defineField({
      name: 'categoryId',
      title: 'Stable ID',
      type: 'slug',
      options: { source: 'label', maxLength: 64 },
      validation: (rule) =>
        rule.required().custom((value) => {
          const current = value?.current;
          if (!current) return 'Category ID is required';
          if (!kebabCase.test(current)) return 'Use ASCII kebab-case (e.g. dental-care)';
          return true;
        }),
    }),
    defineField({
      name: 'label',
      title: 'Arabic label',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(60),
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'categoryId.current' },
  },
});
