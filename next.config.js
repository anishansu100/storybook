import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    middlewareClientMaxBodySize: "50mb",
  },
  images: {
    remotePatterns: [
      // fal.ai generated images
      { hostname: "fal.media" },
      { hostname: "*.fal.media" },
      // Supabase storage
      { hostname: "*.supabase.co" },
    ],
  },
};

export default config;
