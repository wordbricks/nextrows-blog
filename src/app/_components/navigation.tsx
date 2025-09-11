"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const initial: "light" | "dark" = saved === "light" ? "light" : saved === "dark" ? "dark" : mql.matches ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
    if (saved === "light" || saved === "dark") return;
    const handler = () => {
      const sysTheme: "light" | "dark" = mql.matches ? "dark" : "light";
      setTheme(sysTheme);
      applyTheme(sysTheme);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const applyTheme = (selected: "light" | "dark") => {
    document.documentElement.classList.toggle("dark", selected === "dark");
  };

  const toggleTheme = () => {
    const next: "light" | "dark" = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  return (
    <nav className="bg-white dark:bg-stone-900 shadow-md sticky top-0 z-50 transition-colors duration-200 border-b border-stone-200 dark:border-stone-800">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-1.5">
          <Image 
            src="/nextrows-logo-nav.png" 
            alt="NextRows Logo" 
            width={20} 
            height={24} 
            className="object-contain"
          />
          <span className="text-lg font-bold text-stone-900 dark:text-stone-50">
            NextRows Blog
          </span>
        </Link>
        <div className="hidden md:flex space-x-4 items-center">
          <Link href="/" className="text-sm text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-500 transition duration-300">
            Blog
          </Link>
          <button onClick={() => window.dispatchEvent(new Event('open-command-palette'))} className="text-sm text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-500 transition duration-300">
            Search <span className="ml-1 rounded border px-1 py-0.5 text-[10px] text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-600">⌘K</span>
          </button>
          <Link href="/contact" className="text-sm text-stone-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-500 transition duration-300">
            Contact
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors duration-200"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
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
            className="px-4 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-orange-700 hover:shadow-lg active:scale-95"
          >
            Go to NextRows
          </a>
        </div>
        <button
          className="md:hidden flex items-center"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
      <div className={`md:hidden bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="px-2 py-3 space-y-1">
          <Link 
            href="/" 
            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Blog
          </Link>
          <button 
            className="block w-full text-left px-3 py-2 text-base font-medium rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            onClick={() => {
              window.dispatchEvent(new Event('open-command-palette'))
              setIsMobileMenuOpen(false)
            }}
          >
            Search
          </button>
          <Link 
            href="/contact" 
            className="block px-3 py-2 text-base font-medium rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <button
            onClick={() => {
              toggleTheme();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center px-3 py-2 text-base font-medium rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 w-full text-left"
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>
          <a 
            href="https://nextrows.com?source=blog" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block px-3 py-2 text-base font-medium rounded-md bg-orange-600 text-white hover:bg-orange-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Go to NextRows
          </a>
        </div>
      </div>
    </nav>
  );
}
