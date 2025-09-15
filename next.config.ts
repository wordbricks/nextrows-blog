import type { NextConfig } from "next";
import nextra from "nextra";

const BASE_PATH = "/blog";

const withNextra = nextra({
  // App Router: themes are used via components; plugin handles MD/MDX.
  // Keep built-in search integration enabled.
  search: true,
});

const config: NextConfig = {
  basePath: BASE_PATH,
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
        destination: BASE_PATH,
        permanent: true,
        basePath: false,
      },
    ];
  },
};

export default withNextra(config);
