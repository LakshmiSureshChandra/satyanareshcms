import type { Metadata } from 'next'
import { NewsletterTokenAction } from '@/components/public/NewsletterTokenAction'

export const metadata: Metadata = { title: 'Confirm Subscription' }

export default async function ConfirmNewsletterPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="headline text-2xl">Confirm your subscription</h1>
      <p className="mt-2 text-sm text-ink-soft">Click below to start receiving updates from AK Ganesh &amp; Co.</p>
      <div className="mt-6 flex justify-center">
        <NewsletterTokenAction
          token={token}
          action="confirm"
          buttonLabel="Confirm subscription"
          successMessage="You're subscribed! Thanks for confirming."
        />
      </div>
    </div>
  )
}
