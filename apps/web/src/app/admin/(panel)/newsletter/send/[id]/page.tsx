import { NewsletterSendForm } from '@/components/admin/NewsletterSendForm'

export default async function NewsletterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <NewsletterSendForm id={Number(id)} />
}
