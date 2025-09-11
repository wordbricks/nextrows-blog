import RSS from 'rss';
import { getAllPosts } from '@/lib/api';

export async function GET() {
  const posts = getAllPosts();
  const siteUrl = 'https://blog.nextrows.com';

  const feed = new RSS({
    title: 'NextRows Blog',
    description: 'Learn web scraping, data cleaning, and automation techniques with NextRows.',
    site_url: siteUrl,
    feed_url: `${siteUrl}/feed.xml`,
    copyright: `${new Date().getFullYear()} NextRows`,
    language: 'en',
    pubDate: new Date(),
    ttl: 60,
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${siteUrl}/posts/${post.slug}`,
      categories: post.category ? [post.category] : [],
      author: post.author?.name || 'NextRows Team',
      date: new Date(post.date),
    });
  });

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}