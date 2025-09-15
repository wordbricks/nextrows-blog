import type { NextConfig } from "next";
import nextra from "nextra";

const withNextra = nextra({
  // App Router: themes are used via components; plugin handles MD/MDX.
  // Keep built-in search integration enabled.
  search: true,
});

const config: NextConfig = {
  basePath: "/blog",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/blog",
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default withNextra(config);
