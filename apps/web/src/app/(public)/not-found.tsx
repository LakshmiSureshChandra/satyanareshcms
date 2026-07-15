import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="headline bg-gradient-to-r from-accent to-amber-500 bg-clip-text text-8xl text-transparent">404</p>
      <h1 className="headline mt-4 text-3xl">అయ్యో! పేజీ కనబడలేదు</h1>
      <p className="mt-2 text-sm text-ink-soft">మీరు వెతుకుతున్న పేజీ తొలగించబడి ఉండవచ్చు లేదా చిరునామా తప్పు కావచ్చు.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-ink px-8 py-3 font-semibold text-paper transition-transform hover:scale-105">
        హోమ్‌కి వెళ్ళండి →
      </Link>
    </div>
  )
}
