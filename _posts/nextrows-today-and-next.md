---
title: "Where We Are and Where We're Going: Extraction Today, Task Automation Next"
excerpt: "NextRows extraction is live. Natural-language task automation is in development. Here is a plain account of both."
coverImage: "/assets/blog/nextrows-api-alpha-announcement.jpg"
date: "2026-10-28T19:30:00.000Z"
author:
  name: NextRows Team
  picture: "/assets/blog/authors/team.png"
ogImage:
  url: "/assets/blog/nextrows-api-alpha-announcement.jpg"
category: "why-nextrows"
---

The NextRows landing page says "Repetitive work ends here." It is a goal, and we want to be clear about which parts exist today and which are still being built.

## What exists today

The NextRows extract API reads web pages and plain text and returns structured data. You describe the data you want, optionally pass a JSON schema, and get table or JSON output. Under the hood:

- A typed API built with Hono, OpenAPI routes, and Zod request schemas
- A render service using headless Chromium through `puppeteer-core`
- Readability-based cleanup and HTML to Markdown conversion
- A model layer built on the Vercel AI SDK
- Rate limiting and per-request credit accounting

The codebase includes a web app, a REST API, a browser extension, and a desktop app built with Tauri.

## What we are building

The next step is a system where you describe a whole task in plain words, for example "Every morning at 8, order minced garlic from our supplier mall and log it in the ingredient sheet." The plan is:

1. **Describe the task.** You type what you need in natural language.
2. **AI plans the work.** A multimodal model, which is in development, reads the screen and your documents and breaks the goal into concrete actions.
3. **It runs on schedule.** Workflows are being built to run on your schedule and to re-plan when a website or tool changes.

We are also exploring a marketplace where teams can share workflow templates. For security-sensitive environments, we are developing quantized on-device models and a local RAG pipeline.

None of the items in this section are generally available yet.

## Why start with extraction

Automation that acts on websites and documents has to read them correctly first. Extraction is that foundation. Every improvement to rendering, cleanup, and schema-guided output carries into the automation work.

## How to work with us

NextRows is in active development with early partners. If you have repetitive computer work you would like to take off your plate, book a call from the NextRows site. We will walk you through the current state and discuss whether a pilot fits. Pricing is not final yet, and early partners help shape it.

We will keep posting here as pieces move from "in development" to "available."
