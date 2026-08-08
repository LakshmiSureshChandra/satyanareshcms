import { notFound } from 'next/navigation'

// Polls are hidden from the public site entirely — see /polls/page.tsx
export default function PollDetailPage() {
  notFound()
}
