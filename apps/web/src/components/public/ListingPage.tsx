import { api, type CategoryNode, type PostCard as PostCardType } from '@/lib/api'
import { PostCard } from './PostCard'
import { Pagination } from './Pagination'
import { Sidebar } from './Sidebar'
import { PageHeader } from './PageHeader'
import { type Crumb } from './Breadcrumbs'

export type PostList = { posts: PostCardType[]; total: number; page: number; pages: number }

// Shared shell for category / tag / search listing pages.
export async function ListingPage({
  title,
  subtitle,
  list,
  base,
  crumbs = [],
}: {
  title: string
  subtitle?: string
  list: PostList
  base: string
  crumbs?: Crumb[]
}) {
  const categories = await api<CategoryNode[]>('/categories', 300)

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} crumbs={[...crumbs, { label: title }]} />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {list.posts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line py-20 text-center">
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
    </>
  )
}
