import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AK Ganesh',
    short_name: 'AK Ganesh',
    description: 'Telugu news and stories',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfaf7',
    theme_color: '#8e1f22',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
