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
    <footer className="mt-20 rounded-t-[2.5rem] bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="headline text-4xl text-paper">
              {settings.site_name}
              <span className="text-accent">.</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-paper/60">
              తాజా వార్తలు, విశ్లేషణలు మరియు ప్రత్యేక కథనాలు — {settings.site_name} లో చదవండి.
            </p>
            <div className="mt-5 [&_a]:rounded-full [&_a]:bg-paper/10 [&_a]:p-2.5 [&_a]:text-paper/80 [&_a:hover]:bg-accent [&_a:hover]:text-white">
              <SocialIcons settings={settings} />
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-10 md:max-w-lg">
            <div>
              <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">విభాగాలు</p>
              <ul className="space-y-2.5 text-sm">
                {categories.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link href={`/category/${c.slug}`} className="text-paper/75 transition-colors hover:text-lime">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-4 font-display text-sm font-bold uppercase tracking-widest text-paper/40">సమాచారం</p>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/page/about-us" className="text-paper/75 transition-colors hover:text-lime">About Us</Link></li>
                <li><Link href="/contact" className="text-paper/75 transition-colors hover:text-lime">Contact</Link></li>
                {LEGAL.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-paper/75 transition-colors hover:text-lime">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
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
