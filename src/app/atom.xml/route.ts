import { getAllPosts } from '@/lib/api'
import { NextResponse } from 'next/server'

export async function GET() {
  const posts = getAllPosts()
  const baseUrl = 'https://blog.nextrows.com'

  const sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const updated = new Date(sortedPosts[0]?.date || new Date()).toISOString()
  const year = new Date().getFullYear()

  const atom = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>NextRows Blog - Data Processing & Web Scraping Insights</title>
  <subtitle>Learn web scraping, data cleaning, and automation techniques with NextRows. Tutorials, guides, and insights to transform your data processing workflow.</subtitle>
  <id>${baseUrl}/</id>
  <updated>${updated}</updated>
  <link rel="alternate" type="text/html" href="${baseUrl}"/>
  <link rel="self" type="application/atom+xml" href="${baseUrl}/atom.xml"/>
  <rights>Copyright ${year} NextRows</rights>
  <author>
    <name>NextRows Team</name>
    <email>support@nextrows.com</email>
  </author>
  ${sortedPosts.slice(0, 50).map(post => {
    const postUrl = `${baseUrl}/posts/${post.slug}`
    const imageUrl = post.coverImage ? `${baseUrl}${post.coverImage}` : `${baseUrl}/opengraph-image`
    const category = post.category ? post.category.replace('-', ' ').charAt(0).toUpperCase() + post.category.replace('-', ' ').slice(1) : 'General'

    return `
  <entry>
    <title><![CDATA[${post.title}]]></title>
    <link rel="alternate" href="${postUrl}"/>
    <id>${postUrl}</id>
    <published>${new Date(post.date).toISOString()}</published>
    <updated>${new Date(post.date).toISOString()}</updated>
    <category term="${category}"/>
    <summary type="html"><![CDATA[${post.excerpt}]]></summary>
    <content type="html"><![CDATA[
      <img src="${imageUrl}" alt="${post.title}" />
      <p>${post.excerpt}</p>
      <p><a href="${postUrl}">Read more...</a></p>
    ]]></content>
  </entry>`
  }).join('')}
</feed>`

  return new NextResponse(atom, {
    headers: {
      'Content-Type': 'application/atom+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
