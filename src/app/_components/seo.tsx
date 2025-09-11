import { Metadata } from 'next';
import { HOST } from '@/env/host';
import { getEnv } from '@/env/getEnv';

export interface SEOProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  keywords?: string[];
  type?: 'website' | 'article';
  noindex?: boolean;
}

export function generateSEOMetadata({
  title,
  description,
  url = HOST[getEnv()],
  image = '/opengraph-image',
  author = 'NextRows Team',
  publishedTime,
  modifiedTime,
  keywords = [],
  type = 'website',
  noindex = false,
}: SEOProps): Metadata {
  const fullTitle = `${title} | NextRows Blog`;
  const fullImageUrl = image.startsWith('http') ? image : `${HOST[getEnv()]}${image}`;
  
  const defaultKeywords = [
    'web scraping',
    'data extraction',
    'data cleaning',
    'automation',
    'NextRows',
    'API',
    'data processing',
    'ETL',
    'no-code',
    'data transformation'
  ];
  
  const allKeywords = [...new Set([...defaultKeywords, ...keywords])];

  return {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: [{ name: author }],
    creator: 'NextRows',
    publisher: 'NextRows',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: 'NextRows Blog',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: 'en_US',
      type: type === 'article' ? 'article' : 'website',
      ...(type === 'article' && publishedTime && {
        article: {
          publishedTime,
          modifiedTime: modifiedTime || publishedTime,
          authors: [author],
          tags: keywords,
        }
      }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@nextrows',
      creator: '@nextrows',
      title: fullTitle,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: noindex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateArticleStructuredData({
  title,
  description,
  url,
  image,
  author,
  publishedTime,
  modifiedTime,
  keywords = [],
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  keywords?: string[];
}) {
  const fullImageUrl = image.startsWith('http') ? image : `${HOST[getEnv()]}${image}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    image: fullImageUrl,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'NextRows',
      logo: {
        '@type': 'ImageObject',
        url: `${HOST[getEnv()]}/assets/nextrows-logo.svg`,
      },
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    keywords: keywords.join(', '),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NextRows',
    url: 'https://nextrows.com',
    logo: `${HOST[getEnv()]}/assets/nextrows-logo.svg`,
    description: 'NextRows is a powerful data extraction and automation platform that simplifies web scraping and data processing.',
    sameAs: [
      'https://twitter.com/nextrows',
      'https://github.com/wordbricks',
      'https://www.linkedin.com/company/nextrows',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@nextrows.com',
      contactType: 'customer support',
      availableLanguage: ['English'],
    },
  };
}

export function generateWebSiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NextRows Blog',
    url: HOST[getEnv()],
    description: 'Learn web scraping, data cleaning, and automation techniques with NextRows.',
    publisher: {
      '@type': 'Organization',
      name: 'NextRows',
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${HOST[getEnv()]}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
