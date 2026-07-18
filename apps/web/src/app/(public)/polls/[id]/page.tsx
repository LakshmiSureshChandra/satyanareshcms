import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, NotFoundError, type Poll } from '@/lib/api'

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="headline text-2xl md:text-3xl">Polls</h1>
        <Link href="/polls" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
          Back
        </Link>
      </div>

      <section className="rounded-lg border border-line bg-white p-6 shadow-sm md:p-8">
        <h2 className="headline text-xl leading-snug md:text-2xl">Poll: {poll.title}</h2>

        <div className="mt-6">
          <p className="text-sm text-ink-soft">Total votes: {poll.totalVotes}</p>
          {poll.options.map((o) => {
            const pct = poll.totalVotes > 0 ? Math.round((o.votes / poll.totalVotes) * 100) : 0
            return (
              <div key={o.id} className="mt-3">
                <p className="text-sm font-medium">{o.text}</p>
                <div className="mt-1 h-6 w-full overflow-hidden rounded-full bg-paper-2">
                  <div
                    className="flex h-full items-center justify-center rounded-full bg-accent text-xs font-semibold text-white"
                    style={{ width: `${pct}%` }}
                  >
                    {pct > 8 && `${pct}%`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
