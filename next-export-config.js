/** 
 * Configuración para exportación estática con Next.js para Netlify
 * Este archivo ayuda a excluir rutas API de la exportación estática
 */
module.exports = {
  excludePages: [
    '/api/auth/check',
    '/api/auth/check-sql'
  ],
  // Devolver un fallback para rutas API
  fallback: {
    '/api/auth/check': {
      props: { message: 'Esta API solo está disponible en tiempo de ejecución' },
      revalidate: false
    },
    '/api/auth/check-sql': {
      props: { message: 'Esta API solo está disponible en tiempo de ejecución' },
      revalidate: false
    }
  }
};
