import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white dark:bg-stone-900">
      <section className="container text-center">
        <div className="mx-auto max-w-2xl px-6 py-20">
          <div className="mb-6 inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300">
            404 • Not Found
          </div>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
            Page not found
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base md:text-lg text-stone-600 dark:text-stone-400">
            We couldn’t find the page you’re looking for. It may have been moved, or the link is incorrect.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/" className="btn-primary" aria-label="Go to homepage">
              Go to homepage
            </Link>
            <Link href="/search" className="btn-secondary" aria-label="Search articles">
              Search articles
            </Link>
          </div>

          <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
            Still stuck? <Link href="/contact" className="underline decoration-orange-400 underline-offset-4 hover:text-orange-700 dark:hover:text-orange-400">Contact us</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

