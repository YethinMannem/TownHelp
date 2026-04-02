import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

export interface CategoryCardProps extends HTMLAttributes<HTMLDivElement> {
  slug: string
  label: string
  Icon: LucideIcon
  colorClasses: string
}

export function CategoryCard({ slug, label, Icon, colorClasses, className, ...props }: CategoryCardProps) {
  return (
    <Link
      href={`/browse?category=${slug}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border border-outline-variant/20 transition-transform duration-150 hover:-translate-y-0.5',
          colorClasses,
          className
        )}
        {...props}
      >
        <div className="w-10 h-10 flex items-center justify-center">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        <span className="text-sm font-semibold font-body text-center leading-tight">{label}</span>
      </div>
    </Link>
  )
}
