import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //TODO: re-search about this image-configuration

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.example.co",
        port: "",
        pathname: "/account123/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;