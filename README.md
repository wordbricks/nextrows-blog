# NextRows Blog

A modern, performant blog built with Next.js 15, TypeScript, and Tailwind CSS. This blog showcases NextRows' data extraction and automation platform through tutorials, use cases, and technical insights.

## 🚀 Features

- **Next.js 15 App Router** - Latest Next.js features with server components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom NextRows branding
- **Responsive Design** - Mobile-first approach
- **SEO Optimized** - Meta tags, OpenGraph, Twitter Cards, and JSON-LD
- **Performance Optimized** - Image optimization, lazy loading, React memoization
- **Category System** - Organized content across multiple categories
- **Pagination** - Efficient content browsing
- **RSS Feed** - Automated feed generation
- **Sitemap** - Dynamic sitemap for search engines
- **Smooth Scrolling** - Anchor links with smooth navigation

## 📁 Project Structure

```
nextrows-blog/
├── _posts/                  # Markdown blog posts
├── public/
│   ├── assets/
│   │   └── blog/           # Blog images (optimized JPGs)
│   └── favicon/            # Favicon files
├── src/
│   ├── app/
│   │   ├── _components/    # React components
│   │   ├── posts/[slug]/   # Dynamic blog post pages
│   │   ├── contact/        # Contact page
│   │   └── ...
│   ├── interfaces/         # TypeScript interfaces
│   └── lib/                # Utility functions
├── package.json
└── tailwind.config.ts      # Tailwind configuration
```

## 🎨 Categories

- **Technology** - Technical deep-dives and infrastructure
- **Tutorials** - Step-by-step guides
- **Use Cases** - Real-world applications
- **Why NextRows** - Product comparisons and benefits
- **Others** - General topics

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/wordbricks/nextrows-blog.git
cd nextrows-blog
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📝 Adding Blog Posts

1. Create a new `.md` file in the `_posts` directory
2. Add frontmatter with required fields:

```markdown
---
title: "Your Blog Post Title"
excerpt: "Brief description of your post"
coverImage: "/assets/blog/your-image.jpg"
date: "2025-01-30T10:00:00.000Z"
author:
  name: Author Name
  picture: "/assets/blog/authors/author.png"
ogImage:
  url: "/assets/blog/your-image.jpg"
category: "technology"
---

Your content here...
```

## 🖼️ Image Optimization

- Convert PNG images to JPG for better compression
- Use descriptive, SEO-friendly filenames
- Place images in `/public/assets/blog/`
- Optimize with 85% quality setting

## 🛠️ Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🎯 NextRows Brand Colors

- Primary Orange: `#ff6308` / `#F77225`
- Stone shades for text and backgrounds
- Dark mode support throughout

## 📚 Key Technologies

- **Next.js 15.0.2** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 3.4** - Styling
- **Remark** - Markdown processing
- **Gray Matter** - Frontmatter parsing
- **Date-fns** - Date formatting

## 🔗 Links

- [NextRows Website](https://nextrows.com)
- [NextRows API Documentation](https://nextrows.com/docs/api)
- [Interactive Demo](https://nextrows.com/next-eval)

## 📄 License

This project is proprietary to NextRows.

## 👥 Contributors

Built with ❤️ by the NextRows team.

---

For questions or support, contact: support@nextrows.com
