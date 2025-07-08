/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  eslint: {
    // Advertencias de ESLint en desarrollo, ignorar en producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Permiso para ignorar errores de TypeScript durante la compilación
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
