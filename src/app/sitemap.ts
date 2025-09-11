import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/api'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://blog.nextrows.com' // Update this to your actual domain
  
  // Get all blog posts
  const posts = getAllPosts()
  
  // Generate sitemap entries for blog posts
  const blogPosts = posts.map((post) => ({
    url: `${baseUrl}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...blogPosts,
  ]
}