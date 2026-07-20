import Link from 'next/link'
import type { Metadata } from 'next'
import { api, type PollListItem } from '@/lib/api'
import { Pagination } from '@/components/public/Pagination'
import { formatDate } from '@/components/public/PostCard'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'
import { PollWidget } from '@/components/public/PollWidget'

export const revalidate = 300
export const metadata: Metadata = { title: 'Completed Polls' }

type PollList = { polls: PollListItem[]; total: number; page: number; pages: number }

export default async function PollsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  const list = await api<PollList>(`/polls?page=${page}`, 300)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Completed Polls' }]} />

      <div className="rise rounded-lg bg-ink px-6 py-8 text-paper md:px-10 md:py-10">
        <h1 className="headline text-3xl md:text-5xl">
          Completed Polls
          <span className="text-gold">.</span>
        </h1>
      </div>

      <div className="mt-6">
        <PollWidget showArchiveLink={false} />
      </div>

      <div className="mt-6">
        {list.polls.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No polls found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-2 text-left">
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Poll</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.polls.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 text-ink-soft">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3">{p.title}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/polls/${p.id}`} className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base="/polls" />
      </div>
    </div>
  )
}
