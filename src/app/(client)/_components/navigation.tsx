"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/utils/cn";
import { BASE_PATH } from "@/env/basePath";
import { useCommandPalette } from "@/app/(client)/_components/command-palette-context";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const { openPalette } = useCommandPalette();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const pathNoBase = pathname && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || "/" : pathname || "/";
  const isContact = pathNoBase === "/contact";
  const isSearch = pathNoBase === "/search" || pathNoBase.startsWith("/search/");
  const isBlog = pathNoBase === "/" || pathNoBase.startsWith("/posts") || pathNoBase.startsWith("/category");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme");
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const initial: "light" | "dark" = saved === "light" ? "light" : saved === "dark" ? "dark" : mql.matches ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);

    if (saved === "light" || saved === "dark") return;

    const handler = (e: MediaQueryListEvent) => {
      const sysTheme: "light" | "dark" = e.matches ? "dark" : "light";
      setTheme(sysTheme);
      applyTheme(sysTheme);
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []); // Empty dependency array to run only once on mount

  const applyTheme = (selected: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", selected === "dark");
  };

  const toggleTheme = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const next: "light" | "dark" = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <nav className="bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl sticky top-0 z-50 transition-colors border-b border-stone-200/50 dark:border-stone-800/50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={`${BASE_PATH}/nextrows-logo-nav.png`}
            alt="NextRows Logo"
            width={20}
            height={24}
            className="w-5 h-6 object-contain"
          />
          <span className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            NextRows
          </span>
        </Link>
        <div className="hidden md:flex space-x-8 items-center">
          <Link
            href="/"
            aria-current={isBlog ? "page" : undefined}
            className={cn(
              "text-sm transition-colors",
              isBlog ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            )}
          >
            Blog
          </Link>
          <button
            aria-current={isSearch ? "page" : undefined}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPalette();
            }}
            className={cn(
              "text-sm transition-colors",
              isSearch ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            )}
          >
            Search
          </button>
          <Link
            href="/contact"
            aria-current={isContact ? "page" : undefined}
            className={cn(
              "text-sm transition-colors",
              isContact ? "text-stone-900 dark:text-stone-100" : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            )}
          >
            Contact
          </Link>
          <button
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              // Show a neutral icon during SSR to prevent hydration mismatch
              <div className="h-4 w-4 bg-stone-400 rounded"></div>
            ) : theme === "light" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-stone-700 dark:text-stone-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-stone-700 dark:text-stone-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            )}
          </button>
          <a
            href="https://nextrows.com?source=blog"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-sm font-medium rounded-full hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
          >
            Get Started
          </a>
        </div>
        <button
          className="md:hidden flex items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileMenuOpen(!isMobileMenuOpen);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-stone-800 dark:text-stone-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </div>
      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden bg-white/80 dark:bg-stone-950/80 backdrop-blur-xl border-t border-stone-200/50 dark:border-stone-800/50",
        isMobileMenuOpen && "block",
        !isMobileMenuOpen && "hidden"
      )}>
        <div className="px-6 py-4 space-y-1">
          <Link
            href="/"
            aria-current={isBlog ? "page" : undefined}
            className={cn(
              "block px-3 py-2 text-base rounded-lg transition-colors",
              isBlog ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800" : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <button
            aria-current={isSearch ? "page" : undefined}
            className={cn(
              "block w-full text-left px-3 py-2 text-base rounded-lg transition-colors",
              isSearch ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800" : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              openPalette();
              setIsMobileMenuOpen(false);
            }}
          >
            Search
          </button>
          <Link
            href="/contact"
            aria-current={isContact ? "page" : undefined}
            className={cn(
              "block px-3 py-2 text-base rounded-lg transition-colors",
              isContact ? "text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800" : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <div className="pt-4 mt-4 border-t border-stone-200 dark:border-stone-800">
            <a
              href="https://nextrows.com?source=blog"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-base font-medium text-center rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
