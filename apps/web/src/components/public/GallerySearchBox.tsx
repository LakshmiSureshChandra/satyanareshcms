export function GallerySearchBox({ defaultValue = '' }: { defaultValue?: string }) {
  return (
    <form action="/gallery/search" method="GET" className="mt-6 flex gap-2">
      <input
        type="text"
        name="s"
        defaultValue={defaultValue}
        placeholder="Search albums or photo captions…"
        className="w-full max-w-sm rounded-md border border-line bg-paper px-3.5 py-2 text-sm focus:border-accent focus:outline-none"
      />
      <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
        Search
      </button>
    </form>
  )
}
