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
    
    try {
      console.log('Iniciando rexistro desde formulario:', {
        email: data.email,
        full_name: data.full_name
      });
      
      const result = await registerUser(data.email, data.password, data.full_name);
      console.log('Resultado de rexistro:', result);
      
      toast.success('Rexistro completado con éxito!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Erro no rexistro:', error);
      
      // Mostrar detalles más específicos del error
      if (error.message) {
        toast.error(`Erro: ${error.message}`);
      } else if (error.code) {
        toast.error(`Erro (${error.code}): ${error.details || 'Revisa a consola para máis detalles'}`);
      } else {
        toast.error('Erro descoñecido ao rexistrarse');
      }
      
      // Intentar mostrar más información de depuración
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
