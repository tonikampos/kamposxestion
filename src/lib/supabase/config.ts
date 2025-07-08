import { createClient } from '@supabase/supabase-js';

// Verifica se as variables de entorno están definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As variables de entorno de Supabase non están definidas');
}

// Crea o cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función para obter o cliente de Supabase coa clave de servizo (só para uso en servidor)
export const getServiceSupabase = () => {
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('A clave de servizo de Supabase non está definida');
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
