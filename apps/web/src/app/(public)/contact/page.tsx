import type { Metadata } from 'next'
import { api, type Settings } from '@/lib/api'
import { ContactForm } from '@/components/public/ContactForm'

export const metadata: Metadata = { title: 'Contact Us' }
export const revalidate = 3600

export default async function ContactPage() {
  const settings = await api<Settings>('/settings', 300)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-3xl bg-ink px-6 py-8 text-paper md:px-10">
        <h1 className="headline text-3xl md:text-4xl">సంప్రదించండి<span className="text-accent">.</span></h1>
        <p className="mt-2 text-sm text-paper/60">
          మీ అభిప్రాయాలు, సూచనలు మాకు తెలియజేయండి.
          {settings.site_email && <> ఇమెయిల్: <a className="text-lime" href={`mailto:${settings.site_email}`}>{settings.site_email}</a></>}
          {settings.site_phone && <> · ఫోన్: {settings.site_phone}</>}
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
