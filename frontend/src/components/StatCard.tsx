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
  blue: { icon: 'bg-[#66e24d] text-[#071108]', text: 'text-[#1d6f2f]', border: 'border-[#d9ecd9]' },
  green: { icon: 'bg-[#4fd33a] text-[#071108]', text: 'text-[#1c7f36]', border: 'border-[#d9ecd9]' },
  yellow: { icon: 'bg-[#c7f565] text-[#28340b]', text: 'text-[#557114]', border: 'border-[#e6f3c8]' },
  red: { icon: 'bg-[#ef4444] text-white', text: 'text-red-700', border: 'border-red-100' },
  purple: { icon: 'bg-[#173322] text-[#9ff08e]', text: 'text-[#1f8a3b]', border: 'border-[#d9ecd9]' },
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
