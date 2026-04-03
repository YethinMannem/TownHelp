import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type BadgeVariant =
  | 'verified'
  | 'pending'
  | 'confirmed'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  verified:
    'bg-primary-fixed text-on-primary-fixed',
  pending:
    'bg-[#fef3c7] text-[#92400e]',
  confirmed:
    'bg-tertiary-fixed text-on-tertiary-fixed',
  'in-progress':
    'bg-[#ede9fe] text-[#4c1d95]',
  completed:
    'bg-primary-fixed-dim text-on-primary-container',
  cancelled:
    'bg-error-container text-on-error-container',
  info:
    'bg-surface-container text-on-surface-variant',
}

export function Badge({ variant = 'info', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
