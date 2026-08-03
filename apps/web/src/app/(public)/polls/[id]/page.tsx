import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type Poll } from '@/lib/api'
import { PageHeader } from '@/components/public/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const revalidate = 3600

async function getPoll(id: string) {
  try {
    return await api<Poll>(`/polls/${encodeURIComponent(id)}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const poll = await getPoll(id)
  return poll ? { title: poll.title } : {}
}

export default async function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const poll = await getPoll(id)
  if (!poll) notFound()

  return (
    <>
      <PageHeader
        eyebrow="Poll results"
        title={poll.title}
        crumbs={[{ label: 'Polls', href: '/polls' }, { label: poll.title }]}
      />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <section className="rounded-2xl border border-line bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft">
              {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'} cast
            </p>
            {poll.closed && <Badge variant="muted">Closed — results only</Badge>}
          </div>

          <div className="mt-6 space-y-4">
            {poll.options.map((o) => {
              const pct = poll.totalVotes > 0 ? Math.round((o.votes / poll.totalVotes) * 100) : 0
              return (
                <div key={o.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-ink">{o.text}</p>
                    <span className="shrink-0 text-sm font-semibold text-accent">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-paper-2">
                    <div className="h-full rounded-full bg-accent-dark transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <Button asChild variant="outline" className="mt-8">
          <Link href="/polls">← Back to all polls</Link>
        </Button>
      </div>
    </>
  )
}
