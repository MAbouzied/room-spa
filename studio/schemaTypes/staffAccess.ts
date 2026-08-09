import { defineField, defineType } from 'sanity';

export const staffAccess = defineType({
  name: 'staffAccess',
  title: 'Staff access',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Approved email',
      type: 'string',
      validation: (Rule) => Rule.required().email().custom((value) => {
        if (typeof value !== 'string') return true;
        return value === value.trim().toLowerCase()
          || 'Use a trimmed, lowercase email address.';
      }),
    }),
    defineField({
      name: 'name',
      title: 'Google profile name',
      type: 'string',
      readOnly: true,
      description: 'Set automatically from the verified Google profile after a successful sign-in.',
    }),
    defineField({
      name: 'image',
      title: 'Google profile image',
      type: 'url',
      readOnly: true,
      description: 'Set automatically from the verified Google profile after a successful sign-in.',
    }),
  ],
});
