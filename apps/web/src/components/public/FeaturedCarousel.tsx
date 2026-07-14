'use client'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import { PostCard } from './PostCard'
import type { PostCard as PostCardType } from '@/lib/api'

export function FeaturedCarousel({ posts }: { posts: PostCardType[] }) {
  return (
    <Swiper
      modules={[Autoplay]}
      autoplay={{ delay: 4500, pauseOnMouseEnter: true }}
      loop={posts.length > 3}
      spaceBetween={28}
      slidesPerView={1.15}
      breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
    >
      {posts.map((p) => (
        <SwiperSlide key={p.id}>
          <PostCard post={p} />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
