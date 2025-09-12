import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/api";
import BlogClient from "@/app/blog-client";
import { generateSEOMetadata } from "@/app/_components/seo";
import { HOST } from "@/env/host";
import { getEnv } from "@/env/getEnv";
import { CATEGORIES, isCategory, getCategoryLabel } from "@/constants/category";

type Params = {
  params: Promise<{
    category: string;
  }>;
};

export default async function CategoryPage(props: Params) {
  const params = await props.params;
  const cat = params.category;
  const isValid = isCategory(cat);
  if (!isValid) return notFound();

  const posts = getAllPosts();

  return (
    <main>
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold capitalize">{getCategoryLabel(cat)}</h1>
          <p className="text-stone-600 dark:text-stone-400">Articles in the {getCategoryLabel(cat)} category</p>
        </header>
        <BlogClient posts={posts} initialCategory={cat} />
      </div>
    </main>
  );
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  const cats = new Set<string>();
  posts.forEach(p => { if (p.category) cats.add(p.category); });
  const allowed = new Set<string>([...CATEGORIES]);
  const params = Array.from(cats).filter(c => allowed.has(c)).map(c => ({ category: c }));
  return params;
}

export async function generateMetadata(props: Params): Promise<Metadata> {
  const params = await props.params;
  const cat = params.category;
  const title = `${getCategoryLabel(cat)}`;
  const url = `/category/${cat}`;
  return generateSEOMetadata({
    title: `Category: ${title}`,
    description: `Read posts from the ${title} category on NextRows Blog.`,
    url,
    type: 'website',
    keywords: [title, 'NextRows', 'blog'],
  });
}
