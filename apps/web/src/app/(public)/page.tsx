import { api, type PostCard as PostCardType } from '@/lib/api'
import { PostCard, PostRow, OverlayCard } from '@/components/public/PostCard'
import { FeaturedCarousel } from '@/components/public/FeaturedCarousel'
import { HeroSlider } from '@/components/public/HeroSlider'

export const revalidate = 300

type Banner = { id: number; name: string; file: string }
type Home = {
  hero: PostCardType[]
  featured: PostCardType[]
  latest: PostCardType[]
  more: PostCardType[]
  banners: Banner[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="section-title mb-7 text-2xl md:text-3xl">{children}</h2>
  )
}

export default async function HomePage() {
  const home = await api<Home>('/home', 300)
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

        {/* FEATURED — swipeable rail */}
        {home.featured.length > 0 && (
          <section className="rise-1 rise py-8">
            <SectionTitle>Featured Stories</SectionTitle>
            <FeaturedCarousel posts={home.featured} />
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
      </div>
    </>
  )
}
