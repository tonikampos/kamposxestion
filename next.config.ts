import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Para compatibilidad con Netlify
  output: 'standalone',
  
  // Configuraciones adicionales
  reactStrictMode: true,
};

export default nextConfig;
