import Footer from "@/app/(client)/_components/footer";
import Navigation from "@/app/(client)/_components/navigation";
import FirstVisitPopup from "@/app/(client)/_components/first-visit-popup";
import CommandPalette from "@/app/(client)/_components/command-palette";
import {
  generateOrganizationStructuredData,
  generateWebSiteStructuredData,
} from "@/app/(client)/_components/seo";
import { HOME_OG_IMAGE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HOST } from "@/env/host";
import { getEnv } from "@/env/getEnv";
import { BASE_PATH } from "@/env/basePath";

import "@/app/globals.css";
import { cn } from "@/utils/cn";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(HOST[getEnv()]),
  title: {
    default: "NextRows Blog - Data Processing & Web Scraping Insights",
    template: "%s | NextRows Blog",
  },
  description:
    "Learn web scraping, data cleaning, and automation techniques. Tutorials, guides, and insights from the NextRows team to transform your data processing workflow.",
  keywords: [
    "web scraping",
    "data cleaning",
    "automation",
    "NextRows",
    "data processing",
    "Python",
    "tutorials",
    "ETL",
    "data extraction",
  ],
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
    description:
      "Learn web scraping, data cleaning, and automation techniques with NextRows.",
    url: "/",
    siteName: "NextRows Blog",
    images: [
      {
        url: HOME_OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "NextRows Blog",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextRows Blog - Data Processing & Web Scraping Insights",
    description:
      "Learn web scraping, data cleaning, and automation techniques with NextRows.",
    images: [HOME_OG_IMAGE_URL],
  },
  alternates: {
    canonical: "/",
    types: {
      "application/atom+xml": [
        { url: "/atom.xml", title: "NextRows Blog Atom Feed" },
      ],
    },
  },
  icons: {
    icon: `${BASE_PATH}/favicon.svg`,
    shortcut: `${BASE_PATH}/favicon.svg`,
    apple: `${BASE_PATH}/favicon/apple-touch-icon.png`,
    other: [
      {
        rel: "mask-icon",
        url: `${BASE_PATH}/favicon/safari-pinned-tab.svg`,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content={`${BASE_PATH}/favicon/browserconfig.xml`}
        />
        <meta name="theme-color" content="#000" />
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
      <body
        className={cn(
          inter.className,
          "bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-200",
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded px-3 py-2 shadow"
        >
          Skip to content
        </a>
        <Navigation />
        <CommandPalette />
        <FirstVisitPopup />
        <div id="main-content" className="min-h-screen">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
