import Link from 'next/link'

export function Pagination({ page, pages, base, className = 'mt-12' }: { page: number; pages: number; base: string; className?: string }) {
  if (pages <= 1) return null
  const sep = base.includes('?') ? '&' : '?'
  const href = (p: number) => `${base}${sep}page=${p}`
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2
  )

  return (
    <nav className={`flex items-center justify-center gap-2 ${className}`}>
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-md border border-line px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent">←</Link>
      )}
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && nums[i - 1] !== p - 1 && <span className="text-ink-soft">…</span>}
          <Link
            href={href(p)}
            className={`rounded-md px-3.5 py-2 text-sm font-medium transition-colors ${p === page ? 'bg-ink text-paper' : 'border border-line hover:border-accent hover:text-accent'}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-md border border-line px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent">→</Link>
      )}
    </nav>
  )
}
