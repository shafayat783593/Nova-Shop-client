/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'img.freepik.com' },
      { protocol: 'https', hostname: 'cdn.ignitingbusiness.com' },
      { protocol: 'https', hostname: 'i.ibb.co.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  async rewrites() {
    return [
      // backend API proxy
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/:path*`,
      },
      // Google OAuth success page → actual folder location
      {
        source: "/auth/google/success",
        destination: "/google/success",
      },
    ];
  },
};

export default nextConfig;