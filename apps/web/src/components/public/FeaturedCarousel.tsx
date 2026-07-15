import { PostCard } from './PostCard'
import type { PostCard as PostCardType } from '@/lib/api'

// CSS scroll-snap rail — swipeable on touch, no JS. (Replaced Swiper.)
export function FeaturedCarousel({ posts }: { posts: PostCardType[] }) {
  return (
    <div className="rail">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  )
}
