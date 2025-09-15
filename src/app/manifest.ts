import type { MetadataRoute } from 'next'
import { BASE_PATH } from '@/env/basePath'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NextRows Blog',
    short_name: 'NextRows',
    start_url: `${BASE_PATH}/`,
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: `${BASE_PATH}/favicon/android-chrome-192x192.png`,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: `${BASE_PATH}/favicon/android-chrome-512x512.png`,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}

