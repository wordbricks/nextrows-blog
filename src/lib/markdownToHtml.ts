import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypePrettyCode from "rehype-pretty-code";
import { transformerCopyButton } from "@rehype-pretty/transformers";
import rehypeStringify from "rehype-stringify";

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
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
