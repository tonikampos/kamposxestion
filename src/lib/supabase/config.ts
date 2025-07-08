import { createClient } from '@supabase/supabase-js';

// Valores predeterminados hardcodeados como último recurso
// Estos valores solo se utilizarán si fallan todas las demás formas de carga
const HARDCODED_FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://qyufkainizdkcnkxzupv.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dWZrYWluaXpka2Nua3h6dXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTc3NTcsImV4cCI6MjA2NzM3Mzc1N30.nx3LBmPz2D5UnZXgCtT9zRc6cVXY9rMN2MsP1ETNw8Q'
};

// Función para verificar si un valor de variable es válido
const isValidValue = (value: string | null | undefined): boolean => {
  return Boolean(value && !value.includes('{{') && !value.includes('}}') && value !== 'placeholder-for-static-export');
};

// Función mejorada para obtener variables de entorno
// Prueba todas las fuentes posibles y utiliza valores hardcodeados como último recurso
const getEnvVariable = (name: string): string => {
  let value: string | undefined;
  
  if (typeof window !== 'undefined') {
    try {
      // 1. Intentar obtener desde localStorage (preferido)
      const localValue = localStorage.getItem(name);
      if (isValidValue(localValue)) {
        console.log(`✅ Variable ${name} obtenida desde localStorage`);
        return localValue!;
      }
      
      // 2. Intentar obtener desde window.ENV
      if (window.ENV && isValidValue(window.ENV[name])) {
        console.log(`✅ Variable ${name} obtenida desde window.ENV`);
        value = window.ENV[name];
        // Guardar en localStorage para futuras referencias
        localStorage.setItem(name, value);
        return value;
      }
      
      // 3. Intentar valores de process.env (en desarrollo)
      if (process.env && isValidValue(process.env[name])) {
        console.log(`✅ Variable ${name} obtenida desde process.env`);
        value = process.env[name]!;
        return value;
      }
      
      // 4. Último recurso: usar valores hardcodeados
      if (HARDCODED_FALLBACKS[name as keyof typeof HARDCODED_FALLBACKS]) {
        console.warn(`⚠️ Usando valor HARDCODED para ${name} - Isto só debería ocorrer se as variables de Netlify non están configuradas`);
        value = HARDCODED_FALLBACKS[name as keyof typeof HARDCODED_FALLBACKS];
        // Guardar en localStorage para futuras referencias
        localStorage.setItem(name, value);
        return value;
      }
      
    } catch (error) {
      console.error(`❌ Erro ao acceder ás variables de entorno para ${name}:`, error);
    }
  } else {
    // En SSR o durante la exportación estática, intentar usar process.env
    if (process.env && isValidValue(process.env[name])) {
      return process.env[name]!;
    }
  }
  
  // Si llegamos aquí, no pudimos obtener un valor válido
  console.error(`❌ Non se puido obter un valor válido para ${name}`);
  
  // Devolver un valor predeterminado como último recurso
  // Esto evitará errores de inicialización pero la conexión no funcionará correctamente
  return HARDCODED_FALLBACKS[name as keyof typeof HARDCODED_FALLBACKS] || 'https://placeholder-for-static-export.supabase.co';
};

// Obter as variables de configuración de Supabase con manejo mejorado
const supabaseUrl = getEnvVariable('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Crea un cliente de Supabase lazy-loaded (só se inicializa cando é necesario)
let _supabase: any = null;

// Función mejorada para validar variables
const validateEnvVariables = (): boolean => {
  const validUrl = isValidValue(supabaseUrl) && supabaseUrl.startsWith('https://');
  const validKey = isValidValue(supabaseAnonKey) && supabaseAnonKey.length > 20;
                  
  if (!validUrl) {
    console.error('❌ URL de Supabase inválida:', supabaseUrl);
  }
  
  if (!validKey) {
    console.error('❌ Clave anónima de Supabase inválida (lonxitude insuficiente)');
  }
  
  return validUrl && validKey;
};

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Durante o SSR ou a exportación estática, devolvemos un cliente básico
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  
  // No cliente, verificamos as variables de entorno
  if (!validateEnvVariables()) {
    console.error('❌ ERRO CRÍTICO: Variables de entorno de Supabase non válidas');
    console.log('Intentando usar valores de respaldo hardcodeados...');
    
    // Intentar usar los valores hardcodeados como último recurso
    try {
      console.log('Inicializando cliente con valores de respaldo hardcodeados');
      
      const fallbackUrl = HARDCODED_FALLBACKS.NEXT_PUBLIC_SUPABASE_URL;
      const fallbackKey = HARDCODED_FALLBACKS.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      return createClient(fallbackUrl, fallbackKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    } catch (e) {
      console.error('❌ Error al crear cliente incluso con valores fallback:', e);
      // Devolver un objeto ficticio con la misma API para evitar errores
      return {
        auth: { 
          signUp: () => Promise.reject('Supabase non configurado correctamente'), 
          signIn: () => Promise.reject('Supabase non configurado correctamente'),
          getSession: () => Promise.resolve({ data: { session: null }, error: null })
        },
        from: () => ({ 
          select: () => Promise.reject('Supabase non configurado correctamente'),
          insert: () => Promise.reject('Supabase non configurado correctamente')
        })
      } as any;
    }
  }
  
  // No cliente, inicializamos o cliente só unha vez e usámolo para todas as chamadas
  if (!_supabase) {
    try {
      console.log('Inicializando cliente Supabase con:', { 
        url: supabaseUrl.substring(0, 20) + '...', 
        keyLength: supabaseAnonKey.length 
      });
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('Cliente Supabase inicializado correctamente');
      
      // Verificar la conexión con una petición simple
      _supabase.from('profiles').select('count', { count: 'exact', head: true })
        .then(() => console.log('✅ Conexión a Supabase verificada correctamente'))
        .catch((err: any) => console.error('❌ Error al verificar la conexión a Supabase:', err));
      
    } catch (error) {
      console.error('Erro ao inicializar cliente Supabase:', error);
      throw new Error('Non se puido inicializar o cliente de Supabase: ' + (error as Error).message);
    }
  }
  
  return _supabase;
})();

// Función para obter o cliente de Supabase coa clave de servizo (só para uso en servidor)
export const getServiceSupabase = () => {
  const serviceRoleKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  
  // Nota: Este cliente só debe usarse no servidor en tempo de execución, non durante a exportación
  return createClient(supabaseUrl, serviceRoleKey);
};
