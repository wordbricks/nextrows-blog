"use client";

import { useState, memo } from "react";
import Link from "next/link";
import { Post } from "@/interfaces/post";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import BlogImage from "./blog-image";
import DateFormatter from "./date-formatter";
import { getCategoryColor, getCategoryLabel } from "@/constants/category";
import { cn } from "@/utils/cn";

interface FeaturedCarouselProps {
  posts: Post[];
}

const FeaturedCarousel = memo(({ posts }: FeaturedCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Take top 3 posts as featured
  const featuredPosts = posts.slice(0, 3);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? featuredPosts.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === featuredPosts.length - 1 ? 0 : prev + 1));
  };

  if (featuredPosts.length === 0) return null;

  const currentPost = featuredPosts[currentIndex];

  return (
    <div className="mb-12 max-w-[1200px] mx-auto">
      {/* Featured Articles Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-stone-900 dark:text-stone-100">
          Featured Articles
        </h2>
        <div className="w-20 h-0.5 bg-orange-600 mx-auto mt-2"></div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        <div className="flex justify-center items-center gap-4">
          {/* Left Arrow - Outside the box */}
          <button
            onClick={handlePrevious}
            className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-700 group"
            aria-label="Previous featured article"
          >
            <IconChevronLeft size={24} className="text-stone-700 dark:text-stone-300 group-hover:text-orange-600 dark:group-hover:text-orange-500" />
          </button>

          {/* Main Featured Post Card */}
          <div className="max-w-[700px] w-full">
            <Link
              href={`/posts/${currentPost.slug}`}
              className="block bg-white dark:bg-stone-800 rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition-all duration-300 border border-stone-200 dark:border-stone-700 hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-700 group animate-fade-in h-[320px] md:h-[320px]"
            >
            <div className="w-full md:w-1/2 relative h-full bg-stone-100 dark:bg-stone-900">
              <div className="absolute inset-0">
                <BlogImage
                  src={currentPost.coverImage}
                  alt={`${currentPost.title} - NextRows blog post about ${getCategoryLabel(currentPost.category)}`}
                  fallbackText={currentPost.title.substring(0, 20)}
                  fill
                  className="object-cover object-center !w-full !h-full"
                  priority
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between h-full">
              <div>
                <span
                  className={cn("text-xs font-semibold uppercase mb-2 block", getCategoryColor(currentPost.category))}
                >
                  {getCategoryLabel(currentPost.category)}
                </span>
                <h3 className="text-xl md:text-2xl font-bold leading-tight mb-3 line-clamp-2">
                  {currentPost.title}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 text-sm md:text-base line-clamp-3">
                  {currentPost.excerpt}
                </p>
              </div>
              <div className="mt-4">
                <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400">
                  <DateFormatter dateString={currentPost.date} /> · {currentPost.readingTimeMinutes} min read
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Right Arrow - Outside the box */}
        <button
          onClick={handleNext}
          className="p-2 bg-white dark:bg-stone-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-stone-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-700 group"
          aria-label="Next featured article"
        >
          <IconChevronRight size={24} className="text-stone-700 dark:text-stone-300 group-hover:text-orange-600 dark:group-hover:text-orange-500" />
        </button>
      </div>
    </div>

    {/* Carousel Indicators */}
    <div className="flex justify-center mt-4 space-x-2">
      {featuredPosts.map((_, index) => (
        <button
          key={index}
          onClick={() => setCurrentIndex(index)}
          className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            index === currentIndex
              ? "w-8 bg-orange-600"
              : "bg-stone-300 dark:bg-stone-600 hover:bg-stone-400 dark:hover:bg-stone-500"
          )}
          aria-label={`Go to featured article ${index + 1}`}
        />
      ))}
    </div>
  </div>
  );
});

FeaturedCarousel.displayName = 'FeaturedCarousel';

export default FeaturedCarousel;