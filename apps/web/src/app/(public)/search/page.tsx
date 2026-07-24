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
  const list = s.trim()
    ? await api<PostList>(`/posts?q=${encodeURIComponent(s)}&page=${page}`, false)
    : { posts: [], total: 0, page: 1, pages: 0 }

  return (
    <ListingPage
      title="Search Results"
      subtitle={s ? `Results for "${s}"` : 'Use the search bar above to find articles'}
      list={list}
      base={`/search?s=${encodeURIComponent(s)}`}
    />
  )
}
