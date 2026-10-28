---
title: "Web Pages or Plain Text: Choosing an Extract Request Input"
excerpt: "Each NextRows extract request takes either web page URLs or raw text, never both in one call. Here is how to choose."
coverImage: "/assets/blog/nr-cover-input-types.svg"
date: "2026-10-28T12:10:00.000Z"
author:
  name: NextRows Team
  picture: "/assets/blog/authors/team.png"
ogImage:
  url: "/assets/blog/nr-cover-input-types.svg"
category: "tutorials"
---

Real work rarely lives in one place. A price list is a web page, and a customer note is pasted text. The NextRows extract API accepts both, with one rule: each request uses a single input type.

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

Every item in `data` must be a valid URL. The page is rendered in headless Chromium, so content added by JavaScript is part of what the model sees. Animations are paused and hidden elements are removed first, then Readability-based cleanup and Markdown conversion reduce the page to its main content.

## Plain text

Set `type` to `text` and put the text itself in `data`. Raw text skips the render step and goes straight to the model. This is useful when the content already reached you some other way, such as an email body, a copied table, or text you extracted from a document yourself.

## One type per request

`type` is either `url` or `text` for the whole request. You cannot mix URLs and raw text in the same call. If you need both, make two requests.

## Up to 20 sources

Within one type, a request can carry between 1 and 20 items in `data`. The content from all of them is combined before extraction, so a single prompt covers them. Keep the prompt specific about what to pull out, and consider passing a schema so the output has the same shape every time. We cover schemas in the next post.

## What the response looks like

A successful call returns a JSON object with `success` set to true and the extracted values in `data`.

## A few practical tips

- Write the prompt like a note to a colleague: say which fields you want and what to do when one is missing.
- Keep prompts within the 2,000 character limit by describing fields rather than pasting examples.
- Start with one source and check the output before batching many.

You can find endpoint details and more examples in the NextRows API documentation.
