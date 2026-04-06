import * as React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline'
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:   'bg-[--primary]/20 text-[--primary]',
  secondary: 'bg-[--secondary] text-[--secondary-foreground]',
  outline:   'border border-[--border] text-[--foreground]',
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
