import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { api, type PostCard as PostCardType, type PollListItem, type Settings } from '@/lib/api'
import { PostCard, PostRow, formatDateTime } from '@/components/public/PostCard'
import { PollWidget } from '@/components/public/PollWidget'
import { HeroSlider } from '@/components/public/HeroSlider'
import { Reveal } from '@/components/public/Reveal'
import { Hero } from '@/components/public/home/Hero'
import { TrustStats } from '@/components/public/home/TrustStats'
import { ComplianceTicker } from '@/components/public/home/ComplianceTicker'
import { ServicesBento } from '@/components/public/home/ServicesBento'
import { TaxTools } from '@/components/public/home/TaxTools'

export const revalidate = 300

type Banner = { id: number; name: string; file: string }
type Home = {
  hero: PostCardType[]
  featured: PostCardType[]
  latest: PostCardType[]
  more: PostCardType[]
  banners: Banner[]
}
type PollList = { polls: PollListItem[] }

export default async function HomePage() {
  const [home, pollArchive, settings] = await Promise.all([
    api<Home>('/home', 300),
    api<PollList>('/polls?page=1', 300),
    api<Settings>('/settings', 300),
  ])

  // one de-duplicated stream of the newest posts, whatever the admin filed them under
  const seen = new Set<number>()
  const insights = [...home.hero, ...home.latest, ...home.featured, ...home.more].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
  const [leadInsight, ...restInsights] = insights

  return (
    <>
      <Hero siteName={settings.site_name || 'AK Ganesh & Co'} />
      <TrustStats />
      <ComplianceTicker />
      <ServicesBento />

      {home.banners.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-line">
            <HeroSlider banners={home.banners} />
          </div>
        </section>
      )}

      <TaxTools />

      {/* ---- CMS content: whatever the admin publishes ---- */}
      {insights.length > 0 && (
        <section id="insights" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Insights &amp; updates</span>
                <h2 className="headline mt-3 text-3xl sm:text-4xl">Latest from the practice.</h2>
              </div>
              <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Browse all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {leadInsight && (
                <Reveal>
                  <PostCard post={leadInsight} big />
                </Reveal>
              )}
              {restInsights.length > 0 && (
                <div className="mt-10 grid gap-8 sm:grid-cols-2">
                  {restInsights.slice(0, 4).map((p, i) => (
                    <Reveal key={p.id} delay={i * 70}>
                      <PostCard post={p} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>

            <Reveal delay={120} className="space-y-8">
              <PollWidget />
              {restInsights.length > 4 && (
                <div className="rounded-2xl border border-line bg-card p-5">
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                    More reading
                  </h3>
                  <div className="space-y-5">
                    {restInsights.slice(4, 9).map((p) => (
                      <PostRow key={p.id} post={p} />
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          </div>

          {pollArchive.polls.length > 0 && (
            <Reveal className="mt-16 border-t border-line pt-8">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">Poll archive</h3>
                <Link href="/polls" className="text-xs font-semibold text-accent hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {pollArchive.polls.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    href={`/polls/${p.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 text-xs transition-colors hover:border-accent-dark hover:bg-card-hover"
                  >
                    <span className="truncate font-medium text-ink">{p.title}</span>
                    <span className="shrink-0 text-ink-soft">{formatDateTime(p.createdAt)}</span>
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </section>
      )}
    </>
  )
}
