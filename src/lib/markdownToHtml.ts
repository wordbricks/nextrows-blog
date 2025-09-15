import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import rehypeStringify from "rehype-stringify";
import { BASE_PATH } from "@/env/basePath";
import rehypeRewrite from "rehype-rewrite";
import { isElement } from "hast-util-is-element";

export default async function markdownToHtml(markdown: string) {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypePrettyCode, {
      theme: {
        light: "everforest-light",
        dark: "tokyo-night",
      },
      keepBackground: false,
      transformers: [
        transformerCopyButton({
          visibility: "hover",
          feedbackDuration: 3000,
        }),
      ],
    })
    .use(rehypeRewrite, {
      rewrite(node) {
        if (!isElement(node) || node.tagName !== "img") return;
        const props = node.properties || {};
        const src = typeof props.src === "string" ? props.src : "";
        const shouldPrefix =
          src.startsWith("/assets/") &&
          !src.startsWith(`${BASE_PATH}/`) &&
          !src.startsWith("http://") &&
          !src.startsWith("https://");
        if (shouldPrefix) node.properties = { ...props, src: `${BASE_PATH}${src}` };
      },
    })
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
