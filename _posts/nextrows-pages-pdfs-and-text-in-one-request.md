---
title: "One Request, Three Kinds of Input: Pages, PDFs and Plain Text"
excerpt: "NextRows accepts web URLs, PDF documents and raw text in the same extract request. Here is how each one is handled."
coverImage: "/assets/blog/placeholder1.jpg"
date: "2026-10-28T19:10:00.000Z"
author:
  name: NextRows Team
  picture: "/assets/blog/authors/team.png"
ogImage:
  url: "/assets/blog/placeholder1.jpg"
category: "tutorials"
---

Real work rarely lives in one format. A price list is a web page, a spec sheet is a PDF, and a customer note is pasted text. NextRows handles all three through the same extract request.

## Web pages

Pass one or more URLs with `type` set to `url`:

```bash
curl -X POST https://api.nextrows.com/v1/extract \
  -H "Authorization: Bearer sk-nr-your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "url",
    "data": ["https://example.com/products"],
    "prompt": "Extract product names, prices, and descriptions"
  }'
```

The page is rendered in headless Chromium, so content added by JavaScript is part of what the model sees. Animations are paused and hidden elements are removed first, then Readability-based cleanup strips the page down to its main content.

## PDF documents

URLs that point to PDFs go through a different path. The document is converted to Markdown, and the rest of the pipeline stays the same. That means you can ask the same kind of question of a PDF as you would of a web page, for example "list every line item with its quantity and unit price."

## Plain text

Set `type` to `text` and put the text itself in `data`. Raw text skips the render step and goes straight to normalization and extraction. This is useful when the content already reached you some other way, such as an email body or a copied table.

## Up to 20 sources

One request can carry up to 20 sources. The text from all of them is merged before extraction, so a single prompt can combine them. Keep the prompt specific about what to pull from where, and consider passing a schema so the output has the same shape every time. We cover schemas in the next post.

## A few practical tips

- Write the prompt like a note to a colleague: say which fields you want and what to do when one is missing.
- Keep prompts under the 2,000 character limit by describing fields rather than pasting examples.
- Start with one source and check the output before batching many.

You can find endpoint details and more examples in the NextRows API documentation.
