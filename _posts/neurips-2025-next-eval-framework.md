---
title: "Our Work to NeurIPS 2025 | NEXT-EVAL: Next Evaluation of Traditional and LLM Web Data Record Extraction"
excerpt: "We've submitted our groundbreaking evaluation framework for web data extraction to NeurIPS 2025. Learn how we're setting new standards for comparing traditional and LLM-based extraction methods."
coverImage: "/assets/blog/neurips-2025-next-eval-framework.jpg"
date: "2025-05-16T10:00:00.000Z"
author:
  name: Sophia
  picture: "/assets/blog/authors/sophia.png"
ogImage:
  url: "/assets/blog/neurips-2025-next-eval-framework.jpg"
category: "technology"
---

Our team is thrilled to announce a significant finding in the field of web data extraction. We've been working hard to tackle some of the biggest challenges in comparing traditional and modern AI-based methods for this task. We believe our work establishes a new standard for evaluation, and we are excited to share that we have submitted our paper, "A Concrete Evaluation Framework for Web Data Record Extraction," to [NeurIPS](https://neurips.cc) 2025.

This blog post serves as an introduction to our paper, summarizing the core problem, our proposed solution, and the key results that we hope will pave the way for principled advancements in this domain.

## The Challenge: Who's Better at Grabbing Data from Websites?

For decades, developers have relied on traditional, heuristic-based algorithms to automatically extract structured information—like product listings, tables, or directories—from web pages. These algorithms work by analyzing the HTML Document Object Model (DOM) tree, looking for repetitive patterns and structural cues. A classic example is the MDR algorithm, which identifies repeating sibling structures. While effective in simple cases, these methods are often rigid and brittle. If a website changes its layout even slightly, the algorithm can break entirely.

Enter Large Language Models (LLMs). These powerful AI systems have shown a remarkable ability to understand language and context, offering the potential for "zero-shot" data extraction across diverse and dynamic websites without needing custom rules for each one. However, using LLMs for this task presents its own set of challenges, most notably their tendency to hallucinate—inventing data that doesn't exist—and the lack of a standardized way to evaluate their performance against traditional methods.

Comparing these two approaches has been difficult because existing benchmarks are often static, domain-specific, and lack transparent scoring methods. We needed a fair and reproducible way to test them head-to-head.

## Our Solution: A Fair and Reproducible Testing Ground

To solve this problem, we developed a concrete evaluation framework designed from the ground up to be systematic, fair, and transparent. Think of it as creating a certified racetrack and a high-precision stopwatch to accurately measure the performance of any data extraction method.

Our framework is built on three core pillars:

### ✅ Reproducible Dataset Generation
Our system can take any archived web page (in MHTML format, which preserves the full page content) and automatically generate a new test case. This allows for the creation of diverse and ever-growing evaluation datasets.

### ✅ DOM-Grounded Supervision
We use XPath as our "answer key." An XPath is a unique address that points to a specific element in the HTML structure (e.g., `body/div[1]/span[2]`). By defining the correct data records as sets of XPaths, we ground our evaluation in the actual structure of the page. This is crucial because it ensures an extractor is identifying the correct element, not just similar-looking text elsewhere on the page, thereby preventing "text hallucination."

### ✅ Structure-Aware Scoring
We compare the predicted sets of XPaths with the ground-truth answer key using a robust matching system. It calculates an overlap score (Jaccard similarity) for each potential pair and uses the Hungarian algorithm to find the best possible one-to-one matches. This allows for partial credit—if an extractor finds 8 out of 10 fields in a record, it gets a proportional score—and provides clear Precision, Recall, and F1 scores that reflect structural accuracy.

## Preparing the Data: How to Feed a Website to an LLM

One of the biggest practical hurdles with LLMs is their limited input context window (the "token limit"). Raw HTML is incredibly verbose and often exceeds this limit. A key part of our research was exploring how to preprocess HTML to make it suitable for an LLM while preserving the structural information needed for accurate extraction.

We experimented with three input formats:

