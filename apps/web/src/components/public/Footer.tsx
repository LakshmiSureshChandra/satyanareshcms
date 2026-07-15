import Link from 'next/link'
import type { CategoryNode, MenuItem, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'

const LEGAL: [string, string][] = [
  ['Privacy Policy', '/page/privacy-policy'],
  ['Terms & Conditions', '/page/terms-and-conditions'],
  ['Disclaimer', '/page/disclaimer'],
  ['Refund Policy', '/page/refund-policy'],
  ['Cookies Policy', '/page/cookies-policy'],
]

const linkClass = 'text-paper/75 transition-colors hover:text-gold'

function FLink({ item }: { item: { title: string; url: string; newWindow?: boolean } }) {
  const url = item.url?.trim() || '#'
  if (url === '#') return <span className="text-paper/75">{item.title}</span>
  if (url.startsWith('/')) return <Link href={url} className={linkClass}>{item.title}</Link>
  const external = /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`
  return <a href={external} target={item.newWindow ? '_blank' : undefined} rel="noopener noreferrer" className={linkClass}>{item.title}</a>
}

// Default columns when no footer menu has been configured in the admin.
function DefaultColumns({ categories }: { categories: CategoryNode[] }) {
  return (
    <>
      <div>
        <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">Categories</p>
        <ul className="space-y-2.5 text-sm">
          {categories.slice(0, 6).map((c) => (
            <li key={c.id}><Link href={`/category/${c.slug}`} className={linkClass}>{c.name}</Link></li>
          ))}
        </ul>
      </div>
      <div>
        <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">Information</p>
        <ul className="space-y-2.5 text-sm">
          <li><Link href="/page/about-us" className={linkClass}>About Us</Link></li>
          <li><Link href="/contact" className={linkClass}>Contact</Link></li>
          {LEGAL.map(([label, href]) => <li key={href}><Link href={href} className={linkClass}>{label}</Link></li>)}
        </ul>
      </div>
    </>
  )
}

export function Footer({ settings, categories, menu }: { settings: Settings; categories: CategoryNode[]; menu: MenuItem[] }) {
  const hasMenu = menu?.length > 0

  return (
    <footer className="mt-20 border-t-4 border-accent bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="headline text-4xl text-paper">
              {settings.site_name}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              Latest news, analysis and special stories — read on {settings.site_name}.
            </p>
            <div className="mt-5 [&_a]:rounded-full [&_a]:bg-paper/10 [&_a]:p-2.5 [&_a]:text-paper/80 [&_a:hover]:bg-accent [&_a:hover]:text-white">
              <SocialIcons settings={settings} />
            </div>
          </div>

          <div className="grid flex-1 gap-10 sm:grid-cols-2 md:max-w-xl lg:grid-cols-3">
            {hasMenu ? (
              menu.map((col) => (
                <div key={col.id}>
                  <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">
                    {col.url && col.url !== '#' ? <FLink item={col} /> : col.title}
                  </p>
                  <ul className="space-y-2.5 text-sm">
                    {col.children.map((link) => (
                      <li key={link.id}>
                        <FLink item={link} />
                        {link.children.length > 0 && (
                          <ul className="mt-2 ml-1 space-y-1.5 border-l border-paper/15 pl-4 text-[13px]">
                            {link.children.map((sub) => (
                              <li key={sub.id} className="flex items-start gap-1.5 [&_a]:text-paper/50 [&_a:hover]:text-gold">
                                <span aria-hidden className="mt-px text-paper/30">–</span>
                                <FLink item={sub} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <DefaultColumns categories={categories} />
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <p className="mx-auto max-w-6xl px-6 py-5 text-center text-xs text-paper/40">
          {settings.copy_rights_info}
        </p>
      </div>
    </footer>
  )
}
