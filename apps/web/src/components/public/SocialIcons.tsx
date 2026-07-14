import type { Settings } from '@/lib/api'

const ICONS: [string, string, string][] = [
  ['facebook_link', 'Facebook', 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z'],
  ['twitter_link', 'X', 'M4 4l7.2 9.6L4.4 20h2.6l5.4-5.1L16.8 20H20l-7.5-10L19.4 4h-2.6l-4.9 4.7L8 4H4z'],
  ['instagram_link', 'Instagram', 'M16 3H8a5 5 0 00-5 5v8a5 5 0 005 5h8a5 5 0 005-5V8a5 5 0 00-5-5zm-4 12.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5zM17 7.5a1 1 0 111-1 1 1 0 01-1 1z'],
  ['youtube_link', 'YouTube', 'M22 8.2a3 3 0 00-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 002 8.2 31 31 0 001.5 12 31 31 0 002 15.8a3 3 0 002.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 002.1-2.1A31 31 0 0022.5 12 31 31 0 0022 8.2zM10 15V9l5.2 3z'],
  ['linkedin_link', 'LinkedIn', 'M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.7h.1a4.2 4.2 0 013.8-2.1c4 0 4.8 2.7 4.8 6.1V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z'],
]

export function SocialIcons({ settings, className = 'h-5 w-5' }: { settings: Settings; className?: string }) {
  const links = ICONS.filter(([key]) => settings[key])
  if (!links.length) return null
  return (
    <div className="flex items-center gap-3">
      {links.map(([key, label, d]) => (
        <a
          key={key}
          href={settings[key]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-ink-soft transition-colors hover:text-accent"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d={d} />
          </svg>
        </a>
      ))}
    </div>
  )
}
