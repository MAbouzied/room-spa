import { defineField, defineType } from 'sanity';

export const embedPlaceholder = defineType({
  name: 'embedPlaceholder',
  title: 'Embed placeholder',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      initialValue: 'محتوى مضمّن قريباً',
      validation: (rule) => rule.required().max(120),
    }),
  ],
  preview: {
    select: { title: 'label' },
  },
});
