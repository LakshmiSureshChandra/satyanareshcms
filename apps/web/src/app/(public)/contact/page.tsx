import type { Metadata } from 'next'
import { api, type Settings } from '@/lib/api'
import { ContactForm } from '@/components/public/ContactForm'
import { Breadcrumbs } from '@/components/public/Breadcrumbs'

export const metadata: Metadata = { title: 'Contact Us' }
export const revalidate = 3600

export default async function ContactPage() {
  const settings = await api<Settings>('/settings', 300)
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'Contact Us' }]} />

      <div className="rounded-lg bg-ink px-6 py-8 text-paper md:px-10">
        <h1 className="headline text-3xl md:text-4xl">Contact Us<span className="text-gold">.</span></h1>
        <p className="mt-2 text-sm text-paper/60">
          Share your feedback and suggestions with us.
          {settings.site_email && <> Email: <a className="text-gold" href={`mailto:${settings.site_email}`}>{settings.site_email}</a></>}
          {settings.site_phone && <> · Phone: {settings.site_phone}</>}
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
