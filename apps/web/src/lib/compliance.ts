/**
 * Statutory Indian compliance due dates, resolved to the next occurrence from
 * today. Pure date maths — no CMS content — so the hero ledger and the ticker
 * both stay correct without anyone having to maintain them in the admin panel.
 *
 * Rendered from server components under ISR, so "days left" is at most as stale
 * as the page's revalidate window.
 */

type Recurrence = [month: number, day: number][] // month is 0-indexed

/** Next future occurrence out of a set of (month, day) pairs. */
function nextOccurrence(pairs: Recurrence): Date {
  const now = new Date()
  const candidates: Date[] = []
  for (const [m, d] of pairs) {
    candidates.push(new Date(now.getFullYear(), m, d, 23, 59, 59, 999))
    candidates.push(new Date(now.getFullYear() + 1, m, d, 23, 59, 59, 999))
  }
  return candidates.filter((d) => d >= now).sort((a, b) => a.getTime() - b.getTime())[0]
}

const everyMonth = (day: number): Recurrence =>
  Array.from({ length: 12 }, (_, m) => [m, day] as [number, number])

export function daysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000))
}

export function formatDueDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })
}

export type ComplianceItem = {
  label: string
  icon: 'receipt' | 'landmark' | 'trending' | 'shield' | 'calendar' | 'users'
  date: Date
  days: number
}

/** Sorted soonest-first so the hero can just take the top N most urgent. */
export function getComplianceCalendar(): ComplianceItem[] {
  const items: Omit<ComplianceItem, 'days'>[] = [
    { label: 'GSTR-3B filing', icon: 'receipt', date: nextOccurrence(everyMonth(20)) },
    { label: 'GSTR-1 filing', icon: 'receipt', date: nextOccurrence(everyMonth(11)) },
    { label: 'TDS payment', icon: 'landmark', date: nextOccurrence(everyMonth(7)) },
    { label: 'PF & ESI contribution', icon: 'users', date: nextOccurrence(everyMonth(15)) },
    {
      label: 'Advance tax instalment',
      icon: 'trending',
      date: nextOccurrence([[5, 15], [8, 15], [11, 15], [2, 15]]),
    },
    { label: 'Tax audit report (44AB)', icon: 'shield', date: nextOccurrence([[8, 30]]) },
    { label: 'ITR filing — non-audit', icon: 'calendar', date: nextOccurrence([[6, 31]]) },
    { label: 'ITR filing — audit cases', icon: 'calendar', date: nextOccurrence([[9, 31]]) },
  ]

  return items
    .map((i) => ({ ...i, days: daysUntil(i.date) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Indian financial year label for the current date, e.g. "FY 2026–27". */
export function currentFinancialYear() {
  const now = new Date()
  // Indian FY runs April (month 3) → March
  const startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return `FY ${startYear}–${String(startYear + 1).slice(2)}`
}
