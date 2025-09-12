import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/api'
import { HOST } from '@/env/host'
import { getEnv } from '@/env/getEnv'
import { BASE_PATH } from '@/env/basePath'
import { CATEGORIES } from '@/constants/category'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = `${HOST[getEnv()]}${BASE_PATH}`
  
  // Get all blog posts
  const posts = getAllPosts()
  
  // Sort posts by date to prioritize newer content
  const sortedPosts = posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  
  // Generate sitemap entries for blog posts with dynamic priority
  const blogPosts = sortedPosts.map((post, index) => {
    // Give higher priority to newer posts
    const priority = index < 5 ? 0.9 : index < 10 ? 0.8 : 0.7
    
    // More frequent updates for recent posts
    const changeFrequency: 'weekly' | 'monthly' = index < 5 ? 'weekly' : 'monthly'
    
    return {
      url: `${baseUrl}/posts/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency,
      priority,
    }
  })
  
  // Category pages
  const categoryPages = CATEGORIES.map(category => ({
    url: `${baseUrl}/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
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
    ...categoryPages,
    ...blogPosts,
  ]
}
