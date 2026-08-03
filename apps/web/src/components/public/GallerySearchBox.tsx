export function GallerySearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/gallery/search" method="GET" className="mt-6 flex gap-2">
      <input
        type="text"
        name="s"
        defaultValue={defaultValue}
        placeholder="Search albums or photo captions…"
        className="w-full max-w-sm rounded-full border border-line bg-paper-2 px-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:border-accent"
      />
      <button type="submit" className="rounded-full bg-accent-dark px-5 py-2 text-sm font-semibold text-on-accent transition-colors hover:opacity-90">
        Search
      </button>
    </form>
  )
}
