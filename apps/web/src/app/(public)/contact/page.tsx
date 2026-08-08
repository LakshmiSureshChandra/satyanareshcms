import type { Metadata } from 'next'
import { Clock, Mail, MapPin, Phone, Printer, Smartphone } from 'lucide-react'
import { api, type Settings } from '@/lib/api'
import { ContactForm } from '@/components/public/ContactForm'
import { PageHeader } from '@/components/public/PageHeader'

export const metadata: Metadata = { title: 'Contact Us' }
export const revalidate = 3600

// tel:/fax: links want digits (and a leading +), not the display formatting
function telHref(n: string) {
  return `tel:${n.replace(/[^\d+]/g, '')}`
}

export default async function ContactPage() {
  const settings = await api<Settings>('/settings', 300)
  const mapQuery = [settings.site_name, settings.site_address].filter(Boolean).join(', ')

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
                Head Office
              </h2>
              <ul className="space-y-4 text-sm">
                {settings.site_address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-ink-2">{settings.site_address}</span>
                  </li>
                )}
                {settings.site_email && (
                  <li className="flex items-start gap-3">
                    <Mail className="mt-0.5 size-4 shrink-0 text-accent" />
                    <a href={`mailto:${settings.site_email}`} className="text-ink-2 hover:text-accent">
                      {settings.site_email}
                    </a>
                  </li>
                )}
                {settings.site_mobile && (
                  <li className="flex items-start gap-3">
                    <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" />
                    <a href={telHref(settings.site_mobile)} className="text-ink-2 hover:text-accent">
                      {settings.site_mobile}
                    </a>
                  </li>
                )}
                {settings.site_phone && (
                  <li className="flex items-start gap-3">
                    <Phone className="mt-0.5 size-4 shrink-0 text-accent" />
                    <a href={telHref(settings.site_phone)} className="text-ink-2 hover:text-accent">
                      {settings.site_phone}
                    </a>
                  </li>
                )}
                {settings.site_fax && (
                  <li className="flex items-start gap-3">
                    <Printer className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-ink-2">{settings.site_fax}</span>
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

        {mapQuery && (
          <div className="mt-10 overflow-hidden rounded-2xl border border-line">
            <iframe
              title="Office location"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              width="100%"
              height="360"
              style={{ border: 0, filter: 'grayscale(0.15) contrast(1.05)' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </>
  )
}
