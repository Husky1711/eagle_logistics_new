import fs from 'fs'
import path from 'path'

/** Descriptions kept in the 150–158 SERP sweet spot */
const pages = {
  'home.json': {
    title: 'Bangalore Courier & International Shipping | Eagle Logistics',
    description:
      'Bangalore courier for domestic and international parcels to the USA, UK, EU and Middle East. Doorstep pickup, tracked delivery with DHL, FedEx and UPS.',
    image: '/assets/home/international.jpg',
    imageAlt: 'International courier and cargo from Eagle Logistics Bangalore',
  },
  'about.json': {
    title: 'About Eagle Logistics | Bangalore Courier Since 2010',
    description:
      'Eagle Logistics since 2010 in Bangalore offers door-to-door courier and cargo across India and worldwide, with tracked delivery and trusted express partners.',
    image: '/assets/pages/about-hero.jpg',
    imageAlt: 'About Eagle Logistics Bangalore courier company',
  },
  'services.json': {
    title: 'Courier & Cargo Services | Eagle Logistics Bangalore',
    description:
      'Domestic express, international courier, air and surface cargo, student document delivery and full logistics solutions from Eagle Logistics in Bangalore.',
    image: '/assets/pages/services-hero.jpg',
    imageAlt: 'Eagle Logistics domestic and international courier services',
  },
  'pricing.json': {
    title: 'Shipping Price Calculator | Eagle Logistics Bangalore',
    description:
      'Compare sample DHL, FedEx and UPS shipping rates by weight and destination. Get Bangalore courier quotes from Eagle Logistics and confirm on WhatsApp.',
    image: '/assets/brand/logo.png',
    imageAlt: 'Eagle Logistics shipping price calculator',
  },
  'tracking.json': {
    title: 'Track Courier Shipment | Eagle Logistics Bangalore',
    description:
      'Track your Eagle Logistics shipment with DHL, FedEx or UPS. Enter your tracking number for live partner status updates from our Bangalore courier desk.',
    image: '/assets/pages/tracking-hero.jpg',
    imageAlt: 'Track shipment with Eagle Logistics Bangalore',
  },
  'contact.json': {
    title: 'Contact Eagle Logistics | Bangalore Courier Office',
    description:
      'Contact Eagle Logistics in Sampangi Rama Nagar, Bangalore. Call, email or WhatsApp for help with domestic and international courier and cargo shipping.',
    image: '/assets/brand/logo.png',
    imageAlt: 'Contact Eagle Logistics Bangalore office',
  },
  'offers.json': {
    title: 'Courier Offers & Student Rates | Eagle Logistics',
    description:
      'Festive parcel offers, international shipping discounts and special student courier rates for university applications from Eagle Logistics in Bangalore.',
    image: '/assets/pages/special-offers-hero.png',
    imageAlt: 'Special courier offers from Eagle Logistics',
  },
  'privacy.json': {
    title: 'Privacy Policy | Eagle Logistics Bangalore',
    description:
      'Learn how Eagle Logistics collects, uses and protects your contact and shipment details on our Bangalore website, WhatsApp and courier enquiry channels.',
    image: '/assets/brand/logo.png',
    imageAlt: 'Eagle Logistics privacy policy',
  },
  'terms.json': {
    title: 'Terms of Service | Eagle Logistics Bangalore',
    description:
      'Read the terms for using the Eagle Logistics website and shipping mediation services in Bangalore, including quotes, tracking, offers and partner liability.',
    image: '/assets/brand/logo.png',
    imageAlt: 'Eagle Logistics terms of service',
  },
  'cargo.json': {
    title: 'Air Sea & Surface Cargo | Eagle Logistics Bangalore',
    description:
      'Air, sea and surface cargo from Bangalore with fast air logistics, FCL and LCL ocean freight, and reliable domestic road transport from Eagle Logistics.',
    image: '/assets/home/air-cargo.jpg',
    imageAlt: 'Eagle Logistics air sea and surface cargo services',
  },
  'things-we-send.json': {
    title: 'Items We Ship Abroad | Eagle Logistics Bangalore',
    description:
      'Ship books, clothes, footwear, medicines, photos, spices, sweets and electronics from Bangalore to destinations worldwide with Eagle Logistics tracking.',
    image: '/assets/things-we-send/popular-items-banner.jpg',
    imageAlt: 'Popular items Eagle Logistics ships from Bangalore',
  },
}

const cargoItems = {
  air: {
    title: 'Air Cargo Services | Eagle Logistics Bangalore',
    description:
      'When speed matters, book air cargo from Bangalore. Fast uplift, multimodal links across India and careful handling for time-critical Eagle Logistics freight.',
    image: '/assets/home/air-cargo.jpg',
    imageAlt: 'Air cargo services from Eagle Logistics Bangalore',
  },
  sea: {
    title: 'Sea Cargo & Ocean Freight | Eagle Logistics Bangalore',
    description:
      'Scale shipments with FCL or LCL ocean freight. Sea cargo from Bangalore for commercial goods, sweets, medicines, clothes and books via Eagle Logistics.',
    image: '/assets/home/sea-cargo.jpg',
    imageAlt: 'Sea cargo and ocean freight from Eagle Logistics',
  },
  surface: {
    title: 'Surface Cargo & Road Freight | Eagle Logistics Bangalore',
    description:
      'Move bulk consignments across India by road. Surface cargo from Bangalore with damage-aware packing and dependable domestic transit from Eagle Logistics.',
    image: '/assets/home/surface-cargo.jpg',
    imageAlt: 'Surface cargo and road freight from Eagle Logistics',
  },
}

