import {
  Circle,
  Container,
  Globe,
  GraduationCap,
  HeartPulse,
  IndianRupee,
  MapPin,
  Package,
  Search,
  Truck,
  UtensilsCrossed,
  Warehouse,
  Zap,
} from 'lucide-react'

const ICONS = {
  Package,
  Search,
  Truck,
  IndianRupee,
  Zap,
  MapPin,
  Globe,
  HeartPulse,
  UtensilsCrossed,
  GraduationCap,
  Container,
  Warehouse,
}

export function DynamicIcon({ name, size = 24, className = '' }) {
  const Icon = ICONS[name] || Circle
  return <Icon size={size} className={className} aria-hidden="true" />
}
