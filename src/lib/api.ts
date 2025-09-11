import { Post } from "@/interfaces/post";
import { z } from "zod";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

const AuthorSchema = z
  .object({
    name: z.string().optional(),
    picture: z.string().optional(),
  })
  .optional();

const OgImageSchema = z
  .object({
    url: z.string().optional(),
  })
  .optional();

const FrontMatterSchema = z
  .object({
    title: z.string(),
    date: z.string(),
    coverImage: z.string().optional(),
    author: AuthorSchema,
    excerpt: z.string().optional(),
    ogImage: OgImageSchema,
    category: z.string().optional(),
    preview: z.boolean().optional(),
  })
  .passthrough();

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string): Post {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const parsed = FrontMatterSchema.parse(data);

  const plain = content
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/<[^>]+>/g, " ") // html tags
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1") // markdown links
    .replace(/[*_#>~-]/g, " ") // markdown tokens
    .replace(/\s+/g, " ")
    .trim();
  const words = plain ? plain.split(" ").length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    slug: realSlug,
    title: parsed.title,
    date: parsed.date,
    coverImage: parsed.coverImage || "",
    author: {
      name: parsed.author?.name || "",
      picture: parsed.author?.picture || "",
    },
    excerpt: parsed.excerpt || "",
    ogImage: { url: parsed.ogImage?.url || "" },
    content,
    category: parsed.category || "",
    preview: parsed.preview,
    readingTimeMinutes: minutes,
  };
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order (most recent first)
    .sort((post1, post2) => {
      const date1 = new Date(post1.date).getTime();
      const date2 = new Date(post2.date).getTime();
      return date2 - date1;
    });
  return posts;
}
