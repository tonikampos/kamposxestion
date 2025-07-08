'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/config';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [supabaseStatus, setSupabaseStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Verificar conexión con Supabase y redireccionar si hay una sesión activa
  useEffect(() => {
    const checkSupabaseAndSession = async () => {
      try {
        // Intentar hacer una operación simple para verificar la conexión
        await supabase.from('profiles').select('count', { count: 'exact', head: true });
        setSupabaseStatus('connected');
        
        // Verificar si hay una sesión activa
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          console.log('Sesión activa detectada, redirigiendo a dashboard');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error al conectar con Supabase:', error);
        setSupabaseStatus('error');
        setErrorMessage('Error de conexión con la base de datos. Verifica las variables de entorno.');
        
        // Log para debugging
        const url = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
        const key = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        console.log('Variables de entorno:', 
          'URL=' + (url ? url.substring(0, 15) + '...' : 'non definida'),
          'KEY=' + (key ? 'definida (' + key.length + ' caracteres)' : 'non definida')
        );
      }
    };
    
    checkSupabaseAndSession();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <h1 className="text-4xl font-bold mb-8">KamposXestion</h1>
      
      {supabaseStatus === 'checking' && (
        <div className="mb-6 text-gray-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Verificando conexión...</p>
        </div>
      )}
      
      {supabaseStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md max-w-md">
          <h3 className="font-semibold mb-2">Error de conexión</h3>
          <p>{errorMessage}</p>
          <p className="mt-2 text-sm">Comproba que as variables de entorno están configuradas correctamente en Netlify.</p>
        </div>
      )}
      
      <div className="space-y-4">
        <Link 
          href="/auth/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md block text-center"
        >
          Iniciar sesión
        </Link>
        
        <Link 
          href="/auth/register" 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-md block text-center"
        >
          Rexistrarse
        </Link>
      </div>
    </div>
  );
}
