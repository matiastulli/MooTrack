import { cn } from '../../lib/utils'

function Badge({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80': variant === 'default',
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80': variant === 'destructive',
          'text-foreground border-border bg-transparent': variant === 'outline',
        },
        {
          'px-3 py-1 text-sm': size === 'default',
          'px-4 py-2 text-base': size === 'lg',
          'px-2 py-0.5 text-xs': size === 'sm',
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }

