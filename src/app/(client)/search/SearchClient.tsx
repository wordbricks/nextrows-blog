"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DateFormatter from "@/app/(client)/_components/date-formatter";
import { api } from "@/app/(client)/lib/hono/api";
import { BASE_PATH } from "@/env/basePath";
import { useEffectOnce } from "@/hooks/useEffectOnce";
import { getCategoryColor, getCategoryLabel } from "@/constants/category";

type Item = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  coverImage: string;
};

const computeMinutes = (content: string) => {
  const plain = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_#>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return minutes;
};

export default function SearchClient() {
  const [fallback, setFallback] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");

  useEffectOnce(() => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-pagefind]",
    );
    if (existing) return;
    const existingCss = document.querySelector<HTMLLinkElement>(
      "link[data-pagefind-css]",
    );
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${BASE_PATH}/_pagefind/pagefind-ui.css`;
      link.dataset.pagefindCss = "true";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = `${BASE_PATH}/_pagefind/pagefind-ui.js`;
    script.async = true;
    script.defer = true;
    script.dataset.pagefind = "true";
    script.onload = () => {
      // @ts-expect-error PagefindUI is injected by the script
      if (window?.PagefindUI) {
        const metaMap: Record<string, { category: string; date: string; minutes: number }> = {};
        api.search
          .$get()
          .then((r) => r.json())
          .then((d: { items?: Item[] }) => {
            const arr = Array.isArray(d.items) ? d.items : [];
            arr.forEach((p) => {
              const minutes = computeMinutes(p.content || "");
              metaMap[p.slug] = { category: p.category || "", date: p.date, minutes };
            });
          });
        // @ts-expect-error PagefindUI is injected by the script
        new window.PagefindUI({
          element: "#pagefind-search",
          showSubResults: true,
          showImages: true,
          bundlePath: `${BASE_PATH}/_pagefind/`,
          baseUrl: `${BASE_PATH}/`,
          processResult: (res: { meta?: { image?: string; title?: string }; url?: string; title?: string; excerpt?: string; sub_results?: { title?: string; url?: string }[] }) => {
            if (res.url !== undefined) {
              const cleaned = res.url.replace(/\.html(?=($|[?#]))/, "");
              if (cleaned !== res.url) res.url = cleaned;
            }
            const subs = res.sub_results;
            if (subs !== undefined && Array.isArray(subs)) {
              const normalized = subs.map((s) => {
                if (s?.url !== undefined) {
                  const cleaned = s.url.replace(/\.html(?=($|[?#]))/, "");
                  if (cleaned !== s.url) s.url = cleaned;
                }
                return s;
              });
              res.sub_results = normalized;
            }
            const pageTitle = res?.meta?.title;
            const originalUrl = res.url;
            if (subs !== undefined && Array.isArray(subs)) {
              const dupes = subs
                .map((s, i) => ({ i, isDupe: (pageTitle !== undefined && s?.title === pageTitle) || (originalUrl !== undefined && s?.url === originalUrl) }))
                .filter((x) => x.isDupe);
              if (dupes.length > 1) {
                const keepIndex = dupes[0].i;
                const cleaned = subs.filter((_, i) => i === keepIndex || !dupes.some((d) => d.i === i));
                res.sub_results = cleaned;
              }
              const list = Array.isArray(res.sub_results) ? res.sub_results : subs;
              const first = list[0];
              const shouldRename = first !== undefined && ((pageTitle !== undefined && first.title === pageTitle) || (originalUrl !== undefined && first.url === originalUrl));
              if (shouldRename && list[0]) list[0].title = "";
            }
            const u = res.url || "";
            const withNoBase = u.startsWith(`${BASE_PATH}/`) ? u.slice(BASE_PATH.length) : u;
            const path = withNoBase.startsWith("/") ? withNoBase.slice(1) : withNoBase;
            const slug = path.startsWith("posts/") ? path.slice("posts/".length).split(/[?#]/)[0] : "";
            const meta = slug ? metaMap[slug] : undefined;
            if (meta !== undefined) {
              const parts: string[] = [];
              const cat = meta.category;
              if (cat) {
                const label = getCategoryLabel(cat);
                if (label) parts.push(`<span class="uppercase ${getCategoryColor(cat)}">${label}</span>`);
              }
              const d = meta.date;
              if (d) {
                const dt = new Date(d);
                const formatted = isNaN(dt.getTime())
                  ? d
                  : dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
                parts.push(formatted);
              }
              if (meta.minutes) parts.push(`${meta.minutes} min read`);
              if (parts.length) {
                const line = `<div class="mt-1 text-xs text-stone-500 dark:text-stone-400">${parts.join(" · ")}</div>`;
                res.excerpt = (res.excerpt || "") + line;
              }
            }
            const img = res?.meta?.image;
            if (img === undefined) return res;
            if (!img.includes("/_next/image?url=")) return res;
            const qIndex = img.indexOf("?");
            if (qIndex === -1) return res;
            const params = new URLSearchParams(img.slice(qIndex + 1));
            const inner = params.get("url");
            if (!inner) return res;
            const decoded = decodeURIComponent(inner);
            if (res.meta) res.meta.image = decoded;
            return res;
          },
          translations: { placeholder: "Search the blog..." },
        });
        return;
      }
      setFallback(true);
    };
    script.onerror = () => setFallback(true);
    document.body.appendChild(script);
  });

  useEffect(() => {
    if (!fallback) return;
    api.search
      .$get()
      .then((r) => r.json())
      .then((d: { items?: Item[] }) =>
        setItems(Array.isArray(d.items) ? d.items : []),
      );
  }, [fallback]);

  const results = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return items.filter((p) => {
      const t = p.title ? p.title.toLowerCase() : "";
      const e = p.excerpt ? p.excerpt.toLowerCase() : "";
      const c = p.content ? p.content.toLowerCase() : "";
      return t.includes(query) || e.includes(query) || c.includes(query);
    });
  }, [items, q]);

  return (
    <main className="container mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Search</h1>
      <div
        id="pagefind-search"
        style={{ display: fallback ? "none" : "block" }}
      />
      {fallback ? (
        <div>
          <div className="max-w-2xl">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the blog..."
              className="w-full border border-stone-300 dark:border-stone-700 rounded-lg px-4 py-2 bg-white dark:bg-stone-900"
              autoFocus
            />
          </div>
          <div className="mt-6 space-y-4">
            {results.length === 0 ? (
              <p className="text-stone-600 dark:text-stone-400">
                Start typing to search posts.
              </p>
            ) : (
              results.slice(0, 50).map((p) => (
                <Link
                  key={p.slug}
                  href={`/posts/${p.slug}`}
                  className="block p-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  <div className="text-sm uppercase text-stone-500">
                    {getCategoryLabel(p.category || "") || "Article"}
                  </div>
                  <div className="font-semibold text-lg">{p.title}</div>
                  <div className="text-stone-600 dark:text-stone-400 line-clamp-2">
                    {p.excerpt}
                  </div>
                  <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                    <DateFormatter dateString={p.date} /> · {computeMinutes(p.content)} min read
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ) : null}
      <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
        Tip: Press ⌘K / Ctrl+K to search.
      </p>
    </main>
  );
}
