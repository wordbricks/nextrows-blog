import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/api";
import { CMS_NAME } from "@/lib/constants";
import markdownToHtml from "@/lib/markdownToHtml";
import DateFormatter from "@/app/_components/date-formatter";
import BlogImage from "@/app/_components/blog-image";
import { ArticleJsonLd } from "@/app/_components/json-ld";
import { 
  generateSEOMetadata, 
  generateArticleStructuredData, 
  generateBreadcrumbStructuredData 
} from "@/app/_components/seo";
import { HOST } from "@/env/host";
import { getEnv } from "@/env/getEnv";

export default async function Post(props: Params) {
  const params = await props.params;
  const post = getPostBySlug(params.slug);

  if (!post) {
    return notFound();
  }

  const content = await markdownToHtml(post.content || "");

  // Category colors
  const categoryColors: Record<string, string> = {
    tutorials: "text-orange-600 dark:text-orange-400",
    "use-cases": "text-emerald-600 dark:text-emerald-400",
    technology: "text-sky-600 dark:text-sky-400",
    "why-nextrows": "text-amber-600 dark:text-amber-400",
    others: "text-purple-600 dark:text-purple-400",
  };

  const breadcrumbData = generateBreadcrumbStructuredData([
    { name: 'Home', url: HOST[getEnv()] },
    { name: post.category ? post.category.replace('-', ' ').charAt(0).toUpperCase() + post.category.replace('-', ' ').slice(1) : 'Articles', url: `${HOST[getEnv()]}/${post.category || 'posts'}` },
    { name: post.title, url: `${HOST[getEnv()]}/posts/${post.slug}` },
  ]);

  const articleData = generateArticleStructuredData({
    title: post.title,
    description: post.excerpt,
    url: `${HOST[getEnv()]}/posts/${post.slug}`,
    image: post.coverImage,
    author: post.author?.name || 'NextRows Team',
    publishedTime: post.date,
    keywords: post.category ? [post.category.replace('-', ' '), 'NextRows', 'data extraction', 'web scraping'] : [],
  });

  return (
    <>
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
        url={`${HOST[getEnv()]}/posts/${post.slug}`}
        datePublished={post.date}
        authorName={post.author?.name}
        image={post.coverImage}
      />
      <div className="bg-stone-50 dark:bg-stone-950 min-h-screen">
        <div className="container mx-auto px-6 py-12">
          <main className="max-w-3xl mx-auto">
            <article className="bg-white dark:bg-stone-900 p-8 md:p-12 rounded-lg shadow-lg">
            <header className="mb-8 text-center">
              <Link href="/" className="text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 hover:underline text-sm mb-4 inline-block">
                ← Back to all articles
              </Link>
              {post.category && (
                <span className={`block text-sm font-semibold uppercase mb-2 ${
                  categoryColors[post.category] || "text-stone-600"
                }`}>
                  {post.category.replace("-", " ")}
                </span>
              )}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-stone-900 dark:text-stone-100">
                {post.title}
              </h1>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {post.author?.name && `By ${post.author.name} · `}
                <DateFormatter dateString={post.date} />
              </p>
            </header>
            
            {post.coverImage && (
              <div className="mb-8 flex justify-center">
                <div className="w-full max-w-4xl">
                  <BlogImage
                    src={post.coverImage}
                    alt={`${post.title} - Featured image for NextRows ${post.category?.replace("-", " ")} article`}
                    fallbackText={post.title.substring(0, 20)}
                    width={1200}
                    height={800}
                    className="w-full h-auto rounded-lg shadow-lg"
                    priority
                    caption={
                      post.slug === "beginners-guide-web-crawling-python-vs-nextrows" 
                        ? "Python BeautifulSoup vs. NextRows – Because life's too short for endless error messages."
                        : post.slug === "nextrows-api-alpha-announcement"
                        ? "NextRows API Alpha Released - Could crash, could conk out, but for now… magic happens."
                        : `${post.title} - Learn more about ${post.category?.replace("-", " ")} with NextRows`
                    }
                  />
                </div>
              </div>
            )}
            
            <div 
              className="prose prose-xl prose-stone dark:prose-invert max-w-none markdown leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            
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
    url: `${HOST[getEnv()]}/posts/${post.slug}`,
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
