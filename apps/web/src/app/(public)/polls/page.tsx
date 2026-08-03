import Link from 'next/link'
import type { Metadata } from 'next'
import { api, type PollListItem } from '@/lib/api'
import { Pagination } from '@/components/public/Pagination'
import { formatDateTime } from '@/components/public/PostCard'
import { PageHeader } from '@/components/public/PageHeader'
import { Button } from '@/components/ui/button'
import { PollWidget } from '@/components/public/PollWidget'

export const revalidate = 300
export const metadata: Metadata = { title: 'Polls' }

type PollList = { polls: PollListItem[]; total: number; page: number; pages: number }

export default async function PollsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page = '1' } = await searchParams
  const list = await api<PollList>(`/polls?page=${page}`, 300)

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Polls"
        subtitle="What our readers think — vote on the live poll, or browse the results of past ones."
        crumbs={[{ label: 'Polls' }]}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <PollWidget showArchiveLink={false} />

        <h2 className="mb-4 mt-12 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
          Completed polls
        </h2>

        {list.polls.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line py-20 text-center">
            <p className="headline text-2xl text-ink-soft">No polls found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-2 text-left">
                  <th className="px-4 py-3 font-medium text-ink-soft">Date</th>
                  <th className="px-4 py-3 font-medium text-ink-soft">Poll</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.polls.map((p) => (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper-2">
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{formatDateTime(p.createdAt)}</td>
                    <td className="px-4 py-3 text-ink">{p.title}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/polls/${p.id}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={list.page} pages={list.pages} base="/polls" />
      </div>
    </>
  )
}
