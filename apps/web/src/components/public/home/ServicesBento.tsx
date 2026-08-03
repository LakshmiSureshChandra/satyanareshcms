import Link from 'next/link'
import { Building2, ChevronRight, Globe2, Receipt, Rocket, ShieldCheck, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from '../Reveal'

const SERVICES = [
  {
    icon: Receipt,
    title: 'GST advisory & filing',
    desc: 'End-to-end GST registration, monthly returns, reconciliation, and audit support so you never miss a due date.',
    span: 'sm:col-span-2',
  },
  { icon: ShieldCheck, title: 'Audit & assurance', desc: 'Statutory, internal, and tax audits conducted to ICAI standards.' },
  { icon: TrendingUp, title: 'Tax planning', desc: 'Proactive strategies that legally minimise your tax outgo.' },
  {
    icon: Building2,
    title: 'Corporate advisory',
    desc: 'Company formation, ROC compliance, and structuring built for scale.',
    span: 'sm:col-span-2',
  },
  { icon: Rocket, title: 'Startup & MSME', desc: 'Funding-ready books, ESOP, and compliance for early-stage teams.' },
  { icon: Globe2, title: 'NRI & international tax', desc: 'Cross-border tax, DTAA, and repatriation guidance.' },
]

export function ServicesBento() {
  return (
    <section id="services" className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <span className="eyebrow">What we do</span>
        <h2 className="headline mt-3 text-3xl sm:text-4xl">Services, structured like your balance sheet.</h2>
        <p className="mt-3 max-w-lg leading-relaxed text-ink-2">
          One firm across every statutory obligation — so nothing falls between advisors.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:auto-rows-[13.5rem] lg:grid-cols-4">
        {SERVICES.map((s, i) => (
          <Reveal key={s.title} delay={i * 70} className={cn('h-full', s.span)}>
            <Link
              href="/contact"
              className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-card p-6 transition-[transform,background-color,border-color] duration-200 hover:-translate-y-1 hover:border-accent-dark hover:bg-card-hover"
            >
              <div>
                <span className="mb-4 flex size-10 items-center justify-center rounded-xl border border-badge-border bg-badge-bg text-accent">
                  <s.icon className="size-[18px]" />
                </span>
                <h3 className="text-lg font-semibold leading-snug text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.desc}</p>
              </div>
              <span className="mt-5 flex items-center gap-1 text-sm font-medium text-accent">
                Learn more
                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
