export const SEO_CONFIG = {
  siteName: "NextRows Blog",
  siteUrl: "/",
  siteDescription:
    "Learn web scraping, data cleaning, and automation techniques with NextRows. Tutorials, guides, and insights to transform your data processing workflow.",
  siteKeywords: [
    "web scraping",
    "data extraction",
    "data cleaning",
    "automation",
    "NextRows",
    "data processing",
    "ETL",
    "no-code",
    "data transformation",
    "API",
    "Python alternative",
    "BeautifulSoup alternative",
    "Scrapy alternative",
  ],
  organization: {
    name: "NextRows",
    url: "https://nextrows.com",
    logo: "/assets/nextrows-logo.svg",
    sameAs: [
      "https://twitter.com/nextrows",
      "https://github.com/wordbricks",
      "https://www.linkedin.com/company/nextrows",
    ],
  },
  social: {
    twitter: "@nextrows",
    github: "wordbricks",
    linkedin: "nextrows",
  },
  categories: {
    technology: {
      title: "Technology & Infrastructure",
      description:
        "Deep dives into NextRows architecture, integrations, and the technical decisions powering our platform.",
      keywords: [
        "infrastructure",
        "architecture",
        "engineering",
        "integrations",
        "technical",
      ],
    },
    tutorials: {
      title: "Tutorials & Guides",
      description:
        "Step-by-step tutorials for web scraping, data extraction, and automation using NextRows.",
      keywords: [
        "tutorial",
        "guide",
        "how-to",
        "walkthrough",
        "step-by-step",
        "learning",
      ],
    },
    "use-cases": {
      title: "Use Cases & Applications",
      description:
        "Real-world examples of how businesses use NextRows for data extraction and automation.",
      keywords: [
        "use case",
        "case study",
        "real-world",
        "application",
        "example",
        "business",
      ],
    },
    "why-nextrows": {
      title: "Why NextRows",
      description:
        "Comparisons, benefits, and features that make NextRows the best choice for data extraction.",
      keywords: [
        "comparison",
        "vs",
        "alternative",
        "benefits",
        "features",
        "advantages",
      ],
    },
    others: {
      title: "Culture & Team",
      description:
        "Insights into NextRows culture, team, and our approach to building a remote-first company.",
      keywords: [
        "startup",
        "culture",
        "team",
        "remote work",
        "company",
        "values",
      ],
    },
  },
  authors: {
    default: {
      name: "NextRows Team",
      url: "https://nextrows.com/about",
    },
    sophia: {
      name: "Sophia",
      role: "Engineering Lead",
      url: "https://nextrows.com/team/sophia",
    },
    mason: {
      name: "Mason",
      role: "Product Manager",
      url: "https://nextrows.com/team/mason",
    },
  },
  openGraph: {
    defaultImage: "/opengraph-image",
    imageWidth: 1200,
    imageHeight: 630,
  },
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "NextRows Blog",
    url: "/",
    description:
      "Learn web scraping, data cleaning, and automation techniques with NextRows.",
    publisher: {
      "@type": "Organization",
      name: "NextRows",
      url: "https://nextrows.com",
      logo: {
        "@type": "ImageObject",
        url: "/assets/nextrows-logo.svg",
      },
    },
  },
};

// Helper function to get category meta tags
export function getCategoryMetaTags(category: string) {
  const categoryConfig =
    SEO_CONFIG.categories[category as keyof typeof SEO_CONFIG.categories];
  if (!categoryConfig) return null;

  return {
    title: `${categoryConfig.title} | NextRows Blog`,
    description: categoryConfig.description,
    keywords: [...SEO_CONFIG.siteKeywords, ...categoryConfig.keywords],
  };
}

// Helper function to generate author structured data
export function getAuthorStructuredData(authorName: string) {
  const authorKey = authorName.toLowerCase();
  const author =
    SEO_CONFIG.authors[authorKey as keyof typeof SEO_CONFIG.authors] ||
    SEO_CONFIG.authors.default;

  return {
    "@type": "Person",
    name: author.name,
    ...("role" in author && author.role ? { jobTitle: author.role } : {}),
    ...("url" in author && author.url ? { url: author.url } : {}),
  };
}
