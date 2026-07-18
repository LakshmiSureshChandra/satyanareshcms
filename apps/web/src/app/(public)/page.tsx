import Link from 'next/link'
import { api, type PostCard as PostCardType, type PollListItem } from '@/lib/api'
import { PostCard, PostRow, OverlayCard, formatDate } from '@/components/public/PostCard'
import { FeaturedCarousel } from '@/components/public/FeaturedCarousel'
import { HeroSlider } from '@/components/public/HeroSlider'
import { PollWidget } from '@/components/public/PollWidget'

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="section-title mb-7 text-2xl md:text-3xl">{children}</h2>
  )
}

export default async function HomePage() {
  const [home, pollArchive] = await Promise.all([
    api<Home>('/home', 300),
    api<PollList>('/polls?page=1', 300),
  ])
  const [lead, ...heroRest] = home.hero
  // side column always gets 4 items — backfill from latest when the hero category is small
  const side = [
    ...heroRest,
    ...home.latest.filter((p) => p.id !== lead?.id && !heroRest.some((h) => h.id === p.id)),
  ].slice(0, 4)

  return (
    <>
      <HeroSlider banners={home.banners} />

      <div className="mx-auto max-w-6xl px-4">
        {/* HERO — bento: big overlay lead + stacked side rows */}
        {lead && (
          <section className="rise grid gap-7 py-8 md:grid-cols-3 md:py-10">
            <div className="md:col-span-2">
              <OverlayCard post={lead} />
            </div>
            <div className="flex flex-col justify-between gap-5 rounded-lg border border-line bg-white/50 p-5">
              {side.map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {/* FEATURED — swipeable rail, poll widget rides along as a narrow side card
            when there's featured content to sit beside; otherwise the poll gets its
            own centered row so it never leaves a blank grid column next to it */}
        {home.featured.length > 0 ? (
          <section className="rise-1 rise grid gap-7 py-8 md:grid-cols-3">
            <div className="md:col-span-2">
              <SectionTitle>Featured Stories</SectionTitle>
              <FeaturedCarousel posts={home.featured} />
            </div>
            <div>
              <PollWidget />
            </div>
          </section>
        ) : (
          <section className="rise-1 rise py-8">
            <div className="mx-auto max-w-md">
              <PollWidget />
            </div>
          </section>
        )}

        {/* LATEST grid */}
        {home.latest.length > 0 && (
          <section className="rise-2 rise py-8">
            <SectionTitle>Latest News</SectionTitle>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {home.latest.map((p, i) => (
                <PostCard key={p.id} post={p} big={i === 0 && home.latest.length < 4} />
              ))}
            </div>
          </section>
        )}

        {/* MORE list */}
        {home.more.length > 0 && (
          <section className="rise-3 rise py-8">
            <SectionTitle>More News</SectionTitle>
            <div className="grid gap-x-10 gap-y-7 rounded-lg border border-line bg-white/50 p-6 md:grid-cols-2 md:p-8">
              {home.more.map((p) => (
                <PostRow key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}

        {/* POLL ARCHIVE — compact strip, not a full section */}
        {pollArchive.polls.length > 0 && (
          <section className="rise-3 rise border-t border-line py-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wide text-ink-soft">Poll Archive</h2>
              <Link href="/polls" className="text-xs font-semibold text-accent hover:underline">View All →</Link>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pollArchive.polls.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/polls/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-line bg-white px-3.5 py-2.5 text-xs hover:bg-paper-2"
                >
                  <span className="truncate font-medium">{p.title}</span>
                  <span className="shrink-0 text-ink-soft">{formatDate(p.createdAt)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
