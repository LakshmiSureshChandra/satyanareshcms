import Link from 'next/link'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import type { MenuItem, Settings } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { SocialIcons } from './SocialIcons'
import { NewsletterSubscribeBox } from './NewsletterSubscribeBox'
import { ManageCookiePreferencesLink } from './ManageCookiePreferencesLink'

const linkClass = 'text-sm text-ink-2 transition-colors hover:text-accent'

function FLink({ item }: { item: { title: string; url: string; newWindow?: boolean } }) {
  const url = item.url?.trim() || '#'
  if (url === '#') return <span className="text-sm text-ink-soft">{item.title}</span>
  if (url.startsWith('/')) return <Link href={url} className={linkClass}>{item.title}</Link>
  const external = /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/+/, '')}`
  return (
    <a href={external} target={item.newWindow ? '_blank' : undefined} rel="noopener noreferrer" className={linkClass}>
      {item.title}
    </a>
  )
}

export function Footer({ settings, menu }: { settings: Settings; menu: MenuItem[] }) {
  const hasMenu = menu?.length > 0
  const name = settings.site_name || 'AK Ganesh & Co'
  const [firstWord, ...restWords] = name.split(' ')

  return (
    <footer className="mt-24 border-t border-line bg-paper-2">
      {/* CTA band */}
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="headline text-2xl md:text-3xl">Ready to simplify your compliance?</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">
              Talk to a chartered accountant about your filings, tax planning, or audit — no obligation.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/contact">
              Book a Consultation
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="text-lg font-bold tracking-tight">
              <span className="text-accent">{firstWord}</span>
              {restWords.length > 0 && ` ${restWords.join(' ')}`}
            </div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-ink-soft">Chartered Accountants</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
              Audit, tax, and advisory for founders, professionals, and growing businesses across India.
            </p>

            <div className="mt-5 space-y-2 text-sm">
              {settings.site_email && (
                <a href={`mailto:${settings.site_email}`} className="flex items-center gap-2 text-ink-2 hover:text-accent">
                  <Mail className="size-4 shrink-0 text-ink-soft" />
                  {settings.site_email}
                </a>
              )}
              {settings.site_phone && (
                <a href={`tel:${settings.site_phone}`} className="flex items-center gap-2 text-ink-2 hover:text-accent">
                  <Phone className="size-4 shrink-0 text-ink-soft" />
                  {settings.site_phone}
                </a>
              )}
            </div>

            <div className="mt-6 [&_a]:rounded-full [&_a]:border [&_a]:border-line [&_a]:p-2.5 [&_a]:text-ink-soft [&_a:hover]:border-accent-dark [&_a:hover]:bg-accent-dark [&_a:hover]:text-on-accent">
              <SocialIcons settings={settings} />
            </div>
          </div>

          {hasMenu && (
            <div className="grid gap-8 sm:grid-cols-2 md:col-span-2 lg:col-span-2">
              {menu.map((col) => (
                <div key={col.id}>
                  <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                    {col.url && col.url !== '#' ? <FLink item={col} /> : col.title}
                  </p>
                  <ul className="space-y-2.5">
                    {col.children.map((link) => (
                      <li key={link.id}>
                        <FLink item={link} />
                        {link.children.length > 0 && (
                          <ul className="ml-1 mt-2 space-y-1.5 border-l border-line pl-4">
                            {link.children.map((sub) => (
                              <li key={sub.id}>
                                <FLink item={sub} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className={hasMenu ? 'md:col-span-3 lg:col-span-1' : 'md:col-span-2'}>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">Newsletter</p>
            <NewsletterSubscribeBox />
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-6 text-center sm:flex-row sm:justify-between sm:px-6">
          <p className="text-xs text-ink-soft">
            {settings.copy_rights_info || `© ${new Date().getFullYear()} ${name}. All rights reserved.`}
          </p>
          <ManageCookiePreferencesLink />
        </div>
      </div>
    </footer>
  )
}
