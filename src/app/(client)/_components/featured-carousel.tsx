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
  const [isAnimating, setIsAnimating] = useState(false);

  // Take top 5 posts as featured use cases
  const featuredPosts = posts.slice(0, 5);

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnimating || currentIndex === 0) return; // Don't go before first card

    setIsAnimating(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAnimating || currentIndex === featuredPosts.length - 1) return; // Don't go past last card

    setIsAnimating(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsAnimating(false), 800);
  };

  if (featuredPosts.length === 0) return null;

  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === featuredPosts.length - 1;

  // Fixed card width and gap for consistent spacing
  const cardWidth = 780; // width in pixels - increased by 120% for larger cards
  const cardGap = 48; // gap between cards in pixels - slightly increased for better spacing

  // Calculate the offset to center the active card
  const calculateOffset = () => {
    // Start position centers first card, then shift by card width + gap for each index
    const baseOffset = currentIndex * (cardWidth + cardGap);
    return -baseOffset;
  };

  return (
    <div className="mb-24 w-full overflow-hidden">
      {/* Carousel Container */}
      <div className="relative px-4 md:px-8">
        {/* Left Arrow - Disabled on first card */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isAnimating || isFirstCard}
          className={cn(
            "absolute left-2 md:left-4 lg:left-8 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg flex-shrink-0",
            isFirstCard || isAnimating
              ? "bg-stone-300/50 dark:bg-stone-700/50 cursor-not-allowed opacity-50"
              : "bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-800"
          )}
          aria-label="Previous featured article"
        >
          <IconChevronLeft size={28} className={cn(
            isFirstCard ? "text-stone-500 dark:text-stone-600" : "text-stone-900 dark:text-stone-100"
          )} />
        </button>

        {/* Carousel Track with Sliding Animation */}
        <div className="relative flex items-center justify-center h-80 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Container that slides all cards together */}
            <div
              className="flex gap-12 transition-transform duration-800 ease-out items-center"
              style={{
                transform: `translateX(calc(50% - ${cardWidth/2}px + ${calculateOffset()}px))`,
              }}
            >
              {featuredPosts.map((post, index) => {
                const isActive = index === currentIndex;

                return (
                  <div
                    key={post.slug}
                    className={cn(
                      "flex-shrink-0 transition-all duration-800 ease-out",
                      isActive ? "scale-105" : "opacity-40 scale-95"
                    )}
                    style={{
                      width: `${cardWidth}px`,
                      maxWidth: "80vw",
                    }}
                  >
                    <Link
                      href={`/posts/${post.slug}`}
                      className={cn(
                        "block bg-white dark:bg-stone-900 rounded-3xl overflow-hidden h-80 shadow-xl cursor-pointer"
                      )}
                      onClick={(e) => {
                        if (!isActive) {
                          e.preventDefault();
                          // Clicking on previous card
                          if (index < currentIndex) {
                            handlePrevious(e);
                          }
                          // Clicking on next card
                          else if (index > currentIndex) {
                            handleNext(e);
                          }
                        }
                      }}
                    >
                      <div className="flex flex-col md:flex-row h-full">
                        {/* Image Section */}
                        <div className="relative bg-stone-100 dark:bg-stone-800 h-48 md:h-full md:w-1/2">
                          <BlogImage
                            src={post.coverImage}
                            alt={`${post.title} - NextRows blog post about ${getCategoryLabel(post.category)}`}
                            fallbackText={post.title.substring(0, 20)}
                            fill
                            className="object-cover object-center"
                            priority={isActive}
                          />
                        </div>

                        {/* Content Section */}
                        <div className="flex flex-col justify-center p-6 md:p-8 md:w-1/2">
                          <div className="mb-4">
                            <span className="font-medium text-orange-600 dark:text-orange-500 uppercase tracking-wide text-xs">
                              {getCategoryLabel(post.category)}
                            </span>
                          </div>

                          <h3 className="font-semibold leading-tight text-stone-900 dark:text-stone-50 tracking-tight line-clamp-2 mb-4 text-2xl lg:text-3xl">
                            {post.title}
                          </h3>

                          <p className="text-stone-600 dark:text-stone-400 mb-6 line-clamp-2 text-sm md:text-base">
                            {post.excerpt}
                          </p>

                          <div className="text-xs text-stone-500 dark:text-stone-500">
                            <DateFormatter dateString={post.date} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Arrow - Disabled on last card */}
        <button
          type="button"
          onClick={handleNext}
          disabled={isAnimating || isLastCard}
          className={cn(
            "absolute right-2 md:right-4 lg:right-8 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg flex-shrink-0",
            isLastCard || isAnimating
              ? "bg-stone-300/50 dark:bg-stone-700/50 cursor-not-allowed opacity-50"
              : "bg-white/90 dark:bg-stone-900/90 hover:bg-white dark:hover:bg-stone-800"
          )}
          aria-label="Next featured article"
        >
          <IconChevronRight size={28} className={cn(
            isLastCard ? "text-stone-500 dark:text-stone-600" : "text-stone-900 dark:text-stone-100"
          )} />
        </button>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {featuredPosts.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(index);
                  setTimeout(() => setIsAnimating(false), 800);
                }
              }}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentIndex === index
                  ? "w-8 bg-orange-600 dark:bg-orange-500"
                  : "w-2 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

FeaturedCarousel.displayName = "FeaturedCarousel";

export default FeaturedCarousel;