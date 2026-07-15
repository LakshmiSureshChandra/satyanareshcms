import Link from 'next/link'
import type { CategoryNode, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'

type FooterLink = { label: string; url: string }
type FooterColumn = { title: string; links: FooterLink[] }
type FooterConfig = { about?: string; columns: FooterColumn[] }

// Default columns when the admin hasn't configured a footer yet.
function defaultConfig(categories: CategoryNode[]): FooterConfig {
  return {
    columns: [
      { title: 'Categories', links: categories.slice(0, 6).map((c) => ({ label: c.name, url: `/category/${c.slug}` })) },
      {
        title: 'Information',
        links: [
          { label: 'About Us', url: '/page/about-us' },
          { label: 'Contact', url: '/contact' },
          { label: 'Privacy Policy', url: '/page/privacy-policy' },
          { label: 'Terms & Conditions', url: '/page/terms-and-conditions' },
          { label: 'Disclaimer', url: '/page/disclaimer' },
          { label: 'Refund Policy', url: '/page/refund-policy' },
          { label: 'Cookies Policy', url: '/page/cookies-policy' },
        ],
      },
    ],
  }
}

function FLink({ link }: { link: FooterLink }) {
  const cls = 'text-paper/75 transition-colors hover:text-gold'
  const url = link.url?.trim() || '#'
  if (url.startsWith('/')) return <Link href={url} className={cls}>{link.label}</Link>
  const external = /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`
  return <a href={external} target="_blank" rel="noopener noreferrer" className={cls}>{link.label}</a>
}

export function Footer({ settings, categories }: { settings: Settings; categories: CategoryNode[] }) {
  let config: FooterConfig
  try {
    const parsed = settings.footer_config ? JSON.parse(settings.footer_config) : null
    config = parsed?.columns?.length ? parsed : defaultConfig(categories)
  } catch {
    config = defaultConfig(categories)
  }
  const about = config.about?.trim() || `Latest news, analysis and special stories — read on ${settings.site_name}.`

  return (
    <footer className="mt-20 border-t-4 border-accent bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="headline text-4xl text-paper">
              {settings.site_name}
              <span className="text-gold">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">{about}</p>
            <div className="mt-5 [&_a]:rounded-full [&_a]:bg-paper/10 [&_a]:p-2.5 [&_a]:text-paper/80 [&_a:hover]:bg-accent [&_a:hover]:text-white">
              <SocialIcons settings={settings} />
            </div>
          </div>

          <div className="grid flex-1 gap-10 sm:grid-cols-2 md:max-w-xl lg:grid-cols-3">
            {config.columns.map((col, i) => (
              <div key={i}>
                <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">{col.title}</p>
                <ul className="space-y-2.5 text-sm">
                  {col.links.map((link, j) => (
                    <li key={j}><FLink link={link} /></li>
                  ))}
                </ul>
              </div>
            ))}
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
