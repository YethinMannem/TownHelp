'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-on-surface-variant font-body"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-base font-body text-on-surface placeholder:text-outline bg-surface-container-lowest transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
            error
              ? 'border-error focus:ring-error focus:border-error'
              : 'border-outline-variant',
            'disabled:bg-surface-container disabled:text-on-surface-variant disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error font-body">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-on-surface-variant font-body">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
