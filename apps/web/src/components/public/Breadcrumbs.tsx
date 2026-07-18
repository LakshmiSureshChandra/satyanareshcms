import Link from 'next/link'

export type Crumb = { label: string; href?: string }

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

// Home is always prepended — callers just supply the trail after it.
export function Breadcrumbs({ items, className = 'mb-5' }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: 'Home', href: '/' }, ...items]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: `${SITE}${c.href ?? ''}`,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className={`flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-soft ${className}`}>
        {all.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span>›</span>}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="hover:text-accent">{c.label}</Link>
            ) : (
              <span className="text-ink">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
