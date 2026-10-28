---
title: "From URL to Table: How a NextRows Extract Request Works"
excerpt: "A walk through the five stages behind every extraction: input, render, normalize, extract, and deliver."
coverImage: "/assets/blog/coding.jpg"
date: "2026-10-28T19:00:00.000Z"
author:
  name: NextRows Team
  picture: "/assets/blog/authors/team.png"
ogImage:
  url: "/assets/blog/coding.jpg"
category: "technology"
---

Most scraping tools ask you to describe where the data lives. NextRows asks you to describe what you want. Behind that one sentence sits a pipeline with five stages. This post walks through each one, using the same structure we show on the NextRows landing page.

## The request

An extract request is small. It has a type, a list of sources, and an optional prompt and schema:

```json
{
  "type": "url",
  "data": ["https://fortune.com/ranking/global500"],
  "prompt": "Extract the top 10 companies from the list in a table format."
}
```

The request schema enforces a few rules:

- `type` is either `url` or `text`.
- `data` holds between 1 and 20 sources.
- `prompt` is optional and can be up to 2,000 characters.
- `schema` is an optional JSON schema.

The API itself is a Hono application. Routes are described with OpenAPI and request bodies are validated with Zod, so a malformed request fails early with a clear error instead of reaching the model.

## Stage 1: Input

Sources can be web page URLs, PDF documents, or raw text. You can mix several sources in a single request, up to 20.

## Stage 2: Render

Pages are fetched by a separate render service. It loads each page in headless Chromium through `puppeteer-core`, so content that only appears after JavaScript runs is still captured. Before capturing, the service pauses animations and removes hidden elements, which keeps the text you extract from containing things a visitor could not see. PDFs are converted to Markdown in this stage. Raw text skips rendering entirely.

## Stage 3: Normalize

Rendered HTML goes through Readability-based cleanup and is converted to Markdown. When a request has several sources, the text is merged. The goal is clean, compact text for the model, without navigation bars, scripts, or layout noise.

## Stage 4: Extract

The cleaned text is sent to a model through a provider layer built on the Vercel AI SDK. We currently use Google Gemini models. If you pass a JSON schema, the model is guided to produce output in that shape. If you don't, the system can generate a schema from your prompt.

## Stage 5: Deliver

The result comes back as table data or JSON, through the run, table, and JSON endpoints.

## Why split it this way

Each stage has one job and one failure mode. If a page renders badly, we look at the render service. If the text is noisy, we look at normalization. If the values are wrong, we look at the prompt and schema. That separation makes the system easier to debug and easier to improve one piece at a time.

Next up in this series: how to use a JSON schema to get predictable output, and how PDFs and plain text fit into the same request.
