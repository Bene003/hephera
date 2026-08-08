import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/", destination: "/fr", permanent: false },
      { source: "/services", destination: "/fr/services", permanent: false },
      { source: "/contact", destination: "/fr/contact", permanent: false },
    ];
  },
};

export default nextConfig;
