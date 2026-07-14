// Fire-and-forget: tell Next.js to rebuild affected pages after admin mutations.
export function revalidate(paths) {
  const base = process.env.WEB_URL || 'http://localhost:3000'
  fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: process.env.REVALIDATE_TOKEN, paths }),
  }).catch(() => {})
}
