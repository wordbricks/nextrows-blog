export function BlogJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'NextRows Blog',
    description: 'Learn web scraping, data cleaning, and automation techniques with NextRows.',
    url: 'https://blog.nextrows.com',
    publisher: {
      '@type': 'Organization',
      name: 'NextRows',
      logo: {
        '@type': 'ImageObject',
        url: 'https://blog.nextrows.com/nextrows-logo-nav.png',
      },
    },
    blogPost: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName,
  image,
}: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    url: url,
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: authorName || 'NextRows Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'NextRows',
      logo: {
        '@type': 'ImageObject',
        url: 'https://blog.nextrows.com/nextrows-logo-nav.png',
      },
    },
    image: image || 'https://blog.nextrows.com/nextrows-logo-nav.png',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}