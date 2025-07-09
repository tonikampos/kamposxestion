import { supabase, getServiceSupabase, reinitializeSupabaseClient } from '../supabase/config';

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at?: string;
}

/**
 * Marca un usuario como confirmado manualmente, sin necesidad de verificación por email
 */
const confirmUserManually = async (userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') {
      // Solo en un entorno real de servidor
      const serviceClient = getServiceSupabase();
      // Esto solo funcionaría con la clave de servicio en un entorno de servidor
      await serviceClient.auth.admin.updateUserById(userId, { email_confirmed: true });
      return true;
    } else {
      // En el cliente, simplemente registramos la intención
      console.log('Intentando confirmar usuario manualmente, pero esto solo funciona en servidor:', userId);
      return true;
    }
  } catch (error) {
    console.error('Error al confirmar usuario manualmente:', error);
    return false;
  }
};

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
    
    // Paso 1: Verificar que el cliente está inicializado correctamente
    try {
      const { data: sessionCheck } = await supabase.auth.getSession();
      console.log('Verificación de cliente Supabase:', { 
        client_initialized: !!supabase,
        can_get_session: !!sessionCheck
      });
    } catch (checkError) {
      console.error('Error al verificar cliente Supabase:', checkError);
      // Intentar reiniciar el cliente si está disponible
      if (typeof reinitializeSupabaseClient === 'function' && typeof window !== 'undefined') {
        console.log('Intentando reiniciar el cliente Supabase antes de continuar...');
        reinitializeSupabaseClient();
      }
    }
    
    // Paso 2: Crear o usuario con signUp normal
    console.log('Intentando crear usuario con signUp (flowType: implicit)...');
    // Configuración explícita para asegurar que funciona sin emails
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: 'profesor'
        },
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    });

    if (authError) {
      console.error('Erro ao crear usuario en Auth:', authError);
      // Error más específico para diagnóstico
      if (authError.message.includes('JWT')) {
        throw new Error(`Erro de autenticación JWT: Posible problema con o cliente Supabase`);
      } else if (authError.message.includes('network')) {
        throw new Error(`Erro de rede: Verifica a conexión a internet ou os proxies`);
      } else {
        throw new Error(`Erro de autenticación: ${authError.message}`);
      }
    }
    
    if (!authData.user) {
      console.error('Non se puido crear o usuario: authData.user é null ou undefined');
      throw new Error('Non se puido crear o usuario');
    }

    console.log('Usuario creado con éxito:', { userId: authData.user.id, user_data: authData.user });

    // Paso 2: Intentar confirmar manualmente para evitar cualquier problema con emails
    // Nota: Esta función puede no tener efecto en el cliente, pero al menos lo intentamos
    await confirmUserManually(authData.user.id);

    // Paso 3: Verificar estructura de la tabla profiles
    try {
      console.log('Verificando estructura de tabla profiles...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (tableError) {
        console.error('Error al verificar tabla profiles:', tableError);
        console.log('La tabla profiles puede no existir o tener problemas de acceso');
      } else {
        console.log('Tabla profiles accesible correctamente');
      }
    } catch (tableCheckError) {
      console.error('Excepción al verificar tabla profiles:', tableCheckError);
    }
    
    // Paso 4: Crear o perfil na táboa profiles con UPSERT como estrategia principal
    console.log('Insertando perfil para:', {
      id: authData.user.id,
      email,
      full_name: fullName
    });
    
    // Usar directamente upsert que es más seguro
    try {
      console.log('Utilizando upsert para garantizar la creación del perfil...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id, 
          email: email, 
          full_name: fullName,
          role: 'profesor',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id',
          returning: 'minimal'  // No necesitamos los datos de retorno
        });
      
      if (profileError) {
        console.error('Erro ao crear o perfil con upsert:', profileError);
        
        // Verificar si hay problemas con la estructura de la tabla
        if (profileError.message?.includes('column') && profileError.message?.includes('does not exist')) {
          console.error('Error de estructura de tabla:', profileError.message);
          // Intentar una versión minimalista con solo los campos esenciales
          const { error: minimalError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id, 
              email: email, 
              full_name: fullName,
              role: 'profesor'
            }, { onConflict: 'id' });
            
          if (!minimalError) {
            console.log('Perfil creado con campos mínimos');
          } else {
            console.error('Fallo incluso con campos mínimos:', minimalError);
            throw new Error(`Error al crear perfil incluso con campos mínimos: ${minimalError.message}`);
          }
        } else {
          // Para otros errores, intentar insert directo
          console.log('Intentando insert como alternativa...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id, 
              email: email, 
              full_name: fullName,
              role: 'profesor'
            });
            
          if (insertError) {
            // Solo reportar, no fallar todo el registro
            console.error('Error en insert alternativo:', insertError);
          } else {
            console.log('Insert alternativo exitoso');
          }
        }
      } else {
        console.log('Perfil creado/actualizado con éxito');
      }
    } catch (profileOperationError) {
      console.error('Excepción general al gestionar el perfil:', profileOperationError);
      // No lanzamos error aquí, continuamos el flujo
    }
    
    // Paso 5: Esperar brevemente para darle tiempo al sistema a procesar
    if (typeof window !== 'undefined') {
      console.log('Esperando 500ms antes de iniciar sesión automáticamente...');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Paso 6: Iniciar sesión automáticamente con el nuevo usuario
    console.log('Iniciando sesión automáticamente con el nuevo usuario...');
    
    try {
      // Verificar si ya tenemos una sesión activa
      const { data: existingSession } = await supabase.auth.getSession();
      
      if (existingSession?.session) {
        console.log('Ya existe una sesión activa, verificando si es del usuario correcto...');
        
        if (existingSession.session.user.id === authData.user.id) {
          console.log('La sesión activa ya pertenece al usuario recién registrado');
          // Ya tenemos la sesión correcta
          return {
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'profesor'
          };
        }
        
        // Si la sesión es de otro usuario, hay que hacer logout primero
        console.log('La sesión activa pertenece a otro usuario, haciendo logout...');
        await supabase.auth.signOut();
        
        // Esperar brevemente antes de intentar el nuevo login
        if (typeof window !== 'undefined') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Usar signInWithPassword con timeout de seguridad
      console.log('Intentando iniciar sesión con signInWithPassword...');
      
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Añadir un timeout por si se queda colgado
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout al iniciar sesión')), 5000);
      });
      
      // Competir entre el login normal y el timeout
      const result: any = await Promise.race([loginPromise, timeoutPromise])
        .catch(error => {
          console.warn('Error o timeout al iniciar sesión:', error);
          return { error };
        });
      
      const signInError = result.error;
      const sessionData = result.data;
      
      if (signInError) {
        console.warn('No se pudo iniciar sesión automáticamente tras el registro:', signInError);
        
        // Verificar si a pesar del error tenemos sesión
        const { data: currentSession } = await supabase.auth.getSession();
        if (currentSession?.session) {
          console.log('A pesar del error, se encontró una sesión activa');
        } else {
          console.warn('No hay sesión activa después del intento de login');
          
          // Último intento: reiniciar el cliente y volver a probar
          if (typeof window !== 'undefined') {
            console.log('Intentando reiniciar cliente y sesión...');
            reinitializeSupabaseClient();
            
            // Esperar un poco y verificar sesión nuevamente
            await new Promise(resolve => setTimeout(resolve, 800));
            const { data: finalCheck } = await supabase.auth.getSession();
            
            if (finalCheck?.session) {
              console.log('Sesión recuperada después de reiniciar cliente');
            } else {
              console.warn('No se pudo recuperar la sesión después de reiniciar');
            }
          }
        }
      } else if (sessionData) {
        console.log('Sesión iniciada automáticamente tras el registro');
      }
    } catch (loginError) {
      console.error('Excepción al iniciar sesión automáticamente:', loginError);
      // No lanzamos error aquí, seguimos con el flujo
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
