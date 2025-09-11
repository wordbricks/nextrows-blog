"use client";

import { Post } from "@/interfaces/post";
import Link from "next/link";
import DateFormatter from "@/app/_components/date-formatter";
import { useState, useEffect, useMemo, memo } from "react";
import BlogImage from "@/app/_components/blog-image";
import AnimatedSpreadsheet from "@/app/_components/animated-spreadsheet";

// Define category type
type Category = "all" | "tutorials" | "use-cases" | "technology" | "why-nextrows" | "others";

// Category display names
const categoryNames: Record<Category, string> = {
  all: "All",
  tutorials: "Tutorials",
  "use-cases": "Use Cases",
  technology: "Technology",
  "why-nextrows": "Why NextRows",
  others: "Others",
};

// Category colors for badges
const categoryColors: Record<string, string> = {
  tutorials: "text-orange-600 dark:text-orange-400",
  "use-cases": "text-emerald-600 dark:text-emerald-400",
  technology: "text-sky-600 dark:text-sky-400",
  "why-nextrows": "text-amber-600 dark:text-amber-400",
  others: "text-purple-600 dark:text-purple-400",
};

interface BlogClientProps {
  posts: Post[];
}

// Memoized Header Component
const BlogHeader = memo(() => (
  <header className="mb-8">
    <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">Row by Row, Toward Clarity</h1>
    <p className="text-base md:text-lg text-stone-600 dark:text-stone-400 text-center max-w-3xl mx-auto">
      Some chase gold, others chase glory. We chase clean tables.
      <br />
      This blog is where we share what we've learned—row by row, mistake by mistake, and sometimes with a laugh.
    </p>
  </header>
));
BlogHeader.displayName = 'BlogHeader';

// Memoized Featured Post Component
const FeaturedPost = memo(({ post }: { post: Post }) => (
  <div className="flex justify-center mb-10">
    <Link
      href={`/posts/${post.slug}`}
      className="block bg-white dark:bg-stone-800 rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-shadow duration-300 border border-stone-200 dark:border-stone-700 w-full max-w-[800px]"
    >
    <div className="w-full md:w-1/2 relative min-h-[256px] md:min-h-[320px] bg-stone-100 dark:bg-stone-900">
      <div className="absolute inset-0">
        <BlogImage
          src={post.coverImage}
          alt={`${post.title} - NextRows blog post about ${post.category?.replace("-", " ")}`}
          fallbackText={post.title.substring(0, 20)}
          fill
          className="object-cover object-center !w-full !h-full"
          priority
        />
      </div>
    </div>
    <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center">
      <span
        className={`text-xs font-semibold uppercase mb-2 ${
          categoryColors[post.category] || "text-gray-600"
        }`}
      >
        {post.category?.replace("-", " ")}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
        {post.title}
      </h2>
      <p className="text-stone-600 dark:text-stone-400 mb-4 text-sm md:text-base">
        {post.excerpt}
      </p>
      <div className="flex items-center">
        <div>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400">
            <DateFormatter dateString={post.date} /> · 8 min read
          </p>
        </div>
      </div>
    </div>
    </Link>
  </div>
));
FeaturedPost.displayName = 'FeaturedPost';

export default function BlogClient({ posts }: BlogClientProps) {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  // Memoize featured post - it never changes
  const featuredPost = useMemo(() => posts.length > 0 ? posts[0] : null, [posts]);

  // Memoize filtered posts calculation - maintains date order
  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") {
      return posts;
    }
    // Filter by category while maintaining the original date-sorted order
    return posts.filter((post) => post.category === activeFilter);
  }, [activeFilter, posts]);

  // Memoize filtered posts without featured
  const filteredPostsWithoutFeatured = useMemo(() => {
    return featuredPost 
      ? filteredPosts.filter(post => post.slug !== featuredPost.slug)
      : filteredPosts;
  }, [featuredPost, filteredPosts]);
  
  // Memoize pagination calculations
  const { totalPages, gridPosts } = useMemo(() => {
    const total = Math.ceil(filteredPostsWithoutFeatured.length / postsPerPage);
    
    let posts: Post[];
    if (featuredPost) {
      const startIndex = (currentPage - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      posts = filteredPostsWithoutFeatured.slice(startIndex, endIndex);
    } else {
      const startIndex = (currentPage - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      posts = filteredPosts.slice(startIndex, endIndex);
    }
    
    return { totalPages: total, gridPosts: posts };
  }, [currentPage, featuredPost, filteredPosts, filteredPostsWithoutFeatured, postsPerPage]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);


  return (
    <main>
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Animated Spreadsheet */}
        <AnimatedSpreadsheet />
        
        {/* Memoized Header - won't re-render on category changes */}
        <BlogHeader />

        {/* Memoized Featured Post - won't re-render on category changes */}
        {featuredPost && <FeaturedPost post={featuredPost} />}

        {/* Filter Section */}
        <div className="mb-10">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {(Object.keys(categoryNames) as Category[]).map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-3 py-1.5 text-xs md:text-sm font-medium border rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                  activeFilter === category
                    ? "bg-orange-600 text-white border-orange-600 shadow-md"
                    : "border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-sm"
                }`}
              >
                {categoryNames[category]}
              </button>
            ))}
          </div>
        </div>

        {/* Main Blog Posts Section */}
        <div className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group block bg-white dark:bg-stone-800 rounded-lg shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 ease-in-out border border-stone-200 dark:border-stone-700 hover:-translate-y-1"
              >
                <div className="relative h-40 w-full overflow-hidden">
                  <BlogImage
                    src={post.coverImage}
                    alt={`${post.title} - ${post.category?.replace("-", " ")} article on NextRows blog`}
                    fallbackText={post.title.substring(0, 20)}
                    fill
                    className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <span
                    className={`text-xs font-semibold uppercase ${
                      categoryColors[post.category] || "text-stone-600"
                    }`}
                  >
                    {post.category?.replace("-", " ")}
                  </span>
                  <h3 className="text-lg font-bold mt-2 mb-2 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center text-xs text-stone-500 dark:text-stone-400">
                    <p>
                      <DateFormatter dateString={post.date} />
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  currentPage === 1 
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed" 
                    : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first page, last page, current page, and adjacent pages
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  Math.abs(pageNumber - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-4 py-2 rounded-md transition-all duration-200 ${
                        currentPage === pageNumber
                          ? "bg-orange-600 text-white shadow-md"
                          : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-orange-600 dark:hover:text-orange-400"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="px-2">...</span>;
                }
                return null;
              })}
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  currentPage === totalPages 
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed" 
                    : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}