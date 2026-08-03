import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// Pill-shaped by default — the reference design's signature control shape.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-accent-dark text-on-accent hover:opacity-90',
        outline: 'border border-line text-ink-2 hover:border-ink-soft hover:text-ink',
        secondary: 'bg-paper-2 text-ink hover:bg-card-hover',
        ghost: 'text-ink-2 hover:bg-paper-2 hover:text-ink',
        destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-[18px] py-2.5',
        sm: 'h-9 gap-1.5 px-4 text-[13px]',
        lg: 'h-12 px-[26px] text-[15px]',
        icon: 'size-10 rounded-full',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
