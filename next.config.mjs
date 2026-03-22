/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Add this one
      },
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ignitingbusiness.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co.com',
      },
    ],
  },
};

export default nextConfig;