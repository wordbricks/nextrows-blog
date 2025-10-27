import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import { CMS_NAME } from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";
import DateFormatter from "@/app/(client)/_components/date-formatter";
import BlogImage from "@/app/(client)/_components/blog-image";
import { ArticleJsonLd } from "@/app/(client)/_components/json-ld";
import ArticleContent from "@/app/(client)/_components/article-content";
import { 
  generateSEOMetadata, 
  generateArticleStructuredData, 
  generateBreadcrumbStructuredData 
} from "@/app/(client)/_components/seo";
import { HOST } from "@/env/host";
import { getEnv } from "@/env/getEnv";
import { getCategoryColor, getCategoryLabel } from "@/constants/category";
import { cn } from "@/utils/cn";

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  const related = getAllPosts()
    .filter(p => p.slug !== post.slug && p.category === post.category)
    .slice(0, 3);

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: post.category ? getCategoryLabel(post.category) : 'Articles', url: post.category ? `/category/${post.category}` : '/' },
    { name: post.title, url: `/posts/${post.slug}` },
  ]);

  const articleData = generateArticleStructuredData({
    title: post.title,
    description: post.excerpt,
    url: `/posts/${post.slug}`,
    image: post.coverImage,
    author: post.author?.name || 'NextRows Team',
    publishedTime: post.date,
    keywords: post.category ? [post.category.replace('-', ' '), 'NextRows', 'data extraction', 'web scraping'] : [],
  });

  return (
    <>
      {/* Pagefind metadata for search results */}
      <span data-pagefind-meta="category" style={{ display: 'none' }}>{post.category}</span>
      <span data-pagefind-meta="date" style={{ display: 'none' }}>{post.date}</span>
      <span data-pagefind-meta="minutes" style={{ display: 'none' }}>{post.readingTimeMinutes}</span>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleData) }}
      />
      <ArticleJsonLd
        title={post.title}
        description={post.excerpt}
        url={`/posts/${post.slug}`}
        datePublished={post.date}
        authorName={post.author?.name}
        image={post.coverImage}
      />
      <div className="min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <main className="max-w-[1200px] mx-auto">
            <article className="px-4 md:px-8">
            <header className="mb-8">
              <Link href="/" className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:underline text-sm mb-4 inline-block">
                ← Back to all articles
              </Link>
              <div className="text-center">
                {post.category && (
                  <span className={cn("block text-sm font-semibold uppercase mb-2", getCategoryColor(post.category))}>
                    {getCategoryLabel(post.category)}
                  </span>
                )}
                <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-stone-900 dark:text-stone-100">
                  {post.title}
                </h1>
                <p className="text-sm text-stone-500 dark:text-stone-400">
                  {post.author?.name && `By ${post.author.name} · `}
                  <DateFormatter dateString={post.date} /> · {post.readingTimeMinutes} min read
                </p>
              </div>
            </header>
            
            {post.coverImage && (
              <div className="mb-8 flex justify-center">
                <div className="w-full max-w-2xl">
                  <BlogImage
                    src={post.coverImage}
                    alt={`${post.title} - Featured image for NextRows ${getCategoryLabel(post.category || '')} article`}
                    fallbackText={post.title.substring(0, 20)}
                    width={800}
                    height={533}
                    className="w-full h-auto rounded-lg shadow-lg"
                    priority
                    caption={
                      post.slug === "beginners-guide-web-crawling-python-vs-nextrows"
                        ? "Python BeautifulSoup vs. NextRows – Because life's too short for endless error messages."
                        : post.slug === "nextrows-api-alpha-announcement"
                        ? "NextRows API Alpha Released - Could crash, could conk out, but for now… magic happens."
                        : `${post.title} - Learn more about ${getCategoryLabel(post.category || '')} with NextRows`
                    }
                  />
                </div>
              </div>
            )}

            <ArticleContent content={content} />
            
            {/* Call to Action Section */}
            <div className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-700">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4 text-stone-900 dark:text-stone-100">
                  Want Clean Tables With Zero Stress?
                </h3>
                <p className="text-lg text-stone-600 dark:text-stone-400 mb-6 max-w-2xl mx-auto">
                  NextRows makes scraping and cleaning data simple. Our powerful AI Agent helps you save hours every week on repetitive tasks.
                </p>
                <div className="flex justify-center">
                  <a 
                    href="https://nextrows.com?source=blog-post"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  >
                    Try NextRows
                  </a>
                </div>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-4">
                  No credit card required • Free trial available
                </p>
              </div>
            </div>

            {related.length > 0 && (
              <div className="mt-16 pt-12 border-t border-stone-200 dark:border-stone-700">
                <h3 className="text-2xl font-bold mb-6">Related articles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {related.map(r => (
                    <Link
                      key={r.slug}
                      href={`/posts/${r.slug}`}
                      className="group block"
                    >
                      <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800 mb-4">
                        <BlogImage
                          src={r.coverImage}
                          alt={`${r.title} - ${getCategoryLabel(r.category || '')} article on NextRows blog`}
                          fallbackText={r.title.substring(0, 20)}
                          fill
                          className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-500 uppercase tracking-wide">
                          {getCategoryLabel(r.category || '')}
                        </span>
                        <h3 className="text-xl md:text-2xl font-semibold mt-2 mb-2 line-clamp-2 text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
                          {r.title}
                        </h3>
                        <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed mb-3">
                          {r.excerpt}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-stone-500">
                          <DateFormatter dateString={r.date} />
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            </article>
          </main>
        </div>
      </div>
    </>
  );
}

type Params = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const categoryKeywords: Record<string, string[]> = {
    'technology': ['technology', 'infrastructure', 'engineering', 'architecture'],
    'tutorials': ['tutorial', 'guide', 'how-to', 'walkthrough', 'step-by-step'],
    'use-cases': ['use case', 'case study', 'real-world', 'application', 'example'],
    'why-nextrows': ['comparison', 'vs', 'alternative', 'benefits', 'features'],
    'others': ['startup', 'culture', 'team', 'remote work'],
  };

  const keywords = post.category ? categoryKeywords[post.category] || [] : [];

  return generateSEOMetadata({
    title: post.title,
    description: post.excerpt,
    url: `/posts/${post.slug}`,
    image: `/posts/${post.slug}/opengraph-image`,
    author: post.author?.name,
    publishedTime: post.date,
    keywords: keywords,
    type: 'article',
  });
}

export async function generateStaticParams() {
  const posts = getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}
