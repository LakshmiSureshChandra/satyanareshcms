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

const MONTHS = [
  ['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'],
  ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'],
  ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December'],
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i)

export default async function PollsArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; year?: string; monthNum?: string; date?: string }>
}) {
  const { page = '1', year = '', monthNum = '', date = '' } = await searchParams
  const month = year && monthNum ? `${year}-${monthNum}` : ''
  const params = new URLSearchParams({ page })
  if (date) params.set('date', date)
  else if (month) params.set('month', month)
  const list = await api<PollList>(`/polls?${params}`, 300)

  const base = date ? `/polls?date=${date}` : month ? `/polls?year=${year}&monthNum=${monthNum}` : '/polls'

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

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-paper-2 p-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Month</label>
          <select name="monthNum" defaultValue={monthNum} className="rounded-md border border-line bg-white px-3 py-1.5 text-sm">
            <option value="">Any month</option>
            {MONTHS.map(([num, name]) => <option key={num} value={num}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Year</label>
          <select name="year" defaultValue={year} className="rounded-md border border-line bg-white px-3 py-1.5 text-sm">
            <option value="">Any year</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-soft">Day</label>
          <input type="date" name="date" defaultValue={date} className="rounded-md border border-line bg-white px-3 py-1.5 text-sm" />
        </div>
        <button className="rounded-md bg-accent px-5 py-1.5 text-sm font-semibold text-white hover:bg-accent-dark">Filter</button>
        {(month || date) && (
          <Link href="/polls" className="text-sm font-medium text-ink-soft hover:text-accent hover:underline">Clear</Link>
        )}
      </form>

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
        <Pagination page={list.page} pages={list.pages} base={base} />
      </div>
    </div>
  )
}
