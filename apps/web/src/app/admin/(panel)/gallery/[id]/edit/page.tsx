import { GalleryAlbumForm } from '@/components/admin/GalleryAlbumForm'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <GalleryAlbumForm id={Number(id)} />
}
