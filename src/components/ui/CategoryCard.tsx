import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

export interface CategoryCardProps {
  slug: string
  label: string
  Icon: LucideIcon
  colorClasses: string
  className?: string
}

export function CategoryCard({ slug, label, Icon, colorClasses, className }: CategoryCardProps) {
  return (
    <Link
      href={`/browse?category=${slug}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-2xl transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]',
          colorClasses,
          className
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <span className="text-xs font-semibold font-body text-center leading-tight">{label}</span>
      </div>
    </Link>
  )
}
