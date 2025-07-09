'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'react-hot-toast';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { signIn } from '@/lib/auth/auth-service';
import { reinitializeSupabaseClient } from '@/lib/supabase/config';
import Link from 'next/link';

// Validación de formulario con zod
const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'O contrasinal debe ter polo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    
    // Establecemos un timeout para evitar que el botón quede bloqueado indefinidamente
    const loginTimeout = setTimeout(() => {
      if (isSubmitting) {
        toast.error('A conexión está tardando moito tempo. Por favor, inténteo de novo.');
        setIsSubmitting(false);
      }
    }, 15000); // 15 segundos de timeout
    
    try {
      // Verificamos si tenemos las variables de entorno necesarias
      const envVars = {
        url: localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL'),
        key: localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      };
      
      if (!envVars.url || !envVars.key) {
        console.error('Faltan variables de entorno esenciales:', { 
          url_missing: !envVars.url,
          key_missing: !envVars.key
        });
        toast.error('Error de configuración: Faltan variables de Supabase en Netlify');
        return;
      }
      
      console.log('Intentando iniciar sesión:', { email: data.email });
      toast.loading('Iniciando sesión...', { id: 'login' });
      
      await signIn(data.email, data.password);
      
      toast.success('Inicio de sesión realizado con éxito!', { id: 'login' });
      router.push('/dashboard');
    } catch (error: Error | unknown) {
      console.error('Erro ao iniciar sesión:', error);
      
      // Mensajes de error más específicos
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Correo ou contrasinal incorrectos', { id: 'login' });
        } else if (error.message.includes('Invalid API key')) {
          toast.error('Error de configuración: API key inválida. Por favor contacta ao administrador', { id: 'login' });
        } else {
          toast.error(`Erro ao iniciar sesión: ${error.message}`, { id: 'login' });
        }
      } else {
        toast.error('Erro descoñecido ao iniciar sesión', { id: 'login' });
      }
    } finally {
      clearTimeout(loginTimeout);
      setIsSubmitting(false);
    }
  };

  // Función para reiniciar la conexión a Supabase
  const handleResetConnection = async () => {
    setIsResetting(true);
    toast.loading('Reiniciando conexión a Supabase...', { id: 'reset' });
    
    try {
      // Limpiar localStorage excepto variables de entorno
      const keysToKeep = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      
      // Reiniciar el cliente de Supabase
      reinitializeSupabaseClient();
      
      toast.success('Conexión reiniciada con éxito', { id: 'reset' });
    } catch (error) {
      console.error('Error al reiniciar conexión:', error);
      toast.error('Error al reiniciar la conexión', { id: 'reset' });
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Iniciar Sesión</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="teu@correo.com"
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          label="Contrasinal"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
        >
          Iniciar Sesión
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Non tes unha conta?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Rexístrate
          </Link>
        </p>
        
        {/* Botón para reiniciar la conexión */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">¿Problemas ao iniciar sesión?</p>
          <button
            type="button"
            onClick={handleResetConnection}
            disabled={isResetting}
            className="text-sm text-blue-600 hover:underline"
          >
            {isResetting ? 'Reiniciando conexión...' : 'Reiniciar conexión a Supabase'}
          </button>
          <div className="mt-2">
            <Link href="/debug" className="text-sm text-gray-500 hover:underline">
              Ver diagnóstico de conexión
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
