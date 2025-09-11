import { getAllPosts } from '@/lib/api';
import { NextResponse } from 'next/server';

export async function GET() {
  const posts = getAllPosts();
  const baseUrl = 'https://blog.nextrows.com';
  
  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>NextRows Blog - Data Processing & Web Scraping Insights</title>
    <description>Learn web scraping, data cleaning, and automation techniques with NextRows. Tutorials, guides, and insights to transform your data processing workflow.</description>
    <link>${baseUrl}</link>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date(sortedPosts[0]?.date || new Date()).toUTCString()}</pubDate>
    <ttl>60</ttl>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <copyright>Copyright ${new Date().getFullYear()} NextRows</copyright>
    <managingEditor>support@nextrows.com (NextRows Team)</managingEditor>
    <webMaster>support@nextrows.com (NextRows Team)</webMaster>
    <category>Technology</category>
    <category>Web Scraping</category>
    <category>Data Processing</category>
    <generator>NextRows Blog RSS Generator</generator>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <image>
      <url>${baseUrl}/assets/nextrows-logo.svg</url>
      <title>NextRows Blog</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
      <description>NextRows - Data extraction and automation platform</description>
    </image>
    ${sortedPosts.slice(0, 50).map(post => {
      const postUrl = `${baseUrl}/posts/${post.slug}`;
      const imageUrl = post.coverImage ? `${baseUrl}${post.coverImage}` : `${baseUrl}/assets/blog/nextrows-og.jpg`;
      const category = post.category ? post.category.replace('-', ' ').charAt(0).toUpperCase() + post.category.replace('-', ' ').slice(1) : 'General';
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <dc:creator><![CDATA[${post.author?.name || 'NextRows Team'}]]></dc:creator>
      <category><![CDATA[${category}]]></category>
      <media:content url="${imageUrl}" medium="image" />
      <media:thumbnail url="${imageUrl}" />
      <content:encoded><![CDATA[
        <img src="${imageUrl}" alt="${post.title}" />
        <p>${post.excerpt}</p>
        <p><a href="${postUrl}">Read more...</a></p>
      ]]></content:encoded>
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}