'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { signIn } from '@/lib/auth/auth-service';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/config';

// Validación de formulario con zod
const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'O contrasinal debe ter polo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function EnhancedLoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Verificar que Supabase está configurado correctamente
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        // Comprobar si tenemos las variables en localStorage
        const url = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
        const key = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        
        console.log('Variables de entorno disponibles:',
          'URL=' + (url ? url.substring(0, 15) + '...' : 'non definida'),
          'KEY=' + (key ? 'definida (' + key.length + ' caracteres)' : 'non definida')
        );
        
        // Si tenemos las variables básicas, consideramos que Supabase está listo
        if (url && key && url.startsWith('https://') && key.length > 20) {
          setSupabaseReady(true);
          setError(null);
          console.log('Variables de Supabase detectadas correctamente');
          return;
        }
        
        // Intentamos obtener las variables de window.ENV si están disponibles
        if (window.ENV && window.ENV.NEXT_PUBLIC_SUPABASE_URL && window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', window.ENV.NEXT_PUBLIC_SUPABASE_URL);
          localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
          setSupabaseReady(true);
          setError(null);
          console.log('Variables de Supabase cargadas desde window.ENV');
          return;
        }
        
        // Como último recurso, intentamos una operación simple
        try {
          await supabase.from('profiles').select('count', { count: 'exact', head: true });
          setSupabaseReady(true);
          console.log('Conexión a Supabase verificada correctamente');
          setError(null);
        } catch (connErr) {
          console.error('Error al conectar con Supabase:', connErr);
          setError('Erro de conexión coa base de datos. Por favor, verifica a configuración.');
          setSupabaseReady(false);
        }
      } catch (err) {
        console.error('Error general al verificar Supabase:', err);
        setError('Non se puido verificar a conexión coa base de datos.');
      }
    };

    checkSupabase();
    
    // Establecer un timeout para evitar que el usuario se quede bloqueado
    const timer = setTimeout(() => {
      if (!supabaseReady) {
        setSupabaseReady(true); // Permitir intentar el login aunque no estemos 100% seguros
        console.log('Timeout alcanzado, permitiendo intento de login');
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    // Incluso si supabaseReady es false, intentaremos iniciar sesión
    // pero mostramos una advertencia
    if (!supabaseReady) {
      console.warn('Intentando iniciar sesión aunque la conexión a Supabase no está confirmada');
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Verificamos las variables de entorno necesarias
      const url = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
      const key = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      if (!url || !key) {
        // Intentar cargar desde window.ENV como último recurso
        if (window.ENV && window.ENV.NEXT_PUBLIC_SUPABASE_URL && window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          localStorage.setItem('NEXT_PUBLIC_SUPABASE_URL', window.ENV.NEXT_PUBLIC_SUPABASE_URL);
          localStorage.setItem('NEXT_PUBLIC_SUPABASE_ANON_KEY', window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
          console.log('Variables cargadas desde window.ENV antes de iniciar sesión');
        } else {
          throw new Error('Faltan variables de configuración necesarias para iniciar sesión');
        }
      }
      
      toast.loading('Iniciando sesión...', { id: 'login' });
      console.log('Iniciando sesión para:', data.email);
      
      // Usar directamente supabase en lugar de la función signIn para más control
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      
      if (authError) {
        throw authError;
      }
      
      if (!authData.user) {
        throw new Error('Non se puido iniciar sesión: usuario non atopado');
      }
      
      toast.success('Sesión iniciada correctamente', { id: 'login' });
      
      // Esperar un momento antes de redirigir
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      console.error('Erro ao iniciar sesión:', error);
      
      // Mostrar un mensaje de error más amigable
      let errorMessage = 'Erro ao iniciar sesión. Comproba o teu correo e contrasinal.';
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Credenciais incorrectos. Comproba o teu correo e contrasinal.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Erro de conexión. Comproba a túa conexión a Internet.';
        } else if (error.message.includes('variables')) {
          errorMessage = 'Erro de configuración. Contacta ao administrador.';
        }
      }
      
      toast.error(errorMessage, { id: 'login' });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Iniciar sesión</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        {!supabaseReady && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
            <p>Estableciendo conexión co servidor... (Podes intentar iniciar sesión igualmente)</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="usuario@exemplo.com"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          
          <div>
            <Input
              label="Contrasinal"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          
          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Non tes unha conta?{' '}
            <Link 
              href="/auth/register" 
              className="text-blue-600 hover:text-blue-800"
            >
              Rexistrarse
            </Link>
          </p>
        </div>
      </div>
    </Card>
  );
}
