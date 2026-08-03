import Link from 'next/link'
import type { CategoryNode } from '@/lib/api'

function flatten(nodes: CategoryNode[], depth = 0): (CategoryNode & { depth: number })[] {
  return nodes.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)])
}

export function Sidebar({ categories }: { categories: CategoryNode[] }) {
  const all = flatten(categories)
  return (
    <aside className="space-y-8">
      <div className="rounded-2xl border border-line bg-card p-6">
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">Categories</h4>
        <ul className="divide-y divide-line">
          {all.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:text-accent"
                style={c.depth > 0 ? { paddingLeft: c.depth * 14 } : undefined}
              >
                <span className="min-w-0 truncate">{c.name}</span>
                {c.postCount > 0 && (
                  <span className="shrink-0 rounded-full bg-paper-2 px-2 py-0.5 text-[11px] text-ink-soft">{c.postCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