const itemMetas = {
  books: {
    title: 'Ship Books Abroad from Bangalore | Eagle Logistics',
    description:
      'Need textbooks or novels overseas? Eagle Logistics ships books from Bangalore with piece-count checks, secure packing and tracked DHL, FedEx or UPS delivery.',
    image: '/assets/things-we-send/books.jpg',
    imageAlt: 'Ship books abroad with Eagle Logistics',
  },
  clothes: {
    title: 'Ship Clothes Abroad from Bangalore | Eagle Logistics',
    description:
      'Moving wardrobes or gifting apparel abroad? Ship clothes from Bangalore with garment-friendly packing, customs help and tracked international courier service.',
    image: '/assets/things-we-send/clothes.jpg',
    imageAlt: 'Ship clothes abroad with Eagle Logistics',
  },
  footwear: {
    title: 'Ship Footwear Abroad from Bangalore | Eagle Logistics',
    description:
      'From sneakers to formal shoes, ship footwear abroad from Bangalore in carton-ready packs with live international tracking via Eagle Logistics partners.',
    image: '/assets/things-we-send/footwear.jpg',
    imageAlt: 'Ship footwear abroad with Eagle Logistics',
  },
  medicines: {
    title: 'Ship Medicines Abroad from Bangalore | Eagle Logistics',
    description:
      'Courier medicines from Bangalore with paperwork guidance, secure packing and tracked pharmaceutical logistics handled by Eagle Logistics India specialists.',
    image: '/assets/things-we-send/medicines.jpg',
    imageAlt: 'Ship medicines abroad with Eagle Logistics',
  },
  photos: {
    title: 'Ship Photos & Albums Abroad | Eagle Logistics Bangalore',
    description:
      'Protect framed prints and albums in transit. Ship photos abroad from Bangalore with cushioned packing and tracked international courier from Eagle Logistics.',
    image: '/assets/things-we-send/photos.jpg',
    imageAlt: 'Ship photos and albums with Eagle Logistics',
  },
  spices: {
    title: 'Ship Spices Abroad from Bangalore | Eagle Logistics',
    description:
      'Share Indian spices and herbs with family worldwide. Sealed packs from Bangalore, gentle handling and tracked international delivery via Eagle Logistics.',
    image: '/assets/things-we-send/spices.jpg',
    imageAlt: 'Ship spices abroad with Eagle Logistics',
  },
  sweets: {
    title: 'Ship Sweets Abroad from Bangalore | Eagle Logistics',
    description:
      'Festival mithai for family abroad? Ship homemade sweets from Bangalore with hygiene-first packing, careful handling and tracked international delivery.',
    image: '/assets/things-we-send/sweets.jpg',
    imageAlt: 'Ship sweets abroad with Eagle Logistics',
  },
  electronics: {
    title: 'Ship Electronics Abroad from Bangalore | Eagle Logistics',
    description:
      'Ship phones, gadgets and accessories from Bangalore with shock-aware packing, careful handling and tracked international courier from Eagle Logistics.',
    image: '/assets/things-we-send/electronics.jpg',
    imageAlt: 'Ship electronics abroad with Eagle Logistics',
  },
}

function assertLen(label, text, min = 150, max = 158) {
  const n = text.length
  const mark = n >= min && n <= max ? 'OK ' : 'CHK'
  console.log(`${mark} ${String(n).padStart(3)} ${label}`)
  if (n < min || n > max) process.exitCode = 1
}

for (const [file, meta] of Object.entries(pages)) {
  const p = path.join('content/pages', file)
  const j = JSON.parse(fs.readFileSync(p, 'utf8'))
  const { keywords: _drop, ...prev } = j.meta || {}
  j.meta = { ...prev, ...meta }
  delete j.meta.keywords
  assertLen(file + ' desc', j.meta.description)
  assertLen(file + ' title', j.meta.title, 40, 65)

  if (file === 'cargo.json') {
    for (const item of j.content.items) {
      if (cargoItems[item.slug]) {
        const { keywords: _k, ...prevItem } = item.meta || {}
        item.meta = { ...prevItem, ...cargoItems[item.slug] }
        delete item.meta.keywords
        assertLen(item.slug + ' desc', item.meta.description)
      }
    }
  }
  if (file === 'things-we-send.json') {
    for (const item of j.content.items) {
      if (itemMetas[item.slug]) {
        const { keywords: _k, ...prevItem } = item.meta || {}
        item.meta = { ...prevItem, ...itemMetas[item.slug] }
        delete item.meta.keywords
        assertLen(item.slug + ' desc', item.meta.description)
      }
    }
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n')
}

console.log('done')
