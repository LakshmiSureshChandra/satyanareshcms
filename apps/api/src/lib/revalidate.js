// Fire-and-forget: tell Next.js to rebuild affected pages after admin mutations.
// Call Next directly on localhost (not the public URL) so it doesn't depend on
// the reverse proxy routing /api/revalidate correctly.
export function revalidate(paths) {
  const base = process.env.REVALIDATE_URL || 'http://127.0.0.1:3000'
  fetch(`${base}/api/revalidate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: process.env.REVALIDATE_TOKEN, paths }),
  }).catch(() => {})
}
