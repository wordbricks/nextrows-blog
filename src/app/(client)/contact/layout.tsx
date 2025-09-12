import { Metadata } from 'next';
import { generateSEOMetadata } from '@/app/(client)/_components/seo';
import { HOST } from '@/env/host';
import { getEnv } from '@/env/getEnv';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Contact Us',
  description: 'Get in touch with the NextRows team. We provide support for web scraping, data extraction, and automation questions. Response within 24 hours.',
  url: '/contact',
  keywords: ['contact', 'support', 'help', 'customer service', 'inquiries', 'feedback'],
  type: 'website',
});

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is NextRows?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'NextRows is a no-code web scraping tool that helps you extract data from websites without writing any code.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I get started?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Simply sign up for a free account and follow our getting started guide to begin extracting data immediately.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer a free trial?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Yes! Your first few extractions are on us. We're confident that once you experience how easy NextRows makes data extraction, you'll be eager to upgrade for unlimited access.",
        },
      },
      {
        '@type': 'Question',
        name: 'Can I export my data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely! You can export your data in multiple formats including CSV and XLS.',
        },
      },
    ],
  };

  const contactPageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact NextRows',
    description: 'Contact the NextRows team for support, sales inquiries, or partnership opportunities.',
    url: '/contact',
    mainEntity: {
      '@type': 'Organization',
      name: 'NextRows',
      email: 'support@nextrows.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'San Francisco',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageStructuredData) }}
      />
      {children}
    </>
  );
}
