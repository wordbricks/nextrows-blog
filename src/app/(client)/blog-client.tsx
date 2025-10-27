"use client";

import { Post } from "@/interfaces/post";
import Link from "next/link";
import DateFormatter from "@/app/(client)/_components/date-formatter";
import { useState, useEffect, useMemo, memo } from "react";
import BlogImage from "@/app/(client)/_components/blog-image";
import FeaturedCarousel from "@/app/(client)/_components/featured-carousel";

import { CATEGORIES, type Category, getCategoryColor, getCategoryLabel } from "@/constants/category";
import { cn } from "@/utils/cn";
type Filter = "all" | Category;

interface BlogClientProps {
  posts: Post[];
  initialCategory?: string;
}

// Memoized Header Component
const BlogHeader = memo(() => (
  <header className="mb-20 mt-12">
    <div className="text-center space-y-2 max-w-3xl mx-auto">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-stone-900 dark:text-stone-50 tracking-tight">
        NextRows Blog
      </h1>
      <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 font-normal tracking-tight">
        Insights on data processing and automation.
      </p>
    </div>
  </header>
));
BlogHeader.displayName = 'BlogHeader';


export default function BlogClient({ posts, initialCategory }: BlogClientProps) {
  const initialCat: Filter = initialCategory && (CATEGORIES as readonly string[]).includes(initialCategory)
    ? (initialCategory as Category)
    : "all";
  const [activeFilter, setActiveFilter] = useState<Filter>(initialCat);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 9;

  // Skip first 5 posts as they're featured
  const remainingPosts = useMemo(() => posts.slice(5), [posts]);


  // Memoize filtered posts calculation - maintains date order
  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") {
      return remainingPosts;
    }
    // Filter by category while maintaining the original date-sorted order
    return remainingPosts.filter((post) => post.category === activeFilter);
  }, [activeFilter, remainingPosts]);

  
  // Memoize pagination calculations
  const { totalPages, gridPosts } = useMemo(() => {
    const total = Math.ceil(filteredPosts.length / postsPerPage);
    const startIndex = (currentPage - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const posts = filteredPosts.slice(startIndex, endIndex);

    return { totalPages: total, gridPosts: posts };
  }, [currentPage, filteredPosts, postsPerPage]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);


  return (
    <main>
      {/* Show header only on homepage (no initial category) */}
      {!initialCategory && (
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10">
          <BlogHeader />
        </div>
      )}

      {/* Featured Use Cases Carousel - shows top 5 posts - full width */}
      {!initialCategory && posts.length >= 5 && <FeaturedCarousel posts={posts} />}

      <div className="max-w-[1280px] mx-auto px-4 md:px-6 py-8 md:py-10">

        {/* Filter Section */}
        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-2">
            {(["all", ...CATEGORIES] as Filter[]).map((category) => {
              const isActive = activeFilter === category;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setActiveFilter(category);
                    setCurrentPage(1); // Reset to first page when changing filter
                  }}
                  className={cn(
                    "px-5 py-2 text-sm font-medium rounded-full transition-all duration-200",
                    isActive && "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900",
                    !isActive && "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  {category === 'all' ? 'All' : getCategoryLabel(category)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Blog Posts Section */}
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {gridPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group block"
              >
                <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-stone-100 dark:bg-stone-800 mb-4">
                  <BlogImage
                    src={post.coverImage}
                    alt={`${post.title} - ${getCategoryLabel(post.category)} article on NextRows blog`}
                    fallbackText={post.title.substring(0, 20)}
                    fill
                    className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-500 uppercase tracking-wide">
                    {getCategoryLabel(post.category)}
                  </span>
                  <h3 className="text-xl md:text-2xl font-semibold mt-2 mb-2 line-clamp-2 text-stone-900 dark:text-stone-50 tracking-tight leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-stone-600 dark:text-stone-400 text-sm line-clamp-2 leading-relaxed mb-3">
                    {post.excerpt}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-500">
                    <DateFormatter dateString={post.date} />
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentPage === 1 && "text-stone-300 dark:text-stone-700 cursor-not-allowed",
                  currentPage !== 1 && "text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  Math.abs(pageNumber - currentPage) <= 1
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-colors",
                        currentPage === pageNumber && "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900",
                        currentPage !== pageNumber && "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                      )}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="px-1 text-stone-400">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  currentPage === totalPages && "text-stone-300 dark:text-stone-700 cursor-not-allowed",
                  currentPage !== totalPages && "text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                )}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div> {/* Close max-w-[1280px] container */}
    </main>
  );
}
