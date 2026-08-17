export type FormLocale = 'ar' | 'en';

export const formCopy = {
  ar: {
    pageTitle: 'تواصل معنا - روم سبا',
    pageDescription:
      'تواصل مع روم سبا عبر واتساب، اعرف موقعنا، أو اسأل عن العروض مباشرة. روم سبا في حفر الباطن.',
    home: 'الرئيسية',
    contact: 'تواصل معنا',
    fullSite: 'الموقع الكامل',
    homeAria: 'العودة للصفحة الرئيسية — روم سبا',
    crumbsAria: 'مسار التنقل',
    langSwitchLabel: 'EN',
    langSwitchAria: 'Switch to English',
    locationEyebrow: 'موقعنا',
    locationTitle: 'زُرنا في أقرب فرع',
    follow: 'تابعنا:',
    address: 'العنوان',
    hours: 'ساعات العمل',
    phone: 'الهاتف',
    formAria: 'نموذج التواصل',
    phoneLabel: 'رقم الجوال',
    nameLabel: 'الاسم الكامل',
    serviceLabel: 'الخدمة المطلوبة',
    messageLabel: 'رسالتك (اختياري)',
    phonePlaceholder: '05xxxxxxxx',
    namePlaceholder: 'اكتب اسمك',
    servicePlaceholder: 'اختر ما ترغب في حجزه',
    messagePlaceholder: 'اكتب تفاصيل طلبك هنا...',
    servicesGroup: 'الخدمات',
    packagesGroup: 'الباقات',
    offersGroup: 'العروض',
    actionsAria: 'خيارات التواصل',
    whatsappAction: 'تواصل واتساب',
    callAction: 'اتصال',
    locationAction: 'الموقع',
    offersAction: 'العروض',
    submit: 'إرسال عبر واتساب',
    redirecting: 'جاري فتح واتساب...',
    invalid: 'يرجى التأكد من الاسم ورقم الجوال السعودي واختيار الخدمة.',
  },
  en: {
    pageTitle: 'Contact us - Room Spa',
    pageDescription:
      'Contact Room Spa on WhatsApp, see our location, or ask about offers. Room Spa in Hafr Al Batin.',
    home: 'Home',
    contact: 'Contact us',
    fullSite: 'Full website',
    homeAria: 'Back to the Room Spa homepage',
    crumbsAria: 'Breadcrumb',
    langSwitchLabel: 'AR',
    langSwitchAria: 'التبديل إلى العربية',
    locationEyebrow: 'Location',
    locationTitle: 'Visit our branch',
    follow: 'Follow us:',
    address: 'Address',
    hours: 'Hours',
    phone: 'Phone',
    formAria: 'Contact form',
    phoneLabel: 'Mobile number',
    nameLabel: 'Full name',
    serviceLabel: 'Requested service',
    messageLabel: 'Message (optional)',
    phonePlaceholder: '05xxxxxxxx',
    namePlaceholder: 'Your name',
    servicePlaceholder: 'Choose what you want to book',
    messagePlaceholder: 'Add any details here...',
    servicesGroup: 'Services',
    packagesGroup: 'Packages',
    offersGroup: 'Offers',
    actionsAria: 'Contact options',
    whatsappAction: 'WhatsApp',
    callAction: 'Call',
    locationAction: 'Location',
    offersAction: 'Offers',
    submit: 'Send on WhatsApp',
    redirecting: 'Opening WhatsApp...',
    invalid: 'Please check your name, Saudi mobile number, and selected service.',
  },
} as const;

export function switchFormPath(pathname: string): '/form' | '/en/form' {
  const path = pathname.replace(/\/$/, '') || '/';
  return path === '/en/form' ? '/form' : '/en/form';
}

export function isFormLocale(value: unknown): value is FormLocale {
  return value === 'ar' || value === 'en';
}
