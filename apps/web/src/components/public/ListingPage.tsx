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
      <div className="rule-double pt-3">
        <h1 className="headline text-2xl md:text-3xl">
          {title}
          <span className="text-accent">.</span>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {list.posts.length === 0 ? (
            <p className="py-16 text-center text-ink-soft">వార్తలు కనబడలేదు.</p>
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
