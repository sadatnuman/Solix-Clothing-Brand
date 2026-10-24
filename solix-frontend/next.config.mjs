const serverApiUrl = (process.env.SERVER_API_URL || "http://localhost:3000").replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${serverApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
