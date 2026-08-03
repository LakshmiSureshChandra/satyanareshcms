import type { Metadata } from 'next'
import { Clock, Mail, Phone } from 'lucide-react'
import { api, type Settings } from '@/lib/api'
import { ContactForm } from '@/components/public/ContactForm'
import { PageHeader } from '@/components/public/PageHeader'

export const metadata: Metadata = { title: 'Contact Us' }
export const revalidate = 3600

export default async function ContactPage() {
  const settings = await api<Settings>('/settings', 300)

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Book a consultation"
        subtitle="Tell us what you need — filings, tax planning, audit, or a second opinion. We'll come back with a clear scope and a fixed quote."
        crumbs={[{ label: 'Contact Us' }]}
      />

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-card p-6">
              <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft">
                Direct contact
              </h2>
              <ul className="space-y-4 text-sm">
                {settings.site_email && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
                    <a href={`mailto:${settings.site_email}`} className="text-ink-2 hover:text-accent">
                      {settings.site_email}
                    </a>
                  </li>
                )}
                {settings.site_phone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                    <a href={`tel:${settings.site_phone}`} className="text-ink-2 hover:text-accent">
                      {settings.site_phone}
                    </a>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-4 shrink-0 text-accent" />
                  <span className="text-ink-2">Mon–Sat, 10:00 — 18:30 IST</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-badge-border bg-badge-bg p-6">
              <p className="text-sm leading-relaxed text-ink-2">
                Every enquiry is reviewed by a chartered accountant — not a sales desk. Expect a reply within one
                working day.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
