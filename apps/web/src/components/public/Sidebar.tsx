import Link from 'next/link'
import type { CategoryNode } from '@/lib/api'
import { chipColor } from './PostCard'

function flatten(nodes: CategoryNode[], depth = 0): (CategoryNode & { depth: number })[] {
  return nodes.flatMap((c) => [{ ...c, depth }, ...flatten(c.children, depth + 1)])
}

export function Sidebar({ categories }: { categories: CategoryNode[] }) {
  const all = flatten(categories)
  return (
    <aside className="space-y-8">
      <div className="rounded-3xl border border-line bg-white/60 p-6">
        <h4 className="section-title text-lg">విభాగాలు</h4>
        <div className="mt-4 flex flex-wrap gap-2">
          {all.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm font-semibold transition-all hover:border-transparent hover:bg-ink hover:text-paper"
            >
              <span className={`h-2 w-2 rounded-full ${chipColor(c.id)}`} />
              {c.name}
              {c.postCount > 0 && <span className="text-xs font-normal text-ink-soft group-hover:text-paper/60">{c.postCount}</span>}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
