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
  // Configuración para Next.js App Router
  trailingSlash: true,
  
  // Excluir rutas API de la exportación estática
  experimental: {
    excludeDefaultMomentLocales: true,
  },
};

module.exports = nextConfig;
