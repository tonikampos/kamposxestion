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
import { registerUser } from '@/lib/auth/auth-service';
import Link from 'next/link';

// Validación de formulario con zod
const registerSchema = z.object({
  full_name: z.string().min(3, 'O nome debe ter polo menos 3 caracteres'),
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'O contrasinal debe ter polo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'O contrasinal debe ter polo menos 6 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Os contrasinais non coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    let toastId = 'register';
    
    try {
      // Verificamos primero si tenemos las variables de entorno necesarias
      const envVars = {
        url: localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL'),
        key: localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY')
      };
      
      if (!envVars.url || !envVars.key) {
        console.error('Faltan variables de entorno esenciales:', { 
          url_missing: !envVars.url,
          key_missing: !envVars.key
        });
        toast.error('Error de configuración: Faltan variables de Supabase en Netlify', { id: toastId });
        return;
      }
      
      console.log('Iniciando rexistro desde formulario:', {
        email: data.email,
        full_name: data.full_name,
        env_ok: true
      });
      
      toast.loading('Procesando rexistro...', { id: toastId });
      
      // Mostrar pasos para mejor feedback al usuario
      const updateToast = (message: string) => {
        toast.loading(message, { id: toastId });
      };
      
      // Proceso de registro con feedback
      updateToast('Creando conta...');
      
      // Añadir listeners para debug
      const originalConsoleLog = console.log;
      const logs: string[] = [];
      
      console.log = function(...args) {
        logs.push(args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' '));
        originalConsoleLog.apply(console, args);
      };
      
      try {
        const result = await registerUser(data.email, data.password, data.full_name);
        console.log('Resultado de rexistro:', result);
        
        updateToast('Verificando sesión...');
        
        // Verificar si tenemos sesión activa
        try {
          const { data: sessionCheck } = await fetch('/api/auth/check', { 
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }).then(res => res.json()).catch(() => ({ data: null }));
          
          if (sessionCheck?.authenticated) {
            console.log('Sesión verificada correctamente');
          } else {
            console.warn('No se pudo verificar la sesión después del registro');
          }
        } catch (sessionCheckError) {
          console.warn('Error al verificar la sesión, continuando de todos modos:', sessionCheckError);
        }
        
        toast.success('Rexistro completado con éxito!', { id: toastId });
        
        // Redirigir después de un breve retraso para asegurar que todo esté listo
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
        
      } catch (registerError) {
        throw registerError;
      } finally {
        console.log = originalConsoleLog;
      }
      
    } catch (error: Error | unknown) {
      console.error('Erro no rexistro:', error);
      
      // Mensajes de error más claros para el usuario
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          toast.error('Non se pode rexistrar: A clave API de Supabase non é válida. Por favor contacta ao administrador.', { id: toastId });
        } else if (error.message.includes('User already registered')) {
          toast.error('Este correo electrónico xa está rexistrado. Por favor inicia sesión.', { id: toastId });
          // Redirigir a login después de un breve retraso
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          toast.error(`Erro: ${error.message}`, { id: toastId });
        }
      } else if (typeof error === 'object' && error !== null && 'code' in error) {
        const customError = error as { code: string, details?: string, message?: string };
        
        if (customError.code === '23505') { // Error de duplicado en PostgreSQL
          toast.error('Este correo electrónico xa está rexistrado. Por favor inicia sesión.', { id: toastId });
          // Redirigir a login después de un breve retraso
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } else {
          toast.error(`Erro (${customError.code}): ${customError.message || customError.details || 'Erro no servidor'}`, { id: toastId });
        }
      } else {
        toast.error('Erro descoñecido ao rexistrarse. Por favor, inténtao de novo máis tarde.', { id: toastId });
      }
      
      // Mostrar información de depuración en la consola
      console.error('Detalles completos do erro:', JSON.stringify(error, null, 2));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-6">Crear Conta</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Nome completo"
          placeholder="O teu nome"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        
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
        
        <Input
          label="Confirmar contrasinal"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        
        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
        >
          Rexistrarme
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Xa tes unha conta?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </Card>
  );
}
