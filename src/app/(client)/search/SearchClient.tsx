"use client";

import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { BASE_PATH } from "@/env/basePath";
import { useEffectOnce } from "@/hooks/useEffectOnce";
import { getCategoryColor, getCategoryLabel } from "@/constants/category";
import { isMacOS, isTouchDevice } from "@/utils/ua";
import { useQueryState, parseAsString } from "nuqs";

export default function SearchClient() {
  const [isMac, setIsMac] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [ready, setReady] = useState(false);
  const [pfReady, setPfReady] = useState(false);
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString
      .withDefault("")
      .withOptions({ history: "replace", clearOnDefault: true })
  );

  useEffectOnce(() => {
    setIsMac(Boolean(isMacOS()));
    setIsTouch(Boolean(isTouchDevice()));
    setReady(true);
  });

  const handleInput = (e: FormEvent<HTMLDivElement>) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    if (!t.closest('#pagefind-search')) return;
    const v = t.value;
    if (v === query) return;
    if (v === '') {
      setQuery(null);
      return;
    }
    setQuery(v);
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.target;
    if (!(el instanceof Element)) return;
    const btn = el.closest('#pagefind-search .pagefind-ui__search-clear');
    if (!btn) return;
    setQuery(null);
  };

  useEffectOnce(() => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-pagefind]");
    const existingCss = document.querySelector<HTMLLinkElement>("link[data-pagefind-css]");
    if (!existingCss) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `${BASE_PATH}/_pagefind/pagefind-ui.css`;
      link.dataset.pagefindCss = "true";
      document.head.appendChild(link);
    }

    const initUI = () => {
      // @ts-expect-error PagefindUI is injected by the script
      if (window?.PagefindUI) {
        // @ts-expect-error PagefindUI is injected by the script
        new window.PagefindUI({
          element: "#pagefind-search",
          showSubResults: true,
          showImages: true,
          bundlePath: `${BASE_PATH}/_pagefind/`,
          baseUrl: `${BASE_PATH}/`,
          processResult: (res: {
            meta?: { image?: string; title?: string; category?: string; date?: string; minutes?: string };
            url?: string;
            title?: string;
            excerpt?: string;
            sub_results?: { title?: string; url?: string }[];
          }) => {
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
            const meta = res.meta;
            if (meta !== undefined) {
              const parts: string[] = [];
              const cat = meta.category;
              if (cat !== undefined) {
                const label = getCategoryLabel(cat);
                if (label) parts.push(`<span class="uppercase ${getCategoryColor(cat)}">${label}</span>`);
              }
              const d = meta.date;
              if (d !== undefined) {
                const dt = new Date(d);
                const formatted = isNaN(dt.getTime())
                  ? d
                  : dt.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
                parts.push(formatted);
              }
              const m = meta.minutes;
              if (m !== undefined) {
                const n = Number(m);
                if (!Number.isNaN(n) && n > 0) parts.push(`${n} min read`);
              }
              const hadInjected = typeof res.excerpt === "string" && res.excerpt.includes('data-wb-meta="1"');
              if (parts.length && !hadInjected) {
                const line = `<div data-wb-meta="1" class="mt-1 text-xs text-stone-500 dark:text-stone-400">${parts.join(" · ")}</div>`;
                res.excerpt = (res.excerpt || "") + line;
              }
              
            }
            const img = res?.meta?.image;
            if (img === undefined) return res;
            if (!img.includes("/_next/image?url")) return res;
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
        const input = document.querySelector<HTMLInputElement>("#pagefind-search input");
        if (input) {
          if (input.value !== query) {
            input.value = query;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
          input.focus();
          const end = input.value.length;
          input.setSelectionRange(end, end);
        }
        setPfReady(true);
      }
    };

    if (existing) {
      // If script is already present, either init immediately or on its load event
      // in case it hasn't executed yet.
      // @ts-expect-error PagefindUI is injected by the script
      if (window?.PagefindUI) initUI();
      existing.addEventListener("load", initUI, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `${BASE_PATH}/_pagefind/pagefind-ui.js`;
    script.async = true;
    script.defer = true;
    script.dataset.pagefind = "true";
    script.addEventListener("load", initUI, { once: true });
    script.onerror = () => {};
    document.body.appendChild(script);
  });

  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>("#pagefind-search input");
    if (!input) return;
    if (input.value === query) return;
    input.value = query;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, [query, pfReady]);

  useEffect(() => {
    if (!pfReady) return;
    const input = document.querySelector<HTMLInputElement>("#pagefind-search input");
    if (!input) return;
    input.focus();
    const end = input.value.length;
    input.setSelectionRange(end, end);
  }, [pfReady]);

  return (
    <main className="container mx-auto px-4 md:px-6 py-10">
      <h1 className="text-3xl md:text-4xl font-bold mb-6">Search</h1>
      <style>{`
        /* Hide unused tags row from Pagefind */
        #pagefind-search .pagefind-ui__result-tags { display: none !important; }

        /* Dark mode polish for Pagefind UI */
        .dark #pagefind-search {
          --pagefind-ui-primary: #fb923c; /* orange-400 */
          --pagefind-ui-text: #e7e5e4; /* stone-200 */
          --pagefind-ui-background: #0c0a09; /* stone-950 */
          --pagefind-ui-border: #44403c; /* stone-700 */
          --pagefind-ui-tag: #1c1917; /* stone-900 */
          --pagefind-ui-border-width: 1px;
          --pagefind-ui-border-radius: 12px;
          --pagefind-ui-image-border-radius: 10px;
        }

        /* Input field */
        .dark #pagefind-search .pagefind-ui__search-input {
          background: #1c1917; /* stone-900 */
          border: 1px solid #44403c; /* stone-700 */
          color: #e7e5e4; /* stone-200 */
          padding: 0.875rem 1rem; /* ~py-3.5 px-4 */
          border-radius: 12px;
          box-shadow: none;
        }
        .dark #pagefind-search .pagefind-ui__search-input::placeholder {
          color: #a8a29e; /* stone-400 */
        }
        .dark #pagefind-search .pagefind-ui__search-input:focus {
          outline: none;
          border-color: #ea580c; /* orange-600 */
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25);
          background: #0c0a09; /* stone-950 */
        }

        /* Clear button */
        .dark #pagefind-search .pagefind-ui__search-clear {
          color: #a8a29e; /* stone-400 */
        }
        .dark #pagefind-search .pagefind-ui__search-clear:hover {
          color: #f97316; /* orange-500 */
        }

        /* Results container spacing */
        .dark #pagefind-search .pagefind-ui__results {
          gap: 0.75rem;
        }

        /* Result card */
        .dark #pagefind-search .pagefind-ui__result {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid #3f3f46; /* zinc-700 */
          border-radius: 12px;
          padding: 0.75rem;
          transition: border-color 150ms ease, background-color 150ms ease;
        }
        .dark #pagefind-search .pagefind-ui__result:hover {
          background: rgba(234, 88, 12, 0.07);
          border-color: rgba(234, 88, 12, 0.5);
        }

        /* Titles and links */
        .dark #pagefind-search .pagefind-ui__result-title a,
        .dark #pagefind-search .pagefind-ui__result-link {
          color: #f5f5f4; /* stone-100 */
          text-decoration: none;
        }
        .dark #pagefind-search .pagefind-ui__result-title a:hover,
        .dark #pagefind-search .pagefind-ui__result-link:hover {
          color: #fb923c; /* orange-400 */
        }

        /* Excerpt / meta */
        .dark #pagefind-search .pagefind-ui__result-excerpt {
          color: #a8a29e; /* stone-400 */
        }
        .dark #pagefind-search .pagefind-ui__message {
          color: #d6d3d1; /* stone-300 */
        }

        /* Load more button */
        .dark #pagefind-search .pagefind-ui__more {
          background: #1c1917; /* stone-900 */
          color: #e7e5e4; /* stone-200 */
          border: 1px solid #44403c; /* stone-700 */
          border-radius: 10px;
          padding: 0.5rem 0.875rem;
          transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
        }
        .dark #pagefind-search .pagefind-ui__more:hover {
          background: #292524; /* stone-800 */
          border-color: #ea580c; /* orange-600 */
          color: #fb923c; /* orange-400 */
        }

        /* Subresults list */
        .dark #pagefind-search .pagefind-ui__result-nested a {
          color: #e7e5e4; /* stone-200 */
        }
        .dark #pagefind-search .pagefind-ui__result-nested a:hover {
          color: #fb923c; /* orange-400 */
        }

        /* Thumbnails */
        .dark #pagefind-search .pagefind-ui__result-thumb,
        .dark #pagefind-search .pagefind-ui__result-thumb img {
          border-radius: 10px;
          background: #0c0a09; /* stone-950 */
        }
      `}</style>
      <div onInput={handleInput} onClick={handleClick}>
        <div id="pagefind-search" />
      </div>
      {ready && !isTouch ? (
        <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">Tip: Press {isMac ? "⌘K" : "Ctrl+K"} to search.</p>
      ) : null}
    </main>
  );
}
