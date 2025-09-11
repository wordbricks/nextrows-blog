import Footer from "@/app/_components/footer";
import Navigation from "@/app/_components/navigation";
import FirstVisitPopup from "@/app/_components/first-visit-popup";
import CommandPalette from "@/app/_components/command-palette";
import { generateOrganizationStructuredData, generateWebSiteStructuredData } from "@/app/_components/seo";
import { HOME_OG_IMAGE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://blog.nextrows.com'),
  title: {
    default: "NextRows Blog - Data Processing & Web Scraping Insights",
    template: "%s | NextRows Blog"
  },
  description: "Learn web scraping, data cleaning, and automation techniques. Tutorials, guides, and insights from the NextRows team to transform your data processing workflow.",
  keywords: ["web scraping", "data cleaning", "automation", "NextRows", "data processing", "Python", "tutorials", "ETL", "data extraction"],
  authors: [{ name: "NextRows Team" }],
  creator: "NextRows",
  publisher: "NextRows",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "NextRows Blog - Data Processing & Web Scraping Insights",
    description: "Learn web scraping, data cleaning, and automation techniques with NextRows.",
    url: 'https://blog.nextrows.com',
    siteName: 'NextRows Blog',
    images: [
      {
        url: HOME_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: 'NextRows Blog',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextRows Blog - Data Processing & Web Scraping Insights',
    description: 'Learn web scraping, data cleaning, and automation techniques with NextRows.',
    images: [HOME_OG_IMAGE_URL],
  },
  alternates: {
    canonical: 'https://blog.nextrows.com',
    types: {
      'application/atom+xml': [{ url: '/atom.xml', title: 'NextRows Blog Atom Feed' }],
    },
  },
  robots: {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="/favicon.svg"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#000000"
        />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationStructuredData()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteStructuredData()),
          }}
        />
      </head>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-200`}>
        <Navigation />
        <CommandPalette />
        <FirstVisitPopup />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
