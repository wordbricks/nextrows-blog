import { Hono } from "hono";
import { getAllPosts } from "@/lib/api";
import type { Env } from "@/app/(server)/api/app";

export const search = new Hono<Env>().get("/", (c) => {
  const posts = getAllPosts();
  const items = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content || "",
    category: p.category || "",
    date: p.date,
    coverImage: p.coverImage || "",
  }));
  return c.json({ items });
});
