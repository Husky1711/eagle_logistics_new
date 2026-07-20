import {
  Calculator,
  Circle,
  Container,
  FileText,
  Globe,
  GraduationCap,
  HeartPulse,
  Home,
  IndianRupee,
  MapPin,
  Package,
  Plane,
  Search,
  Shield,
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
  Plane,
  Calculator,
  Shield,
  FileText,
  Home,
}

export function DynamicIcon({ name, size = 24, className = '' }) {
  const Icon = ICONS[name] || Circle
  return <Icon size={size} className={className} aria-hidden="true" />
}
