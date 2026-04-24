import Link from 'next/link'
import { Star, BadgeCheck, Briefcase, MapPin } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatDistance } from '@/lib/geo'

export interface ProviderCardProps {
  providerId: string
  name: string
  role: string
  rating: number
  reviewCount: number
  pricePerHour: number
  isVerified?: boolean
  completedBookings?: number
  rateType?: string | null
  distanceKm?: number
  className?: string
}

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

function rateLabel(rateType?: string | null): string {
  switch (rateType) {
    case 'HOURLY': return '/hr'
    case 'PER_VISIT': return '/visit'
    case 'PER_KG': return '/kg'
    case 'FIXED': return ' flat'
    default: return '/hr'
  }
}

export function ProviderCard({
  providerId,
  name,
  role,
  rating,
  reviewCount,
  pricePerHour,
  isVerified = false,
  completedBookings,
  rateType,
  distanceKm,
  className,
}: ProviderCardProps) {
  const isNew = reviewCount < 3 && (completedBookings ?? 0) < 5

  return (
    <Link
      href={`/provider/${providerId}`}
      className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div
        className={cn(
          'w-full min-w-0 bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
          className
        )}
      >
        {/* Avatar area */}
        <div className="relative h-28">
          <div
            className={cn(
              'w-full h-full flex items-center justify-center text-2xl font-bold font-headline',
              getAvatarColor(name)
            )}
          >
            {getInitials(name)}
          </div>
          {/* Rating pill */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[11px] font-semibold text-on-surface shadow-sm">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-on-surface-variant">({reviewCount})</span>
          </div>
          {isNew && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-tertiary-fixed text-on-tertiary-fixed">
              New
            </div>
          )}
          {isVerified && (
            <div className="absolute top-2 right-2">
              <BadgeCheck className="w-5 h-5 text-primary drop-shadow-sm" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-0.5 min-w-0">
          <p className="font-semibold text-sm text-on-surface font-body truncate">{name}</p>
          <p className="text-[11px] text-on-surface-variant font-body line-clamp-2 break-words">{role}</p>
          {(completedBookings ?? 0) > 0 && (
            <p className="text-[11px] text-on-surface-variant font-body flex items-center gap-0.5">
              <Briefcase className="w-3 h-3" />
              {completedBookings} jobs done
            </p>
          )}
          {distanceKm !== undefined && (
            <p className="text-[11px] text-on-surface-variant font-body flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {formatDistance(distanceKm)}
            </p>
          )}
          <p className="text-sm font-bold text-primary font-body pt-1">
            ₹{pricePerHour}
            <span className="text-[11px] text-on-surface-variant font-normal">{rateLabel(rateType)}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
