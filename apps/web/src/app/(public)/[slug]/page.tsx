import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api, imageUrl, NotFoundError, type CategoryNode, type PostCard as PostCardType, type Settings } from '@/lib/api'
import { PostCard, formatDate, CategoryTag } from '@/components/public/PostCard'
import { ShareButtons } from '@/components/public/ShareButtons'
import { Sidebar } from '@/components/public/Sidebar'
import { ReadingProgress } from '@/components/public/ReadingProgress'

export const revalidate = 3600
export const dynamicParams = true
export async function generateStaticParams() {
  return [] // build on demand, cache via ISR
}

type FullPost = PostCardType & {
  content: string
  metaTitle: string | null
  author: { name: string } | null
  categories: { id: number; name: string; slug: string; parent?: { name: string; slug: string } | null }[]
  related: PostCardType[]
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function getPost(slug: string) {
  try {
    return await api<FullPost>(`/posts/${encodeURIComponent(slug)}`, 3600)
  } catch (e) {
    if (e instanceof NotFoundError) return null
    throw e
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return {}
  const title = post.metaTitle || post.title
  const description = post.metaDescription || undefined
  const img = imageUrl(post.bannerImage)
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/${post.slug}` },
    openGraph: {
      title, description, type: 'article', url: `${SITE}/${post.slug}`,
      images: img ? [{ url: img }] : undefined,
      publishedTime: post.publishedAt,
    },
    twitter: { card: 'summary_large_image', title, description, images: img ? [img] : undefined },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()
  const categories = await api<CategoryNode[]>('/categories', 300)

  const cat = post.categories[0]
  const url = `${SITE}/${post.slug}`
  const img = imageUrl(post.bannerImage)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    image: img ? [img] : undefined,
    datePublished: post.publishedAt,
    author: post.author ? [{ '@type': 'Person', name: post.author.name }] : undefined,
    description: post.metaDescription || undefined,
    mainEntityOfPage: url,
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      ...(cat ? [{ '@type': 'ListItem', position: 2, name: cat.name, item: `${SITE}/category/${cat.slug}` }] : []),
      { '@type': 'ListItem', position: cat ? 3 : 2, name: post.title, item: url },
    ],
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <ReadingProgress />

      <div className="grid gap-10 lg:grid-cols-3">
        <article className="lg:col-span-2">
          {/* breadcrumbs */}
          <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-ink-soft">
            <Link href="/" className="hover:text-accent">హోమ్</Link>
            {cat?.parent && (
              <>
                <span>›</span>
                <Link href={`/category/${cat.parent.slug}`} className="hover:text-accent">{cat.parent.name}</Link>
              </>
            )}
            {cat && (
              <>
                <span>›</span>
                <Link href={`/category/${cat.slug}`} className="hover:text-accent">{cat.name}</Link>
              </>
            )}
          </nav>

          <div className="flex flex-wrap gap-1.5">
            {post.categories.map((c) => <CategoryTag key={c.id} cat={c} />)}
          </div>

          <h1 className="headline mt-3 text-3xl leading-snug md:text-[2.6rem] md:leading-[1.25]">{post.title}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-3 text-sm text-ink-soft">
            {post.author && (
              <>
                <span className="font-semibold text-ink">{post.author.name}</span>
                <span className="text-line">|</span>
              </>
            )}
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </div>

          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={post.title} className="mt-7 w-full rounded-lg" />
          )}

          <div className="prose-news mt-3" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.tags && (
            <div className="mt-9 flex flex-wrap gap-2">
              {post.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                <Link
                  key={t}
                  href={`/tag/${encodeURIComponent(t)}`}
                  className="border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-7 rounded-lg border border-line bg-white/60 p-5">
            <ShareButtons url={url} title={post.title} />
          </div>

          {post.related.length > 0 && (
            <section className="mt-14">
              <h2 className="section-title text-2xl">సంబంధిత వార్తలు</h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {post.related.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            </section>
          )}
        </article>

        <Sidebar categories={categories} />
      </div>
    </div>
  )
}
