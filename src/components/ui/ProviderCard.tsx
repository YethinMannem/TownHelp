import type { HTMLAttributes } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ProviderCardProps extends HTMLAttributes<HTMLDivElement> {
  providerId: string
  name: string
  role: string
  rating: number
  reviewCount: number
  pricePerHour: number
  isVerified?: boolean
}

/** Five background colours cycling by first char code. */
const AVATAR_COLORS = [
  'bg-primary-fixed text-on-primary-fixed',
  'bg-secondary-fixed text-on-secondary-fixed',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-error-container text-on-error-container',
  'bg-[#cde5ff] text-[#073452]',
] as const

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('')
}

export function ProviderCard({
  providerId,
  name,
  role,
  rating,
  reviewCount,
  pricePerHour,
  isVerified = false,
  className,
  ...props
}: ProviderCardProps) {
  return (
    <Link href={`/provider/${providerId}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
      <div
        className={cn(
          'bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)] overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(27,28,27,0.10)] w-44',
          className
        )}
        {...props}
      >
        {/* Avatar area */}
        <div className="relative h-32">
          <div
            className={cn(
              'w-full h-full flex items-center justify-center text-3xl font-bold font-headline',
              getAvatarColor(name)
            )}
          >
            {getInitials(name)}
          </div>
          {/* Rating badge overlay */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-on-surface">
            <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-outline">({reviewCount})</span>
          </div>
        </div>

        {/* Info area */}
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-semibold text-sm text-on-surface font-body truncate">{name}</p>
            {isVerified && (
              <span className="text-primary text-xs">✓</span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant font-body truncate mb-2">{role}</p>
          <p className="text-sm font-semibold text-primary font-body">
            ₹{pricePerHour}
            <span className="text-xs text-on-surface-variant font-normal">/hr</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
