import { createClient } from '@supabase/supabase-js';

// Función para obter as variables de entorno no cliente
// Primeiro intenta usar window.ENV, despois localStorage, e finalmente process.env
const getEnvVariable = (name: string, defaultValue: string = '') => {
  if (typeof window !== 'undefined') {
    // Comprobamos se temos as variables en window.ENV (establecidas por env-config.js)
    if (window.ENV && window.ENV[name] && !window.ENV[name].includes('{{')) {
      return window.ENV[name];
    }
    
    // Comprobamos se temos as variables en localStorage (establecidas polo script en layout.tsx)
    const localValue = localStorage.getItem(name);
    if (localValue && !localValue.includes('{{')) {
      return localValue;
    }
  }
  
  // En último caso, usamos process.env (dispoñible durante o build)
  return process.env[name] || defaultValue;
};

// Obter as variables de configuración de Supabase
const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL', 'https://placeholder-for-static-export.supabase.co');
const supabaseAnonKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'placeholder-for-static-export');

// Crea un cliente de Supabase lazy-loaded (só se inicializa cando é necesario)
// Isto evita problemas durante a exportación estática
let _supabase: any = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Durante o SSR ou a exportación estática, devolvemos un cliente básico
    // que non intentará conectar realmente
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  // No cliente, inicializamos o cliente só unha vez e usámolo para todas as chamadas
  if (!_supabase) {
    console.log('Inicializando cliente Supabase con:', { 
      url: supabaseUrl.substring(0, 20) + '...', 
      keyLength: supabaseAnonKey.length 
    });
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return _supabase;
})();

// Función para obter o cliente de Supabase coa clave de servizo (só para uso en servidor)
export const getServiceSupabase = () => {
  const serviceRoleKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY', 'placeholder-for-static-export');
  
  // Nota: Este cliente só debe usarse no servidor en tempo de execución, non durante a exportación
  return createClient(supabaseUrl, serviceRoleKey);
};
