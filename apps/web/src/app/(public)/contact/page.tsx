import type { Metadata } from 'next'
import { api, type Settings } from '@/lib/api'
import { ContactForm } from '@/components/public/ContactForm'

export const metadata: Metadata = { title: 'Contact Us' }
export const revalidate = 3600

export default async function ContactPage() {
  const settings = await api<Settings>('/settings', 300)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rule-double pt-3">
        <h1 className="headline text-3xl">సంప్రదించండి<span className="text-accent">.</span></h1>
        <p className="mt-2 text-sm text-ink-soft">
          మీ అభిప్రాయాలు, సూచనలు మాకు తెలియజేయండి.
          {settings.site_email && <> ఇమెయిల్: <a className="text-accent" href={`mailto:${settings.site_email}`}>{settings.site_email}</a></>}
          {settings.site_phone && <> · ఫోన్: {settings.site_phone}</>}
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
