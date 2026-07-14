// Serves the admin-editable robots.txt (Settings → robots.txt) verbatim,
// always appending the sitemap line if the admin didn't include one.
export const revalidate = 3600

export async function GET() {
  const API = process.env.API_URL || 'http://127.0.0.1:4000'
  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  let body = 'User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api'
  try {
    const res = await fetch(`${API}/api/robots`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const text = await res.text()
      if (text.trim()) body = text.trim()
    }
  } catch {
    // fall back to default on API error
  }

  if (!/^sitemap:/im.test(body)) body = `${body}\n\nSitemap: ${SITE}/sitemap.xml`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
