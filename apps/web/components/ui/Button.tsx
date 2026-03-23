import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
  destructive:
    'bg-destructive text-destructive-foreground hover:opacity-90 shadow-sm',
  outline:
    'border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm',
  ghost:
    'hover:bg-accent hover:text-accent-foreground',
  link:
    'text-primary underline-offset-4 hover:underline',
}

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm:   'h-8 rounded-md px-3 text-xs',
  md:   'h-9 rounded-md px-4 py-2 text-sm',
  lg:   'h-10 rounded-md px-6 text-base',
  icon: 'h-9 w-9 rounded-md',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
