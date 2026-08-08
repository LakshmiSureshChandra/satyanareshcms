import { notFound } from 'next/navigation'

// Polls are hidden from the public site entirely (admin can still manage
// them under Admin → Polls) — this route 404s rather than being deleted, so
// no old link (bookmarked, indexed, or shared) silently breaks into a
// different page.
export default function PollsArchivePage() {
  notFound()
}
