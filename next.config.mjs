/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.freepik.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.ignitingbusiness.com', // Added this domain
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co.com', 
      },
    ],
  },
};

export default nextConfig;