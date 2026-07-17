import type { Metadata } from 'next'
import { api, imageUrl, type MenuItem, type PostCard, type Settings } from '@/lib/api'
import { Header } from '@/components/public/Header'
import { Ticker } from '@/components/public/Ticker'
import { Footer } from '@/components/public/Footer'
import { CookieBanner } from '@/components/public/CookieBanner'

// Favicon comes from admin Settings (fav_icon). No fallback to the framework
// default — nothing is shown until one is uploaded.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await api<Settings>('/settings', 300)
  const icon = imageUrl(settings.fav_icon)
  return {
    title: { default: settings.site_name || 'AK Ganesh', template: `%s — ${settings.site_name || 'AK Ganesh'}` },
    icons: icon ? { icon } : undefined,
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
