import nextra from 'nextra'

const withNextra = nextra({
  // App Router: themes are used via components; plugin handles MD/MDX.
  // Keep built-in search integration enabled.
  search: true
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/blog',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

export default withNextra(nextConfig)
