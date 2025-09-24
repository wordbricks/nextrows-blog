"use client";

import TableOfContents from "./table-of-contents";
import { useEffect } from "react";

interface ArticleContentProps {
  content: string;
}

export default function ArticleContent({ content }: ArticleContentProps) {
  useEffect(() => {
    // Add IDs to headings that don't have them
    const headings = document.querySelectorAll(".markdown h1, .markdown h2, .markdown h3, .markdown h4");
    headings.forEach((heading) => {
      if (!heading.id) {
        const text = heading.textContent || "";
        const id = text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
        heading.id = id;
      }
    });
  }, []);

  return (
    <div className="flex gap-8">
      {/* Table of Contents - Left Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <TableOfContents content={content} />
      </aside>

      {/* Article Content */}
      <div className="flex-1 min-w-0">
        <div
          className="prose prose-xl prose-stone dark:prose-invert max-w-none markdown leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}