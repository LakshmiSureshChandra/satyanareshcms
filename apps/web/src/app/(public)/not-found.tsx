import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="grid-bg relative overflow-hidden">
      <div className="glow -top-32 right-0 size-[420px]" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 py-32 text-center sm:px-6">
        <p className="headline text-8xl text-line">404</p>
        <h1 className="headline mt-4 text-3xl">Page not found</h1>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-2">
          The page you are looking for may have been moved or removed, or the address may be incorrect.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/">
              Back to home
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
