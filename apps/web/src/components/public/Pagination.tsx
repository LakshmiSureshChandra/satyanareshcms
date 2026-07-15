import Link from 'next/link'

export function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null
  const sep = base.includes('?') ? '&' : '?'
  const href = (p: number) => `${base}${sep}page=${p}`
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2
  )

  return (
    <nav className="mt-12 flex items-center justify-center gap-2">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-paper">←</Link>
      )}
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && nums[i - 1] !== p - 1 && <span className="text-ink-soft">…</span>}
          <Link
            href={href(p)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${p === page ? 'bg-accent text-white' : 'border border-line hover:bg-ink hover:text-paper'}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-paper">→</Link>
      )}
    </nav>
  )
}
