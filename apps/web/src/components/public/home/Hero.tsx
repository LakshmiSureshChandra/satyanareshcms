import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { currentFinancialYear, getComplianceCalendar } from '@/lib/compliance'
import { Reveal } from '../Reveal'
import { ComplianceIcon } from './ComplianceIcon'

export function Hero({ siteName }: { siteName: string }) {
  const upcoming = getComplianceCalendar().slice(0, 4)

  return (
    <section className="grid-bg relative overflow-hidden border-b border-line">
      <div className="glow -right-20 -top-40 size-[520px]" aria-hidden />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-2">
        <Reveal>
          <Badge size="eyebrow">ICAI Registered · Est. Chartered Practice</Badge>

          <h1 className="headline mt-6 text-[2.6rem] leading-[1.1] sm:text-5xl lg:text-[3.4rem]">
            Next-gen financial &amp; <span className="text-accent">tax intelligence</span> for growing businesses.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-2">
            {siteName} combines decades of chartered accountancy expertise with seamless, digital-first
            compliance — built for founders who move fast.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/contact">
                Book a Consultation
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">
                <Phone />
                Talk to an advisor
              </Link>
            </Button>
          </div>
        </Reveal>

        {/* live compliance ledger — the "we already know what you owe" proof point */}
        <Reveal delay={120} className="w-full lg:justify-self-end">
          <div className="w-full max-w-sm rounded-2xl border border-line bg-card/80 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:ml-auto">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.15em] text-ink-soft">
                {currentFinancialYear()} Ledger
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-accent">
                <span className="pulse-dot size-1.5 rounded-full bg-accent" aria-hidden />
                Live
              </span>
            </div>

            <ul>
              {upcoming.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-paper-2 text-accent">
                      <ComplianceIcon icon={item.icon} className="size-3.5" />
                    </span>
                    <span className="truncate text-sm text-ink">{item.label}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-ink-soft">
                      {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })}
                    </div>
                    <div className="text-xs font-medium text-accent">{item.days}d left</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
