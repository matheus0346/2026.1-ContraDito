import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "www.camara.leg.br" },
      { protocol: "https", hostname: "**.camara.gov.br" },
      // Fotos do Senado vêm como http://www.senado.leg.br/... (a API devolve http, não https).
      { protocol: "http", hostname: "www.senado.leg.br" },
      { protocol: "https", hostname: "www.senado.leg.br" },
      { protocol: "https", hostname: "**.senado.leg.br" },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
