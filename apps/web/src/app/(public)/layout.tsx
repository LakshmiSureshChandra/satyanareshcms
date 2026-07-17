import type { Metadata } from 'next'
import { api, imageUrl, type MenuItem, type PostCard, type Settings } from '@/lib/api'
import { Header } from '@/components/public/Header'
import { Ticker } from '@/components/public/Ticker'
import { Footer } from '@/components/public/Footer'
import { CookieBanner } from '@/components/public/CookieBanner'

// Site-wide SEO defaults from Admin → SEO. Any page can still override these
// (e.g. a post's own meta title/description/image) — Next merges child
// metadata over these, so this only fills in what a page doesn't set itself.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await api<Settings>('/settings', 300)
  const icon = imageUrl(settings.fav_icon)
  const ogImage = imageUrl(settings.og_image)
  return {
    title: { default: settings.site_name || 'AK Ganesh', template: `%s — ${settings.site_name || 'AK Ganesh'}` },
    description: settings.default_meta_description || undefined,
    icons: icon ? { icon } : undefined,
    verification: settings.google_site_verification ? { google: settings.google_site_verification } : undefined,
    openGraph: {
      siteName: settings.site_name || undefined,
      type: 'website',
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      images: ogImage ? [ogImage] : undefined,
    },
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, menus, footerMenu, latest] = await Promise.all([
    api<Settings>('/settings', 300),
    api<MenuItem[]>('/menus', 300),
    api<MenuItem[]>('/menus?location=footer', 300),
    api<{ posts: PostCard[] }>('/posts?limit=8', 300),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header menus={menus} settings={settings} logoUrl={imageUrl(settings.site_logo)} />
      <Ticker posts={latest.posts} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} menu={footerMenu} />
      <CookieBanner gaSnippet={settings.google_analytics || ''} />
    </div>
  )
}
