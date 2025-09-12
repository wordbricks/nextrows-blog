import { NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/api'

export function GET() {
  const posts = getAllPosts()
  const items = posts.map(p => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content || '',
    category: p.category || '',
    date: p.date,
    coverImage: p.coverImage || ''
  }))
  return NextResponse.json({ items })
}

