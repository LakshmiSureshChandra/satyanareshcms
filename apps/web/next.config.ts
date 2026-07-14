import type { NextConfig } from "next";

// Proxy API + uploaded images to the Express server so the browser only ever
// talks to the same origin as the page. Works on localhost, a demo subdomain,
// or the final domain with zero rebuild. (afterFiles: Next's own /api/revalidate
// route still wins; everything else under /api falls through to Express.)
const INTERNAL_API = process.env.API_URL || "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${INTERNAL_API}/api/:path*` },
      { source: "/uploads/:path*", destination: `${INTERNAL_API}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
