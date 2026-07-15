import Link from 'next/link'
import type { CategoryNode } from '@/lib/api'

function flatten(nodes: CategoryNode[], depth = 0): (CategoryNode & { depth: number })[] {
  return nodes.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)])
}

export function Sidebar({ categories }: { categories: CategoryNode[] }) {
  const all = flatten(categories)
  return (
    <aside className="space-y-8">
      <div className="rounded-lg border border-line bg-white/60 p-6">
        <h4 className="section-title text-lg">విభాగాలు</h4>
        <ul className="mt-1 divide-y divide-line">
          {all.map((c) => (
            <li key={c.id}>
              <Link
                href={`/category/${c.slug}`}
                className="flex items-center justify-between py-2.5 text-sm font-medium transition-colors hover:text-accent"
                style={c.depth > 0 ? { paddingLeft: c.depth * 14 } : undefined}
              >
                {c.name}
                {c.postCount > 0 && <span className="text-xs text-ink-soft">{c.postCount}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
