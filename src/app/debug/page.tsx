'use client';

import { useState, useEffect } from 'react';
import { supabase, reinitializeSupabaseClient } from '@/lib/supabase/config';
import { signOut } from '@/lib/auth/auth-service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function DebugPage() {
  const [connectionState, setConnectionState] = useState<'checking' | 'connected' | 'error'>('checking');
  const [sessionState, setSessionState] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');
  const [sqlConfigState, setSqlConfigState] = useState<'checking' | 'configured' | 'not-configured' | 'error'>('checking');
  const [envVariables, setEnvVariables] = useState<{[key: string]: string | null}>({});
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();

  // Comprobar la conexión con Supabase
  useEffect(() => {
    checkConnection();
    checkSession();
    checkSqlConfig();
    getEnvVariables();
  }, []);

  // Verificar la configuración SQL para desactivar emails
  const checkSqlConfig = async () => {
    try {
      setSqlConfigState('checking');
      setDebugInfo(prev => prev + '\n\n[INFO] Verificando configuración SQL para emails...');
      
      const response = await fetch('/api/auth/check-sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.configurationApplied) {
          setSqlConfigState('configured');
          setDebugInfo(prev => prev + '\n[OK] La configuración SQL para desactivar emails está correctamente aplicada');
        } else {
          setSqlConfigState('not-configured');
          setDebugInfo(prev => prev + '\n[ALERTA] La configuración SQL para desactivar emails NO está aplicada correctamente');
          setDebugInfo(prev => prev + '\n[INFO] Debes ejecutar el script SQL en el dashboard de Supabase');
        }
      } else {
        setSqlConfigState('error');
        setDebugInfo(prev => prev + `\n[ERROR] No se pudo verificar la configuración SQL: ${result.message || 'Error desconocido'}`);
        
        if (result.isProduction) {
          setDebugInfo(prev => prev + '\n[INFO] Esta verificación no está disponible en producción por seguridad');
        }
      }
    } catch (error) {
      console.error('Error al verificar configuración SQL:', error);
      setSqlConfigState('error');
      setDebugInfo(prev => prev + `\n[ERROR] Excepción al verificar configuración SQL: ${(error as Error).message}`);
    }
  };

  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error al verificar la conexión:', error);
        setConnectionState('error');
        setDebugInfo(prev => prev + `\n[ERROR] Conexión a Supabase fallida: ${error.message}`);
      } else {
        setConnectionState('connected');
        setDebugInfo(prev => prev + '\n[OK] Conexión a Supabase verificada correctamente');
      }
    } catch (error) {
      console.error('Error al verificar la conexión:', error);
      setConnectionState('error');
      setDebugInfo(prev => prev + `\n[ERROR] Excepción al verificar conexión: ${(error as Error).message}`);
    }
  };

  const checkSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error al verificar la sesión:', error);
        setSessionState('anonymous');
        setDebugInfo(prev => prev + `\n[ERROR] Error al verificar sesión: ${error.message}`);
      } else if (data.session) {
        setSessionState('authenticated');
        setDebugInfo(prev => prev + `\n[OK] Sesión activa encontrada: ${data.session.user.email}`);
      } else {
        setSessionState('anonymous');
        setDebugInfo(prev => prev + '\n[INFO] No hay sesión activa');
      }
    } catch (error) {
      console.error('Error al verificar la sesión:', error);
      setSessionState('anonymous');
      setDebugInfo(prev => prev + `\n[ERROR] Excepción al verificar sesión: ${(error as Error).message}`);
    }
  };

  const getEnvVariables = () => {
    const vars = {
      'NEXT_PUBLIC_SUPABASE_URL': typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL') : null,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': typeof window !== 'undefined' ? localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY') : null,
    };
    
    setEnvVariables(vars);
    
    // Añadir información de debug
    let debugText = '\n[INFO] Variables de entorno:';
    Object.entries(vars).forEach(([key, value]) => {
      if (value) {
        if (key.includes('KEY')) {
          debugText += `\n- ${key}: ${value.substring(0, 5)}...${value.substring(value.length - 5)}`;
        } else {
          debugText += `\n- ${key}: ${value}`;
        }
      } else {
        debugText += `\n- ${key}: No disponible`;
      }
    });
    
    setDebugInfo(prev => prev + debugText);
  };

  const handleReset = async () => {
    setIsResetting(true);
    setDebugInfo(prev => prev + '\n\n[INFO] Iniciando reinicio de conexión...');
    
    try {
      toast.loading('Reiniciando conexión...', { id: 'reset' });
      
      // Reiniciar el cliente
      reinitializeSupabaseClient();
      
      // Añadir información de debug
      setDebugInfo(prev => prev + '\n[OK] Cliente de Supabase reiniciado');
      
      // Verificar conexión de nuevo
      await checkConnection();
      await checkSession();
      await checkSqlConfig();
      
      toast.success('Conexión reiniciada correctamente', { id: 'reset' });
    } catch (error) {
      console.error('Error al reiniciar:', error);
      setDebugInfo(prev => prev + `\n[ERROR] Error al reiniciar: ${(error as Error).message}`);
      toast.error('Error al reiniciar la conexión', { id: 'reset' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = async () => {
    try {
      toast.loading('Cerrando sesión...', { id: 'logout' });
      await signOut();
      toast.success('Sesión cerrada correctamente', { id: 'logout' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión', { id: 'logout' });
    }
  };

  const handleClearLocalStorage = () => {
    try {
      // Guardar variables de entorno
      const supabaseUrl = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
      const supabaseKey = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      // Limpiar localStorage
      localStorage.clear();
      
      // Restaurar variables de entorno
      if (supabaseUrl) localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', supabaseUrl);
      if (supabaseKey) localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', supabaseKey);
      
      toast.success('localStorage limpiado correctamente');
      setDebugInfo(prev => prev + '\n[OK] localStorage limpiado (excepto variables de entorno)');
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
      toast.error('Error al limpiar localStorage');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Diagnóstico de Conexión a Supabase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Estado actual</h2>
          
          <div className="mb-4">
            <p className="text-gray-700">
              <span className="font-medium">Conexión a Supabase:</span>{' '}
              {connectionState === 'checking' ? (
                <span className="text-yellow-500">Verificando...</span>
              ) : connectionState === 'connected' ? (
                <span className="text-green-500">Conectado</span>
              ) : (
                <span className="text-red-500">Error de conexión</span>
              )}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700">
              <span className="font-medium">Sesión:</span>{' '}
              {sessionState === 'checking' ? (
                <span className="text-yellow-500">Verificando...</span>
              ) : sessionState === 'authenticated' ? (
                <span className="text-green-500">Autenticado</span>
              ) : (
                <span className="text-gray-500">Sin sesión activa</span>
              )}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700">
              <span className="font-medium">Configuración SQL:</span>{' '}
              {sqlConfigState === 'checking' ? (
                <span className="text-yellow-500">Verificando...</span>
              ) : sqlConfigState === 'configured' ? (
                <span className="text-green-500">Configurado</span>
              ) : sqlConfigState === 'not-configured' ? (
                <span className="text-red-500">No configurado</span>
              ) : (
                <span className="text-red-500">Error al verificar</span>
              )}
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Variables de entorno:</h3>
            <div className="bg-gray-100 p-3 rounded">
              {Object.entries(envVariables).map(([key, value]) => (
                <p key={key} className="text-sm font-mono">
                  <span className="font-medium">{key}:</span>{' '}
                  {value ? (
                    key.includes('KEY') ? (
                      `${value.substring(0, 5)}...${value.substring(value.length - 5)}`
                    ) : (
                      value
                    )
                  ) : (
                    <span className="text-red-500">No disponible</span>
                  )}
                </p>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-70"
            >
              {isResetting ? 'Reiniciando...' : 'Reiniciar conexión a Supabase'}
            </button>
            
            <button
              onClick={checkSqlConfig}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Verificar configuración SQL para emails
            </button>
            
            <button
              onClick={handleClearLocalStorage}
              className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
            >
              Limpiar localStorage (mantiene variables de entorno)
            </button>
            
            {sessionState === 'authenticated' && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
              >
                Cerrar sesión
              </button>
            )}
            
            <button
              onClick={() => router.push('/auth/login')}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded"
            >
              Ir a Login
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Registro de diagnóstico</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto h-96 text-sm font-mono">
            {debugInfo || 'Recopilando información...'}
          </pre>
        </div>
      </div>
    </div>
  );
}
