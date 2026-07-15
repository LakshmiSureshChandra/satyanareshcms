import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="headline text-8xl text-line">404</p>
      <h1 className="headline mt-4 text-3xl">పేజీ కనబడలేదు</h1>
      <p className="mt-2 text-sm text-ink-soft">మీరు వెతుకుతున్న పేజీ తొలగించబడి ఉండవచ్చు లేదా చిరునామా తప్పు కావచ్చు.</p>
      <Link href="/" className="mt-8 inline-block rounded-md bg-ink px-8 py-3 font-semibold text-paper transition-colors hover:bg-accent">
        హోమ్‌కి వెళ్ళండి
      </Link>
    </div>
  )
}
