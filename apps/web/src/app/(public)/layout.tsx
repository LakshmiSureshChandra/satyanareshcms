import { api, imageUrl, type CategoryNode, type MenuItem, type Settings } from '@/lib/api'
import { Header } from '@/components/public/Header'
import { Footer } from '@/components/public/Footer'
import { CookieBanner } from '@/components/public/CookieBanner'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, menus, categories] = await Promise.all([
    api<Settings>('/settings', 300),
    api<MenuItem[]>('/menus', 300),
    api<CategoryNode[]>('/categories', 300),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <Header menus={menus} settings={settings} logoUrl={imageUrl(settings.site_logo)} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} categories={categories} />
      <CookieBanner gaSnippet={settings.google_analytics || ''} />
    </div>
  )
}
