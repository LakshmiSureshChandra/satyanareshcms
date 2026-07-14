import Link from 'next/link'
import type { CategoryNode } from '@/lib/api'

function CatList({ nodes, depth = 0 }: { nodes: CategoryNode[]; depth?: number }) {
  if (!nodes.length) return null
  return (
    <ul className={depth ? 'ml-4 mt-1 space-y-1' : 'space-y-1.5'}>
      {nodes.map((c) => (
        <li key={c.id}>
          <Link
            href={`/category/${c.slug}`}
            className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-paper-2 hover:text-accent"
          >
            <span>{c.name}</span>
            {c.postCount > 0 && <span className="text-xs text-ink-soft">({c.postCount})</span>}
          </Link>
          <CatList nodes={c.children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  )
}

export function Sidebar({ categories }: { categories: CategoryNode[] }) {
  return (
    <aside className="space-y-8">
      <div className="border border-line bg-white/50 p-5">
        <h4 className="rule-double headline pt-3 text-lg">విభాగాలు</h4>
        <div className="mt-4">
          <CatList nodes={categories} />
        </div>
      </div>
    </aside>
  )
}