### Slimmed HTML
The most straightforward approach. We simply removed non-essential attributes like `class`, `id`, and `style` from the HTML tags. This reduces the token count but keeps the complex, nested structure of the original document, which can still be very difficult for an LLM to parse correctly.

### Hierarchical JSON
We converted the DOM tree into a nested JSON object. This format makes the parent-child relationships between elements explicit, giving the LLM a clearer view of the page's structure. While an improvement, it is still a complex, deeply nested representation.

### Flat JSON
This innovative format proved to be the key. We flattened the entire DOM tree into a simple key-value map. Each key is the full, absolute XPath to a text element, and the value is the text itself. This transforms the difficult task of parsing a tree into a much simpler pattern-recognition task on a flat list of addresses and their content.

## The Results: A Clear Winner Emerges

We benchmarked the traditional MDR algorithm against Gemini 1.5 Pro using our framework and the different input formats. The results were decisive and clearly demonstrated the profound impact of input representation on LLM performance.

The LLM, when provided with Flat JSON input, achieved state-of-the-art performance, dramatically outperforming all other methods.

Here is a summary of our findings:

| Method | Input Type | Precision | Recall | F1 Score | Hallucination Rate |
|--------|------------|-----------|---------|----------|-------------------|
| **LLM (Gemini)** | **Flat JSON** | **0.9939** | **0.9392** | **0.9567** | **3.05%** |
| LLM (Gemini) | Hierarchical JSON | 0.4932 | 0.3802 | 0.4048 | 59.76% |
| LLM (Gemini) | Slimmed HTML | 0.1217 | 0.0969 | 0.1014 | 91.46% |
| Traditional (MDR) | Full / Slimmed HTML | 0.0746 | 0.1593 | 0.0830 | 0.00% |

## Analysis of the Results

### Flat JSON + LLM
This combination was the undisputed champion. By providing the LLM with unambiguous XPath addresses for all text, we enabled it to easily identify repeating patterns among the keys, resulting in near-perfect precision and an outstanding F1 score of 0.9567. The hallucination rate was also exceptionally low.

### HTML + LLM
Directly feeding HTML, even a "slimmed" version, was a catastrophic failure. The LLM struggled to navigate the complex tree structure and infer correct XPaths, leading to an extremely high hallucination rate of over 91%.

### MDR
The traditional algorithm performed poorly on accuracy, as its rigid heuristics failed to capture the complexity of modern web layouts. However, its one strength is its deterministic nature, which means it had a 0% hallucination rate. It can be wrong, but it can't invent things that aren't in the DOM.

## Why This Work Matters

Our research provides two primary contributions to the community.

First, we have established a standardized, reproducible, and transparent foundation for benchmarking web data record extraction methods. This will allow researchers and developers to rigorously test new models and techniques on a level playing field.

Second, and perhaps more importantly, our results highlight a critical principle for applying LLMs to structured data tasks: **input representation is paramount**. The same powerful LLM can perform brilliantly or fail completely based solely on how the input data is formatted. Our demonstration of the Flat JSON format's effectiveness provides a clear and practical strategy for unlocking the full potential of LLMs for web extraction.

This work lays the groundwork for the next generation of intelligent, text-aware, and HTML-friendly extraction tools. We look forward to discussing our findings further with the research community at NeurIPS 2025.

## Try It Yourself

Want to experience the power of our evaluation framework firsthand? We've made our research accessible to everyone:

**🚀 [Interactive Demo ↗](https://nextrows.com/next-eval)**  
Explore our NEXT-EVAL framework with real examples. Test different input formats and see how LLM performance varies with our interactive demonstration.

**📄 [Read the Full Paper ↗](https://arxiv.org/abs/2505.17125)**  
Dive deep into our methodology, experimental setup, and detailed results. The complete research paper is available on arXiv with all technical details and comprehensive analysis.

## Join the Conversation

Our team is already dreaming of continuing these discussions in person. We hear the tacos in San Diego are amazing, and we can't wait to find out for ourselves under that warm California sun. See you there!

![San Diego skyline with palm trees and beach](/assets/blog/san-diego-neurips-2025.jpg)
*Scientists plan their most important research discoveries around taco availability. NeurIPS 2025 location approval: ✅*