import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { api, type PostCard as PostCardType, type Settings } from '@/lib/api'
import { HeroSlider } from '@/components/public/HeroSlider'
import { Reveal } from '@/components/public/Reveal'
import { Button } from '@/components/ui/button'
import { Hero } from '@/components/public/home/Hero'
import { TrustStats } from '@/components/public/home/TrustStats'
import { ComplianceTicker } from '@/components/public/home/ComplianceTicker'
import { ServicesBento } from '@/components/public/home/ServicesBento'
import { InsightRow } from '@/components/public/home/InsightRow'

export const revalidate = 300

type Banner = { id: number; name: string; file: string }
type Home = {
  hero: PostCardType[]
  featured: PostCardType[]
  latest: PostCardType[]
  more: PostCardType[]
  banners: Banner[]
}
export default async function HomePage() {
  const [home, settings] = await Promise.all([
    api<Home>('/home', 300),
    api<Settings>('/settings', 300),
  ])

  // one de-duplicated stream of the newest posts, whatever the admin filed them under
  const seen = new Set<number>()
  const insights = [...home.hero, ...home.latest, ...home.featured, ...home.more].filter((p) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
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

      {/* ---- CMS content: whatever the admin publishes ---- */}
      {insights.length > 0 && (
        <section id="insights" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow">Insights &amp; updates</span>
                <h2 className="headline mt-2 text-2xl sm:text-3xl">Latest from the practice.</h2>
                <p className="mt-2 max-w-md text-sm text-ink-2">
                  Practical guidance on tax, compliance, and financial planning from our team.
                </p>
              </div>
              <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
                Browse all
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </Reveal>

          <div className="mt-10 grid gap-10 lg:grid-cols-3">
            <div className="divide-y divide-line lg:col-span-2">
              {insights.slice(0, 6).map((p, i) => (
                <Reveal key={p.id} delay={i * 50}>
                  <InsightRow post={p} />
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <div className="rounded-2xl border border-line bg-card p-5">
                <h3 className="text-sm font-semibold text-ink">Need advice specific to your business?</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  Book a short call with a chartered accountant — no obligation.
                </p>
                <Button asChild size="sm" className="mt-4">
                  <Link href="/contact">Book a Consultation</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  )
}
