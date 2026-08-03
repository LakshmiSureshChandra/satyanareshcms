import { CalendarDays, Landmark, Receipt, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import type { ComplianceItem } from '@/lib/compliance'

const MAP = {
  receipt: Receipt,
  landmark: Landmark,
  trending: TrendingUp,
  shield: ShieldCheck,
  calendar: CalendarDays,
  users: Users,
} as const

export function ComplianceIcon({ icon, className }: { icon: ComplianceItem['icon']; className?: string }) {
  const Icon = MAP[icon] ?? Receipt
  return <Icon className={className} />
}
