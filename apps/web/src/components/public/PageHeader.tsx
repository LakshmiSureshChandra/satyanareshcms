import { Breadcrumbs, type Crumb } from './Breadcrumbs'

/**
 * The standard banner every non-home public page opens with: blueprint grid,
 * a soft accent bloom, breadcrumbs, then the title. Replaces the old inverted
 * `bg-ink text-paper` slab, which flipped to a glaring white block whenever the
 * site was on a dark theme.
 */
export function PageHeader({
  title,
  eyebrow,
  subtitle,
  crumbs,
  children,
}: {
  title: React.ReactNode
  eyebrow?: string
  subtitle?: React.ReactNode
  crumbs?: Crumb[]
  children?: React.ReactNode
}) {
  return (
    <section className="grid-bg relative overflow-hidden border-b border-line">
      <div className="glow -right-24 -top-40 size-[420px]" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        {crumbs && <Breadcrumbs items={crumbs} />}
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="headline mt-3 text-3xl sm:text-4xl md:text-[2.75rem]">
          {title}
          <span className="text-accent">.</span>
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl leading-relaxed text-ink-2">{subtitle}</p>}
        {children}
      </div>
    </section>
  )
}
