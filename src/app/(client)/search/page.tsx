import type { Metadata } from 'next'
import SearchClient from './SearchClient'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    }
  }
}

export default function SearchPage() {
  return <SearchClient />
}
