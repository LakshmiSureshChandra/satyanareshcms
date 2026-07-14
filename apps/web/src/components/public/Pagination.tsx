import Link from 'next/link'

export function Pagination({ page, pages, base }: { page: number; pages: number; base: string }) {
  if (pages <= 1) return null
  const sep = base.includes('?') ? '&' : '?'
  const href = (p: number) => `${base}${sep}page=${p}`
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2
  )

  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded border border-line px-3 py-1.5 text-sm hover:bg-paper-2">←</Link>
      )}
      {nums.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && nums[i - 1] !== p - 1 && <span className="text-ink-soft">…</span>}
          <Link
            href={href(p)}
            className={`rounded px-3 py-1.5 text-sm ${p === page ? 'bg-ink font-bold text-paper' : 'border border-line hover:bg-paper-2'}`}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pages && (
        <Link href={href(page + 1)} className="rounded border border-line px-3 py-1.5 text-sm hover:bg-paper-2">→</Link>
      )}
    </nav>
  )
}
