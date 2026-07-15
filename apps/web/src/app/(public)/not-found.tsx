import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="headline text-8xl text-line">404</p>
      <h1 className="headline mt-4 text-3xl">Page not found</h1>
      <p className="mt-2 text-sm text-ink-soft">The page you are looking for may have been removed or the address is incorrect.</p>
      <Link href="/" className="mt-8 inline-block rounded-md bg-ink px-8 py-3 font-semibold text-paper transition-colors hover:bg-accent">
        Back to Home
      </Link>
    </div>
  )
}
