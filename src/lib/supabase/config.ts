import { createClient } from '@supabase/supabase-js';

// Usamos valores vacíos durante el build para evitar cualquier problema con Netlify
// Las variables reales se cargarán solo en tiempo de ejecución en el navegador
const HARDCODED_FALLBACKS = {
  NEXT_PUBLIC_SUPABASE_URL: '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ''
};

// Función para verificar si un valor de variable es válido
const isValidValue = (value: string | null | undefined): boolean => {
  return Boolean(value && !value.includes('{{') && !value.includes('}}') && value !== 'placeholder-for-static-export');
};

// Función para reiniciar el cliente de Supabase
export const reinitializeSupabaseClient = (): void => {
  if (typeof window === 'undefined') {
    console.log('⚠️ reinitializeSupabaseClient só pode ser chamado no cliente');
    return;
  }
  
  console.log('🔄 Reiniciando cliente de Supabase...');
  
  try {
    // Limpar a sesión actual
    localStorage.removeItem('supabase.auth.token');
    
    // Reiniciar o cliente
    _supabase = null;
    
    // Intentar inicializar de novo
    const client = supabase;
    console.log('✅ Cliente de Supabase reiniciado correctamente');
    
    // Comprobar conexión
    client.from('profiles').select('count', { count: 'exact', head: true })
      .then(() => console.log('✅ Conexión con Supabase verificada despois de reiniciar'))
      .catch((err: any) => console.error('❌ Error ao verificar conexión despois de reiniciar:', err));
      
  } catch (error) {
    console.error('❌ Error ao reiniciar o cliente de Supabase:', error);
  }
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
  // Detectar si estamos en fase de exportación estática para Netlify
  if (typeof window === 'undefined') {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      // Durante la exportación estática, creamos un cliente mínimo con métodos simulados
      console.log('🏗️ Exportación estática: Creando cliente simulado de Supabase');
      return {
        auth: {
          signUp: () => Promise.resolve({ data: {}, error: null }),
          signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
          signOut: () => Promise.resolve({ error: null }),
          getSession: () => Promise.resolve({ data: { session: null }, error: null })
        },
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: {}, error: null }),
          upsert: () => Promise.resolve({ data: {}, error: null })
        }),
        rpc: () => Promise.resolve({ data: {}, error: null })
      } as any;
    }
    
    // Durante o SSR normal, devolvemos un cliente básico
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
      // Configuración explícita para funcionar sin emails
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Cambiamos a false para evitar interferencias
          flowType: 'implicit' // Autenticación sin emails
        }
      });
      console.log('Cliente Supabase inicializado correctamente (con emails DESACTIVADOS)');
      
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
  // En el entorno de Netlify, los usuarios normales no deberían poder crear otros usuarios
  // Vamos a intentar simplificar el registro usando signUp normal en lugar de admin.createUser
  if (typeof window !== 'undefined') {
    console.log('⚠️ Solicitando cliente de servicio desde el navegador. Esto no es ideal, pero intentaremos hacerlo funcionar...');
    
    // En Netlify, para simplificar, usaremos el método de registro normal en lugar de admin
    return supabase;
  }
  
  // Este código solo debería ejecutarse en un entorno de servidor real
  const serviceRoleKey = getEnvVariable('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  
  // Validar la clave de servicio
  if (!isValidValue(serviceRoleKey) || serviceRoleKey.length < 20) {
    console.error('❌ Clave de servizo de Supabase inválida ou non configurada');
    console.error('Por favor, asegúrate de configurar NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY en Netlify');
    return supabase; // Usar el cliente normal como fallback
  }
  
  // Nota: Este cliente só debe usarse no servidor en tempo de execución, non durante a exportación
  return createClient(supabaseUrl, serviceRoleKey);
};
