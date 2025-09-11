import { MetadataRoute } from 'next'
import { HOST } from '@/env/host'
import { getEnv } from '@/env/getEnv'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = HOST[getEnv()]
  
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
