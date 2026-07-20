/** Fallback settings when settings.json cannot be loaded */
export const DEFAULT_SETTINGS = {
  site: {
    name: 'Eagle Logistics',
    tagline: 'Delivering Excellence, Every Mile',
    description:
      'Ship with DHL, FedEx, and UPS through Eagle Logistics - trusted express partners for domestic and international delivery.',
  },
  header: {
    logo: '/assets/brand/logo.png',
    menuItems: [
      { path: '/', label: 'Home' },
      { path: '/services', label: 'Services' },
      { path: '/things-we-send', label: 'Things We Send' },
      { path: '/tracking', label: 'Shipment Tracker' },
      { path: '/offers', label: 'Special Offers' },
      { path: '/about', label: 'Why Eagle' },
      { path: '/contact', label: 'Contact Us' },
    ],
    ctaButton: {
      text: 'Price Calculator',
      url: '/pricing',
      enabled: true,
    },
  },
  footer: {
    description:
      'Ship with DHL, FedEx, and UPS - trusted express partners for reliable delivery.',
    quickLinks: [
      { path: '/pricing', label: 'Pricing Calculator' },
      { path: '/tracking', label: 'Track Parcel' },
      { path: '/services', label: 'Services' },
      { path: '/things-we-send', label: 'Things We Send' },
      { path: '/about', label: 'Why Eagle' },
    ],
    supportLinks: [
      { path: '/contact', label: 'Contact Us' },
      { path: '/privacy', label: 'Privacy Policy' },
      { path: '/terms', label: 'Terms of Service' },
    ],
  },
  contact: {
    address: 'Plot 42, Logistics Park, Gachibowli, Hyderabad, Telangana 500032',
    phone: '+91 40 4521 8900',
    whatsapp: '+919876543210',
    email: 'hello@eaglelogistics.in',
    hours: 'Mon-Sat: 9:00 AM - 7:00 PM',
    googleMapsUrl: 'https://maps.google.com/?q=Plot+42+Logistics+Park+Gachibowli+Hyderabad',
    googleMapsEmbed:
      '<iframe src="https://maps.google.com/maps?q=Gachibowli+Hyderabad+Telangana+500032&t=&z=14&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Eagle Logistics Gachibowli location"></iframe>',
  },
  social: {
    facebook:
      'https://www.facebook.com/pg/Eagle-Logistics-Express-Services-2039127956323457/posts/',
    twitter: 'https://twitter.com/EagleLogisticsE',
    linkedin: 'https://www.linkedin.com/in/eagle-logistics-and-express-services-b0081864/',
    youtube: 'https://www.youtube.com/channel/UCKkHKFcXeQsbhTUC6IsDc0g?view_as=subscriber',
    gmail: 'mailto:info@eaglelogistics.in',
    instagram: '',
  },
}
