import Link from 'next/link'
import type { CategoryNode, Settings } from '@/lib/api'
import { SocialIcons } from './SocialIcons'

const LEGAL: [string, string][] = [
  ['Privacy Policy', '/page/privacy-policy'],
  ['Terms & Conditions', '/page/terms-and-conditions'],
  ['Disclaimer', '/page/disclaimer'],
  ['Refund Policy', '/page/refund-policy'],
  ['Cookies Policy', '/page/cookies-policy'],
]

export function Footer({ settings, categories }: { settings: Settings; categories: CategoryNode[] }) {
  return (
    <footer className="mt-16 border-t-4 border-ink bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="headline text-2xl">
            {settings.site_name}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-paper/70">
            తాజా వార్తలు, విశ్లేషణలు మరియు ప్రత్యేక కథనాలు — {settings.site_name} లో చదవండి.
          </p>
          <div className="mt-4 [&_a]:text-paper/70 [&_a:hover]:text-accent">
            <SocialIcons settings={settings} />
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-paper/50">విభాగాలు</p>
          <ul className="grid grid-cols-2 gap-y-2 text-sm">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className="text-paper/80 hover:text-accent">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-paper/50">సమాచారం</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/page/about-us" className="text-paper/80 hover:text-accent">About Us</Link></li>
            <li><Link href="/contact" className="text-paper/80 hover:text-accent">Contact</Link></li>
            {LEGAL.map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="text-paper/80 hover:text-accent">{label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-paper/50">
          {settings.copy_rights_info}
        </p>
      </div>
    </footer>
  )
}
