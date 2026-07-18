import { PollForm } from '@/components/admin/PollForm'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PollForm id={Number(id)} />
}
