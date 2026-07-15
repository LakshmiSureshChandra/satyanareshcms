import { api, type CategoryNode, type PostCard as PostCardType } from '@/lib/api'
import { PostCard } from './PostCard'
import { Pagination } from './Pagination'
import { Sidebar } from './Sidebar'

export type PostList = { posts: PostCardType[]; total: number; page: number; pages: number }

// Shared shell for category / tag / search listing pages.
export async function ListingPage({
  title,
  subtitle,
  list,
  base,
}: {
  title: string
  subtitle?: string
  list: PostList
  base: string
}) {
  const categories = await api<CategoryNode[]>('/categories', 300)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* page banner */}
      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          {title}
          <span className="text-gold">.</span>
        </h1>
        {subtitle && <p className="mt-2 text-sm text-paper/60">{subtitle}</p>}
      </div>

      <div className="mt-9 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {list.posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-20 text-center">
              <p className="headline text-2xl text-ink-soft">No articles found</p>
              <p className="mt-1 text-sm text-ink-soft">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2">
              {list.posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
          <Pagination page={list.page} pages={list.pages} base={base} />
        </div>
        <Sidebar categories={categories} />
      </div>
    </div>
  )
}
