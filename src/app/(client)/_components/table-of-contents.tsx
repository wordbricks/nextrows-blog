"use client";

import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

export default function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Extract only h1 and h2 headings from the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, "text/html");
    const headingElements = doc.querySelectorAll("h1, h2");

    const items: TOCItem[] = Array.from(headingElements).map((heading) => {
      const id = heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "") || "";
      const level = parseInt(heading.tagName.substring(1));

      // Add ID to the actual heading element in the DOM if it doesn't have one
      if (!heading.id && typeof window !== "undefined") {
        setTimeout(() => {
          const actualHeading = document.querySelector(
            `h${level}:not([id])`
          ) as HTMLElement;
          if (actualHeading && actualHeading.textContent === heading.textContent) {
            actualHeading.id = id;
          }
        }, 100);
      }

      return {
        id,
        text: heading.textContent || "",
        level,
      };
    });

    setHeadings(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -70% 0%",
        threshold: 0.1
      }
    );

    // Observe all heading elements
    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-4">
        On This Page
      </h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className={cn(
                "block py-1 pr-2 border-l-2 transition-all duration-200 hover:text-orange-600 dark:hover:text-orange-500",
                activeId === heading.id
                  ? "border-orange-600 text-orange-600 dark:text-orange-500 font-medium"
                  : "border-transparent text-stone-600 dark:text-stone-400 hover:border-stone-300 dark:hover:border-stone-600"
              )}
              style={{
                paddingLeft: heading.level === 1 ? "1rem" : `${0.5 + (heading.level - 1) * 0.5}rem`
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}