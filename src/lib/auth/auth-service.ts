import { supabase, getServiceSupabase } from '../supabase/config';

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

/**
 * Register a new user with email and password
 */
export const registerUser = async (
  email: string, 
  password: string, 
  fullName: string
): Promise<UserData> => {
  try {
    console.log('Iniciando rexistro de usuario:', { email, fullName });
    
    // Verificar si las variables de entorno están configuradas correctamente
    const envVars = {
      url: typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') : null,
      key: typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') : null,
    };
    
    console.log('Variables disponibles para registro:', {
      url_available: Boolean(envVars.url),
      key_available: Boolean(envVars.key)
    });
    
    // Sistema simplificado sen verificación de email
    
    // Paso 1: Crear o usuario con signUp normal
    console.log('Intentando crear usuario con signUp...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'profesor'
        },
        // Desactivamos el email de confirmación
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      console.error('Erro ao crear usuario en Auth:', authError);
      throw new Error(`Erro de autenticación: ${authError.message}`);
    }
    
    if (!authData.user) {
      console.error('Non se puido crear o usuario: authData.user é null ou undefined');
      throw new Error('Non se puido crear o usuario');
    }

    console.log('Usuario creado con éxito:', { userId: authData.user.id });

    // Paso 2: Crear o perfil na táboa profiles
    console.log('Insertando perfil para:', {
      id: authData.user.id,
      email,
      full_name: fullName
    });
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id, 
        email: email, 
        full_name: fullName,
        role: 'profesor'
      });
    
    if (profileError) {
      console.error('Erro ao crear o perfil:', profileError);
      // Continuamos aínda que falle a creación do perfil
    } else {
      console.log('Perfil creado con éxito');
    }
    
    // Iniciar sesión automáticamente con el nuevo usuario
    console.log('Iniciando sesión automáticamente con el novo usuario...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      console.warn('Non se puido iniciar sesión automáticamente tras o rexistro:', signInError);
    } else {
      console.log('Sesión iniciada automáticamente tras o rexistro');
    }
    
    // Construír e devolver os datos do usuario
    const userData: UserData = {
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'profesor'
    };
    
    console.log('Rexistro de usuario completado con éxito:', userData);
    return userData;
  } catch (error: unknown) {
    console.error('Erro completo ao rexistrar usuario:', error);
    // Asegurarse de que se devolve unha mensaxe de erro lexible
    if (error instanceof Error) {
      throw new Error(error.message);
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      throw new Error((error as {message: string}).message || 'Erro descoñecido ao rexistrar usuario');
    } else {
      throw new Error('Erro descoñecido ao rexistrar usuario');
    }
  }
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (
  email: string, 
  password: string
): Promise<UserData> => {
  try {
    console.log('Intentando iniciar sesión:', { email });
    
    // Crear una promesa con timeout para evitar que se quede colgado
    const signInWithTimeout = async (timeoutMs: number = 10000) => {
      let timeoutId: NodeJS.Timeout;
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('A conexión con Supabase está tardando demasiado. Por favor, reinicie a conexión e inténteo de novo.'));
        }, timeoutMs);
      });
      
      try {
        const result = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeoutPromise
        ]) as { data: any, error: any };
        
        clearTimeout(timeoutId!);
        return result;
      } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
      }
    };
    
    // Autenticación simplificada sen verificar se o email está verificado
    const { data, error } = await signInWithTimeout();
    
    if (error) {
      console.error('Error al iniciar sesión:', error);
      throw error;
    }
    
    if (!data.user) {
      console.error('No se pudo iniciar sesión: data.user es null o undefined');
      throw new Error('Non se puido iniciar sesión');
    }
    
    console.log('Inicio de sesión exitoso:', { userId: data.user.id });
    
    // Obter datos do perfil dende a táboa profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 é "Non se atoparon resultados"
      console.error("Erro obtendo perfil:", profileError);
    }
    
    // Se o perfil existe, devolvémolo, se non, usamos os datos de autenticación
    if (profileData) {
      return {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        created_at: profileData.created_at
      };
    } else {
      // Crear perfil básico se non existe
      const userData: UserData = {
        id: data.user.id,
        email: data.user.email || email,
        full_name: data.user.user_metadata.full_name,
        role: data.user.user_metadata.role || 'profesor'
      };
      
      await supabase.from('profiles').insert([userData]);
      return userData;
    }
  } catch (error: unknown) {
    console.error("Erro ao iniciar sesión:", error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Erro descoñecido ao iniciar sesión');
    }
  }
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    console.log('Iniciando signOut en auth-service');
    
    // Crear una promesa con timeout para evitar que se quede colgado
    const signOutWithTimeout = async (timeoutMs: number = 5000) => {
      let timeoutId: NodeJS.Timeout;
      
      const timeoutPromise = new Promise<{error: Error}>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject({error: new Error('Timeout ao pechar sesión')});
        }, timeoutMs);
      });
      
      try {
        // Intentar pechar sesión con un timeout para que no se quede colgado
        const result = await Promise.race([
          supabase.auth.signOut(),
          timeoutPromise
        ]) as {error: Error | null};
        
        clearTimeout(timeoutId!);
        return result;
      } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
      }
    };
    
    // Primeiro verificamos se hai unha sesión activa
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      console.log('Non hai sesión activa para pechar');
    } else {
      console.log('Sesión activa atopada, procedendo a pechala');
      
      // Almacenamos usuario actual para debug
      const currentUser = sessionData.session.user;
      console.log('Usuario que pecha sesión:', {
        id: currentUser.id,
        email: currentUser.email
      });
      
      // Intentamos pechar a sesión en Supabase con timeout
      const { error } = await signOutWithTimeout();
      
      if (error) {
        console.error('Erro durante o peche de sesión:', error);
        console.log('Continuando con limpeza manual de estado local...');
      } else {
        console.log('Sesión pechada en Supabase correctamente');
      }
    }
    
    // Limpar SEMPRE o estado local, independentemente do resultado anterior
    if (typeof window !== 'undefined') {
      console.log('Limpando estado local...');
      
      try {
        // Eliminar todas las cookies relacionadas con la sesión
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          if (name.includes('supabase') || name.includes('auth')) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
        
        // Limpiar variables específicas de supabase en localStorage
        const supabaseKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('auth'))) {
            supabaseKeys.push(key);
          }
        }
        
        supabaseKeys.forEach(key => localStorage.removeItem(key));
        console.log(`Eliminados ${supabaseKeys.length} items relacionados con Supabase del localStorage`);
        
        // Preservar variables de entorno importantes
        const keysToKeep = [
          'NEXT_PUBLIC_SUPABASE_URL', 
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ];
        
        keysToKeep.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) console.log(`Preservada variable ${key}`);
        });
      } catch (e) {
        console.error('Erro ao limpar cookies/localStorage:', e);
      }
    }
    
    console.log('Proceso de signOut completado');
  } catch (error) {
    console.error('Erro durante o signOut:', error);
    throw error;
  }
};

/**
 * Get the current user data from Supabase
 */
export const getCurrentUserData = async (): Promise<UserData | null> => {
  try {
    // Obter o usuario actual da sesión de Supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    if (!sessionData.session?.user) return null;
    
    const userId = sessionData.session.user.id;
    
    // Obter datos do perfil dende a táboa profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("Erro obtendo perfil:", profileError);
      return null;
    }
    
    if (profileData) {
      return {
        id: profileData.id,
        email: profileData.email,
        full_name: profileData.full_name,
        role: profileData.role,
        created_at: profileData.created_at
      };
    }
    
    // Se non hai perfil pero hai usuario autenticado, usamos os datos de autenticación
    return {
      id: userId,
      email: sessionData.session.user.email || '',
      full_name: sessionData.session.user.user_metadata.full_name,
      role: sessionData.session.user.user_metadata.role || 'profesor'
    };
  } catch (error) {
    console.error("Erro ao obter datos do usuario:", error);
    return null;
  }
};
