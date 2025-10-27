"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Command as Cmdk } from "cmdk";
import { useRouter } from "next/navigation";
import { api } from "@/app/(client)/lib/hono/api";
import { Home, Mail, Rss, Search as SearchIcon, FileText } from "lucide-react";
import { useCommandPalette } from "@/app/(client)/_components/command-palette-context";

type Item = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
};

export default function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (!open || items.length > 0) return;
    setLoading(true);
    api.search
      .$get()
      .then((r) => r.json())
      .then((d: { items?: Item[] }) =>
        setItems(Array.isArray(d.items) ? d.items : []),
      )
      .finally(() => setLoading(false));
  }, [open, items.length]);

  const dQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = dQuery.trim().toLowerCase();
    if (!q) return items.slice(0, 12);
    return items
      .filter((p) => {
        const t = p.title ? p.title.toLowerCase() : "";
        const e = p.excerpt ? p.excerpt.toLowerCase() : "";
        const c = p.content ? p.content.toLowerCase() : "";
        const cat = p.category ? p.category.toLowerCase() : "";
        return (
          t.includes(q) || e.includes(q) || c.includes(q) || cat.includes(q)
        );
      })
      .slice(0, 50);
  }, [items, dQuery]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + q.length);
    const after = text.slice(idx + q.length);
    return (
      <>
        {before}
        <mark className="bg-orange-200/60 dark:bg-orange-900/50 rounded px-0.5 text-stone-900 dark:text-stone-100">
          {match}
        </mark>
        {after}
      </>
    );
  };

  useEffect(() => {
    if (open) return;
    setQuery("");
    setLoading(false);
    setSelected(undefined);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (dQuery === "") {
      setSelected("open-full-search");
      return;
    }
    if (results.length > 0) {
      setSelected(results[0].slug);
      return;
    }
    setSelected(undefined);
  }, [open, dQuery, results]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }}
      aria-modal="true"
      role="dialog"
    >
      <div className="flex min-h-screen items-start justify-center px-4 sm:px-6 pt-24 sm:pt-28 pb-6 sm:pb-10">
        <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <Cmdk
            label="Global Search"
            shouldFilter={false}
            value={selected}
            onValueChange={setSelected}
            className="rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-2xl overflow-hidden ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-orange-500/50"
          >
            <div className="relative border-b border-stone-200 dark:border-stone-700">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500" />
              <div className="flex items-center gap-2 px-4">
                <SearchIcon className="h-4 w-4 text-stone-500" />
                <Cmdk.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search posts, categories…"
                  className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-stone-400"
                />
                <kbd className="ml-2 rounded border px-1.5 py-0.5 text-[10px] text-stone-500 dark:text-stone-400 border-stone-300 dark:border-stone-600">
                  ⌘K
                </kbd>
              </div>
            </div>
            <Cmdk.List
              className="max-h-96 overflow-auto py-2"
              style={{ animation: "fadeIn 120ms ease-out" }}
            >
              <Cmdk.Empty className="px-4 py-6 text-sm text-stone-500">
                No results found.
              </Cmdk.Empty>

              {query === "" && (
                <Cmdk.Group heading="Quick actions">
                  <Cmdk.Item
                    value="open-full-search"
                    onSelect={() => {
                      setOpen(false);
                      router.push("/search");
                    }}
                    className="group flex items-center gap-3 cursor-pointer px-4 py-2.5 aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800 outline-none border-l-2 border-transparent aria-selected:border-orange-500"
                  >
                    <SearchIcon className="h-4 w-4 text-stone-500 group-aria-selected:text-orange-600" />
                    <div>
                      <div className="font-medium text-stone-900 dark:text-stone-100">
                        Open full search
                      </div>
                      <div className="text-xs text-stone-500">
                        Use advanced results and filters
                      </div>
                    </div>
                  </Cmdk.Item>
                  <Cmdk.Item
                    value="go-home"
                    onSelect={() => {
                      setOpen(false);
                      router.push("/");
                    }}
                    className="group flex items-center gap-3 cursor-pointer px-4 py-2.5 aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800 outline-none border-l-2 border-transparent aria-selected:border-orange-500"
                  >
                    <Home className="h-4 w-4 text-stone-500 group-aria-selected:text-orange-600" />
                    <div>
                      <div className="font-medium text-stone-900 dark:text-stone-100">
                        Go to homepage
                      </div>
                      <div className="text-xs text-stone-500">
                        Browse latest posts
                      </div>
                    </div>
                  </Cmdk.Item>
                  <Cmdk.Item
                    value="contact"
                    onSelect={() => {
                      setOpen(false);
                      router.push("/contact");
                    }}
                    className="group flex items-center gap-3 cursor-pointer px-4 py-2.5 aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800 outline-none border-l-2 border-transparent aria-selected:border-orange-500"
                  >
                    <Mail className="h-4 w-4 text-stone-500 group-aria-selected:text-orange-600" />
                    <div>
                      <div className="font-medium text-stone-900 dark:text-stone-100">
                        Contact NextRows
                      </div>
                      <div className="text-xs text-stone-500">
                        Get in touch with our team
                      </div>
                    </div>
                  </Cmdk.Item>
                  <Cmdk.Item
                    value="subscribe"
                  onSelect={() => {
                    setOpen(false);
                    router.push("/atom.xml");
                  }}
                  className="group flex items-center gap-3 cursor-pointer px-4 py-2.5 aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800 outline-none border-l-2 border-transparent aria-selected:border-orange-500"
                >
                  <Rss className="h-4 w-4 text-stone-500 group-aria-selected:text-orange-600" />
                  <div>
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                        Subscribe via RSS
                      </div>
                      <div className="text-xs text-stone-500">
                        Follow updates in your reader
                      </div>
                    </div>
                  </Cmdk.Item>
                </Cmdk.Group>
              )}

              {query === "" && (
                <Cmdk.Separator className="my-1 border-stone-200 dark:border-stone-700" />
              )}

              <Cmdk.Group heading="Results">
                {loading && items.length === 0 && (
                  <div className="space-y-2 px-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 rounded-md bg-stone-100 dark:bg-stone-800 animate-pulse"
                      />
                    ))}
                  </div>
                )}
                {!loading &&
                  results.map((p) => (
                    <Cmdk.Item
                      key={p.slug}
                      value={p.slug}
                      onSelect={() => {
                        setOpen(false);
                        router.push(`/posts/${p.slug}`);
                      }}
                      className="group flex items-start gap-3 cursor-pointer px-4 py-2.5 aria-selected:bg-stone-100 dark:aria-selected:bg-stone-800 outline-none border-l-2 border-transparent aria-selected:border-orange-500"
                    >
                      <FileText className="mt-0.5 h-4 w-4 text-stone-500 group-aria-selected:text-orange-600" />
                      <div className="min-w-0">
                        <div className="font-medium text-stone-900 dark:text-stone-100 truncate">
                          {highlight(p.title, dQuery)}
                        </div>
                        <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-600 px-2 py-0.5 text-[10px] uppercase text-stone-600 dark:text-stone-300">
                            {p.category
                              ? p.category.replace("-", " ")
                              : "Article"}
                          </span>
                          <span>{new Date(p.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Cmdk.Item>
                  ))}
              </Cmdk.Group>
            </Cmdk.List>

            <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-700 px-4 py-2 text-[11px] text-stone-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="rounded border px-1.5 py-0.5 border-stone-300 dark:border-stone-600">
                    ↑
                  </kbd>
                  <kbd className="rounded border px-1.5 py-0.5 border-stone-300 dark:border-stone-600">
                    ↓
                  </kbd>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="rounded border px-1.5 py-0.5 border-stone-300 dark:border-stone-600">
                    Enter
                  </kbd>
                  <span>to open</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="rounded border px-1.5 py-0.5 border-stone-300 dark:border-stone-600">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </Cmdk>
        </div>
      </div>
    </div>
  );
}
