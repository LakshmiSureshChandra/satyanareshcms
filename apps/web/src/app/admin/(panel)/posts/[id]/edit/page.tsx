import { PostForm } from '@/components/admin/PostForm'
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PostForm kind="post" id={Number(id)} />
}
