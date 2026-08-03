import { CountUp } from '../CountUp'
import { Reveal } from '../Reveal'

const STATS = [
  { value: 15, suffix: '+', label: 'Years of financial leadership' },
  { value: 500, prefix: '₹', suffix: 'Cr+', label: 'Client portfolios handled' },
  { value: 100, suffix: '%', label: 'ICAI ethical compliance' },
]

export function TrustStats() {
  return (
    <section className="border-b border-line bg-paper-2">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid pt-14 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal
              key={s.label}
              delay={i * 100}
              className="border-t border-line py-6 text-center first:border-t-0 sm:border-l sm:border-t-0 sm:py-0 sm:first:border-l-0"
            >
              <div className="headline text-4xl sm:text-[2.4rem]">
                <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="mt-2 text-sm text-ink-2">{s.label}</div>
            </Reveal>
          ))}
        </div>
        <p className="py-8 text-center text-sm text-ink-soft">
          Serving startups, HNWIs, and mid-sized enterprises across India.
        </p>
      </div>
    </section>
  )
}
