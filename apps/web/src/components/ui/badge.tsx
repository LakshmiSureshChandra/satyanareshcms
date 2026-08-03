import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3",
  {
    variants: {
      variant: {
        default: 'border-badge-border bg-badge-bg text-accent',
        outline: 'border-line text-ink-2',
        solid: 'border-transparent bg-accent-dark text-on-accent',
        muted: 'border-transparent bg-paper-2 text-ink-soft',
      },
      size: {
        default: 'px-3 py-1 text-xs',
        // the reference's hero pill: uppercase, wide-tracked, small-caps
        eyebrow: 'px-3.5 py-1.5 text-[11px] uppercase tracking-[0.12em]',
        sm: 'px-2 py-0.5 text-[11px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant, size, className }))} {...props} />
}

export { Badge, badgeVariants }
