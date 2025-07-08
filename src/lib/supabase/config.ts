import { createClient } from '@supabase/supabase-js';

// Configura as variables de Supabase con valores por defecto para a exportación estática
// Durante a exportación usamos valores de placeholder que serán reemplazados polos reais no cliente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-for-static-export.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-for-static-export';

// Crea o cliente de Supabase
// Esta instancia só se usará en tempo de execución no navegador, non durante a exportación estática
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para obter o cliente de Supabase coa clave de servizo (só para uso en servidor)
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || 'placeholder-for-static-export';
  
  // Nota: Este cliente só debe usarse no servidor en tempo de execución, non durante a exportación
  return createClient(supabaseUrl, serviceRoleKey);
};
