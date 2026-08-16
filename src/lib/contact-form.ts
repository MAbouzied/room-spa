import { offers } from '../data/offers.ts';
import { packages } from '../data/packages.ts';
import { serviceCategories } from '../data/services.ts';
import { site } from '../data/site.ts';

export type ContactBookingGroupId = 'service' | 'package' | 'offer';

export type ContactBookingOption = {
  value: string;
  label: string;
};

export type ContactBookingGroup = {
  id: ContactBookingGroupId;
  label: string;
  options: ContactBookingOption[];
};

const SAUDI_MOBILE = /^(?:\+?966|0)?5[0-9]{8}$/;

export function isSaudiMobile(value: string): boolean {
  return SAUDI_MOBILE.test(value.trim());
}

export function getContactBookingGroups(): ContactBookingGroup[] {
  return [
    {
      id: 'service',
      label: 'الخدمات',
      options: serviceCategories.flatMap((category) =>
        category.items.map((item) => ({
          value: `service:${item.id}`,
          label: item.name,
        })),
      ),
    },
    {
      id: 'package',
      label: 'الباقات',
      options: packages.map((item) => ({
        value: `package:${item.id}`,
        label: item.name,
      })),
    },
    {
      id: 'offer',
      label: 'العروض',
      options: offers.map((item) => ({
        value: `offer:${item.id}`,
        label: item.name,
      })),
    },
  ];
}

export function buildContactWhatsAppMessage(fields: {
  name: string;
  phone: string;
  bookingLabel: string;
  note?: string;
}): string {
  const lines = [
    `*الاسم:* ${fields.name}`,
    `*الجوال:* ${fields.phone}`,
    `*الحجز:* ${fields.bookingLabel}`,
  ];
  const note = fields.note?.trim();
  if (note) lines.push(`*ملاحظات:* ${note}`);
  return lines.join('\n');
}

export function buildContactWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
