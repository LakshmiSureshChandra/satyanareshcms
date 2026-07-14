import type { Metadata } from 'next'
import { api } from '@/lib/api'
import { ListingPage, type PostList } from '@/components/public/ListingPage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'వెతకండి' }

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
      title="వెతుకులాట ఫలితాలు"
      subtitle={s ? `"${s}" కోసం ${list.total} ఫలితాలు` : 'వెతకడానికి పై సెర్చ్ ఉపయోగించండి'}
      list={list}
      base={`/search?s=${encodeURIComponent(s)}`}
    />
  )
}
