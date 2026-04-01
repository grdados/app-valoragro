import { cn } from '../lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: { value: number; label: string }
}

const colorMap = {
  blue: { bg: 'bg-blue-50', icon: 'bg-[#1B4F8C] text-white', text: 'text-[#1B4F8C]', border: 'border-blue-100' },
  green: { bg: 'bg-emerald-50', icon: 'bg-emerald-600 text-white', text: 'text-emerald-700', border: 'border-emerald-100' },
  yellow: { bg: 'bg-amber-50', icon: 'bg-amber-500 text-white', text: 'text-amber-700', border: 'border-amber-100' },
  red: { bg: 'bg-red-50', icon: 'bg-red-600 text-white', text: 'text-red-700', border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', icon: 'bg-purple-600 text-white', text: 'text-purple-700', border: 'border-purple-100' },
}

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('card p-6 flex items-start gap-4 border', colors.border)}>
      <div className={cn('p-3 rounded-xl flex-shrink-0', colors.icon)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={cn('text-2xl font-bold mt-1', colors.text)}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium mt-1', trend.value >= 0 ? 'text-emerald-600' : 'text-red-600')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
    </div>
  )
}
