import * as LucideIcons from 'lucide-react'

export function DynamicIcon({ name, size = 24, className = '' }) {
  const Icon = LucideIcons[name] || LucideIcons.Circle
  return <Icon size={size} className={className} />
}
