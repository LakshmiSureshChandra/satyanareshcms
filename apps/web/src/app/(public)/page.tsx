import Link from 'next/link'
import { api, type PostCard as PostCardType, type Settings } from '@/lib/api'
import { PostCard, PostRow, CategoryTag, CardImage, formatDate } from '@/components/public/PostCard'
import { FeaturedCarousel } from '@/components/public/FeaturedCarousel'

export const revalidate = 300

type Home = {
  hero: PostCardType[]
  featured: PostCardType[]
  latest: PostCardType[]
  more: PostCardType[]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="rule-double mb-6 pt-3">
      <h2 className="headline text-xl md:text-2xl">
        {children}
        <span className="text-accent">.</span>
      </h2>
    </div>
  )
}

export default async function HomePage() {
  const [home, settings] = await Promise.all([api<Home>('/home', 300), api<Settings>('/settings', 300)])
  const [lead, ...heroRest] = home.hero

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* HERO: 1 lead + 4 stacked */}
      {lead && (
        <section className="rise grid gap-8 border-b border-line py-8 md:grid-cols-3">
          <article className="card-zoom group md:col-span-2">
            <Link href={`/${lead.slug}`}>
              <CardImage post={lead} className="aspect-[16/9]" />
            </Link>
            <div className="pt-4">
              {lead.categories[0] && <CategoryTag cat={lead.categories[0]} />}
              <Link href={`/${lead.slug}`}>
                <h1 className="headline mt-3 text-2xl leading-snug transition-colors group-hover:text-accent md:text-4xl">
                  {lead.title}
                </h1>
              </Link>
              {lead.metaDescription && (
                <p className="mt-3 line-clamp-2 text-ink-soft">{lead.metaDescription}</p>
              )}
              <time className="mt-2 block text-xs text-ink-soft">{formatDate(lead.publishedAt)}</time>
            </div>
          </article>

          <div className="flex flex-col gap-5 md:border-l md:border-line md:pl-8">
            {heroRest.slice(0, 4).map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED carousel */}
      {home.featured.length > 0 && (
        <section className="rise-1 rise py-10">
          <SectionTitle>ప్రత్యేక కథనాలు</SectionTitle>
          <FeaturedCarousel posts={home.featured} />
        </section>
      )}

      {/* LATEST grid */}
      {home.latest.length > 0 && (
        <section className="rise-2 rise border-t border-line py-10">
          <SectionTitle>తాజా వార్తలు</SectionTitle>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {home.latest.map((p, i) => (
              <PostCard key={p.id} post={p} big={i === 0 && home.latest.length < 4} />
            ))}
          </div>
        </section>
      )}

      {/* MORE list */}
      {home.more.length > 0 && (
        <section className="rise-3 rise border-t border-line py-10">
          <SectionTitle>మరిన్ని వార్తలు</SectionTitle>
          <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
            {home.more.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
