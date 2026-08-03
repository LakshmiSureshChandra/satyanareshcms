import { Radio } from 'lucide-react'
import { formatDueDate, getComplianceCalendar } from '@/lib/compliance'
import { ComplianceIcon } from './ComplianceIcon'

export function ComplianceTicker() {
  const items = getComplianceCalendar()
  // duplicated so the -50% marquee translate loops seamlessly
  const track = [...items, ...items]

  return (
    <section className="overflow-hidden border-b border-line bg-paper" aria-label="Upcoming compliance due dates">
      <div className="flex items-center">
        <div className="hidden shrink-0 items-center gap-2 border-r border-line py-4 pl-4 pr-5 sm:flex sm:pl-6">
          <Radio className="size-3.5 text-accent" />
          <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.15em] text-ink-soft">
            Compliance Ledger — Live
          </span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track">
            {track.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 whitespace-nowrap border-r border-line px-5 py-4">
                <ComplianceIcon icon={item.icon} className="size-3.5 shrink-0 text-accent" />
                <span className="text-sm text-ink">{item.label}</span>
                <span className="text-sm text-ink-soft">· {formatDueDate(item.date)}</span>
                <span className="rounded-full bg-paper-2 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {item.days}d
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
