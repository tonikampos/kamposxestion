'use client';

// Script para cargar las variables de entorno en el cliente desde varias fuentes posibles
// Este script debe ejecutarse antes de cualquier intento de conexión a Supabase

// Función para verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

// Función para obtener las variables de entorno en el cliente
const loadEnvVariables = () => {
  if (!isBrowser) return;

  try {
    console.log('Cargando variables de entorno do cliente...');
    
    // Intentar obtener desde window.ENV (configurado por env-config.js)
    if (window.ENV) {
      Object.keys(window.ENV).forEach(key => {
        if (!window.ENV![key].includes('{{')) {
          localStorage.setItem(key, window.ENV![key]);
          console.log(`Cargada variable ${key} desde window.ENV`);
        }
      });
    } else {
      console.log('Non se atopou window.ENV');
    }

    // Log para debugging
    console.log('NEXT_PUBLIC_SUPABASE_URL:', localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL')?.substring(0, 10) + '...');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY existe:', !!localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  } catch (error) {
    console.error('Erro ao cargar variables de entorno:', error);
  }
};

// Cargar variables inmediatamente
if (isBrowser) {
  loadEnvVariables();
}

export { loadEnvVariables };
