import * as React from 'react'
import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-2xl border border-line bg-card text-ink', className)}
      {...props}
    />
  )
}

/** Card that lifts and brightens its border on hover — for linked/interactive cards. */
function CardInteractive({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <Card
      className={cn(
        'transition-[transform,background-color,border-color] duration-250 hover:-translate-y-1 hover:border-accent-dark hover:bg-card-hover',
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-semibold leading-snug', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-sm leading-relaxed text-ink-2', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center p-6 pt-0', className)} {...props} />
}

export { Card, CardInteractive, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
