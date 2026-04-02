import { cn } from '@/lib/cn'

export type CardVariant = 'default' | 'elevated' | 'flat'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
}

const variantClasses: Record<CardVariant, string> = {
  default:
    'bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-[0_2px_8px_rgba(27,28,27,0.06)]',
  elevated:
    'bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-[0_4px_16px_rgba(27,28,27,0.10)]',
  flat: 'bg-surface-container rounded-2xl border border-outline-variant/30',
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
}
