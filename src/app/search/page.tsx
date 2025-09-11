"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Item = {
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  date: string
  coverImage: string
}

export default function SearchPage() {
  const [fallback, setFallback] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-pagefind]')
    if (existing) return
    const script = document.createElement('script')
    script.src = '/_pagefind/pagefind.js'
    script.async = true
    script.defer = true
    script.dataset.pagefind = 'true'
    script.onload = () => {
      // @ts-expect-error PagefindUI is injected by the script
      if (window?.PagefindUI) {
        // @ts-expect-error PagefindUI is injected by the script
        new window.PagefindUI({ element: '#pagefind-search', showSubResults: true, showImages: true, translations: { placeholder: 'Search the blog...' } })
        return
      }
      setFallback(true)
    }
    script.onerror = () => setFallback(true)
    document.body.appendChild(script)
  }, [])

  useEffect(() => {
    if (!fallback) return
    fetch('/api/search')
      .then(r => r.json())
      .then(d => setItems(d.items as Item[]))
  }, [fallback])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return [] as Item[]
    return items.filter(p => {
      const t = p.title ? p.title.toLowerCase() : ''
      const e = p.excerpt ? p.excerpt.toLowerCase() : ''
      const c = p.content ? p.content.toLowerCase() : ''
      return t.includes(query) || e.includes(query) || c.includes(query)
    })
  }, [items, q])

  return (
    <main className="container mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Search</h1>
      <div id="pagefind-search" style={{ display: fallback ? 'none' : 'block' }} />
      {fallback ? (
        <div>
          <div className="max-w-2xl">
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search the blog..."
              className="w-full border border-stone-300 dark:border-stone-700 rounded-lg px-4 py-2 bg-white dark:bg-stone-900"
              autoFocus
            />
          </div>
          <div className="mt-6 space-y-4">
            {results.length === 0 ? (
              <p className="text-stone-600 dark:text-stone-400">Start typing to search posts.</p>
            ) : (
              results.slice(0, 50).map(p => (
                <Link key={p.slug} href={`/posts/${p.slug}`} className="block p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800">
                  <div className="text-sm uppercase text-stone-500">{p.category || 'Article'}</div>
                  <div className="font-semibold text-lg">{p.title}</div>
                  <div className="text-stone-600 dark:text-stone-400 line-clamp-2">{p.excerpt}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
      <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">Tip: Press ⌘K / Ctrl+K to search.</p>
    </main>
  )
}
