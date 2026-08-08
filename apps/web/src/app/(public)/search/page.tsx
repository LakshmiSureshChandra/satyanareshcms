import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { ListingPage, type PostList } from '@/components/public/ListingPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Search' }

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string; page?: string }>
}) {
  const { s = '', page = '1' } = await searchParams
  // no query = "browse all" rather than an empty search — the homepage's
  // "Browse all" link points here with nothing typed, and a bare search page
  // showing zero results looked like a bug ("No articles found") rather than
  // the full article list a visitor expects
  const list = await api<PostList>(
    s.trim() ? `/posts?q=${encodeURIComponent(s)}&page=${page}` : `/posts?page=${page}`,
    false
  )

  return (
    <ListingPage
      title={s ? 'Search Results' : 'All Articles'}
      subtitle={s ? `Results for "${s}"` : undefined}
      list={list}
      base={`/search?s=${encodeURIComponent(s)}`}
    />
  )
}
