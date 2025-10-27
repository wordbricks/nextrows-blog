import Link from "next/link";
import {
  IconBrandX,
  IconBrandYoutube,
  IconBrandGithub,
  IconRss,
} from "@tabler/icons-react";
export function Footer() {
  return (
    <footer className="bg-stone-50 dark:bg-stone-950 mt-24 border-t border-stone-200 dark:border-stone-800">
      <div className="container mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
          <div className="flex gap-6">
            <a
              href="https://x.com/nextrows_com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NextRows on X"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <IconBrandX className="h-5 w-5" />
            </a>
            <a
              href="https://www.youtube.com/@NextRows_official"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NextRows on YouTube"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <IconBrandYoutube className="h-5 w-5" />
            </a>
            <a
              href="https://github.com/wordbricks/next-eval"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Wordbricks on GitHub"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <IconBrandGithub className="h-5 w-5" />
            </a>
            <Link
              href="/atom.xml"
              aria-label="RSS feed"
              className="text-stone-400 dark:text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            >
              <IconRss className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/" className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              Contact
            </Link>
            <a href="https://nextrows.com?source=blog" target="_blank" rel="noopener noreferrer" className="text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
              NextRows
            </a>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            &copy; {new Date().getFullYear()} NextRows. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
