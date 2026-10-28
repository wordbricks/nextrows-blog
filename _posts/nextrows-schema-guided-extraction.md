---
title: "Schema-Guided Extraction: Getting the Same Shape Every Time"
excerpt: "Pass a JSON schema with your extract request and the output follows it. Here is why that matters and how to write one."
coverImage: "/assets/blog/glass.jpg"
date: "2026-10-28T19:20:00.000Z"
author:
  name: NextRows Team
  picture: "/assets/blog/authors/team.png"
ogImage:
  url: "/assets/blog/glass.jpg"
category: "technology"
---

Language models are good at reading messy text. They are less good at being consistent. Ask the same question twice and field names, ordering, or number formats can drift. If the output feeds a spreadsheet or a database, drift is a bug.

NextRows addresses this with schema-guided extraction.

## How it works

An extract request accepts an optional `schema` field containing a JSON schema. The extraction step runs through a model provider layer built on the Vercel AI SDK, and the schema tells the model what shape the answer must take. If you leave the schema out, the system can generate one from your prompt.

## A small example

Say you want product listings as rows with a name, a price, and an availability flag:

```json
{
  "type": "object",
  "properties": {
    "products": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "in_stock": { "type": "boolean" }
        },
        "required": ["name", "price"]
      }
    }
  },
  "required": ["products"]
}
```

With this schema, `price` is a number rather than a string like "$99.99", and `in_stock` is a boolean rather than the words "Available" or "Sold out". Downstream code can rely on that.

## When to pass a schema

- **Recurring jobs.** If you run the same extraction every day, fix the schema so columns never change.
- **Feeding other systems.** Databases and spreadsheets want stable types.
- **Combining sources.** When several pages feed one table, a shared schema keeps rows comparable.

## When to skip it

For one-off exploration, let the system generate a schema. Look at what it produced, then copy the useful parts into your own schema for later runs.

## Tips for writing schemas

- Mark only truly required fields as required, so a missing value does not fail the whole row.
- Use specific types such as `number` and `boolean` where you can.
- Keep names short and descriptive. The model reads them as hints.

Schema-guided output is one of the reasons the same prompt can be reused across many pages without hand-cleaning the results.
