import { offers } from '../data/offers.ts';
import { packages } from '../data/packages.ts';
import { serviceCategories } from '../data/services.ts';
import { site } from '../data/site.ts';
import { formCopy, type FormLocale } from './form-copy.ts';

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

export function getContactBookingGroups(locale: FormLocale = 'ar'): ContactBookingGroup[] {
  const copy = formCopy[locale];
  return [
    {
      id: 'service',
      label: copy.servicesGroup,
      options: serviceCategories.flatMap((category) =>
        category.items.map((item) => ({
          value: `service:${item.id}`,
          label: item.name,
        })),
      ),
    },
    {
      id: 'package',
      label: copy.packagesGroup,
      options: packages.map((item) => ({
        value: `package:${item.id}`,
        label: item.name,
      })),
    },
    {
      id: 'offer',
      label: copy.offersGroup,
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
  locale?: FormLocale;
}): string {
  const locale = fields.locale === 'en' ? 'en' : 'ar';
  const lines =
    locale === 'en'
      ? [`*Name:* ${fields.name}`, `*Phone:* ${fields.phone}`, `*Booking:* ${fields.bookingLabel}`]
      : [`*الاسم:* ${fields.name}`, `*الجوال:* ${fields.phone}`, `*الحجز:* ${fields.bookingLabel}`];
  const note = fields.note?.trim();
  if (note) lines.push(locale === 'en' ? `*Notes:* ${note}` : `*ملاحظات:* ${note}`);
  return lines.join('\n');
}

export function buildContactWhatsAppUrl(message: string): string {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function buildOffersWhatsAppMessage(locale: FormLocale = 'ar'): string {
  return locale === 'en'
    ? 'Hello, I would like to see Room Spa offers'
    : 'مرحبا، أرغب بالاطلاع على عروض روم سبا';
}

export function buildOffersWhatsAppUrl(locale: FormLocale = 'ar'): string {
  return buildContactWhatsAppUrl(buildOffersWhatsAppMessage(locale));
}
