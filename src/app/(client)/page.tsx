import { getAllPosts } from "@/lib/api";
import BlogClient from "./blog-client";
import { BlogJsonLd } from "@/app/(client)/_components/json-ld";

export default function Index() {
  const allPosts = getAllPosts();

  return (
    <>
      <BlogJsonLd />
      <BlogClient posts={allPosts} />
    </>
  );
}
