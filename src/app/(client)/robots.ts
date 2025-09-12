import { MetadataRoute } from 'next'
import { HOST } from '@/env/host'
import { getEnv } from '@/env/getEnv'
import { BASE_PATH } from '@/env/basePath'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = `${HOST[getEnv()]}${BASE_PATH}`
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
