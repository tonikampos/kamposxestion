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
        // Intenta hacer una operación simple para ver si Supabase está configurado
        await supabase.from('profiles').select('count', { count: 'exact', head: true });
        setSupabaseReady(true);
        console.log('Conexión a Supabase establecida correctamente');
        setError(null);
      } catch (err) {
        console.error('Error al conectar con Supabase:', err);
        setError('Error de conexión con la base de datos. Por favor, inténtalo más tarde.');
        
        // Mostrar información sobre las variables de entorno para depuración
        const url = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
        const key = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        console.log('Variables de entorno disponibles:',
          'URL=' + (url ? url.substring(0, 15) + '...' : 'non definida'),
          'KEY=' + (key ? 'definida (' + key.length + ' caracteres)' : 'non definida')
        );
      }
    };

    checkSupabase();
  }, []);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    if (!supabaseReady) {
      toast.error('Non se puido conectar coa base de datos');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Iniciando sesión...');
      await signIn(data.email, data.password);
      toast.success('Sesión iniciada correctamente');
      
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
        }
      }
      
      toast.error(errorMessage);
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
            <p>Estableciendo conexión co servidor...</p>
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
              disabled={isSubmitting || !supabaseReady}
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
