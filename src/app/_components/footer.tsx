import { IconBrandX, IconBrandYoutube, IconBrandGithub, IconRss } from '@tabler/icons-react'
export function Footer() {
  return (
    <footer className="bg-white dark:bg-stone-900 mt-12 border-t border-stone-200 dark:border-stone-800 transition-colors duration-200">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          <p className="text-sm text-stone-500 dark:text-stone-400">&copy; 2025 NextRows Blog. All Rights Reserved.</p>
          <div className="flex mt-4 sm:mt-0 space-x-4">
            <a
              href="https://x.com/nextrows_com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NextRows on X"
              className="text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-500"
            >
              <IconBrandX className="h-6 w-6" />
            </a>
            <a
              href="https://www.youtube.com/@NextRows_official"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="NextRows on YouTube"
              className="text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-500"
            >
              <IconBrandYoutube className="h-6 w-6" />
            </a>
            <a
              href="https://github.com/wordbricks/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Wordbricks on GitHub"
              className="text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-500"
            >
              <IconBrandGithub className="h-6 w-6" />
            </a>
            <a
              href="/atom.xml"
              aria-label="RSS feed"
              className="text-stone-500 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-500"
            >
              <IconRss className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
