import type { Metadata } from 'next'
import { NewsletterTokenAction } from '@/components/public/NewsletterTokenAction'

export const metadata: Metadata = { title: 'Unsubscribe' }

export default async function UnsubscribeNewsletterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
      <h1 className="headline text-2xl sm:text-3xl">Unsubscribe</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">Click below to stop receiving emails from AK Ganesh &amp; Co.</p>
      <div className="mt-6 flex justify-center">
        <NewsletterTokenAction
          token={token}
          action="unsubscribe"
          buttonLabel="Unsubscribe me"
          successMessage="You've been unsubscribed."
        />
      </div>
    </div>
  )
}
