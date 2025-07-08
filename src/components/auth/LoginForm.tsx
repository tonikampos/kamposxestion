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
import Link from 'next/link';

// Validación de formulario con zod
const loginSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido'),
  password: z.string().min(6, 'O contrasinal debe ter polo menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    try {
      await signIn(data.email, data.password);
      toast.success('Inicio de sesión realizado con éxito!');
      router.push('/dashboard');
    } catch (error: Error | unknown) {
      console.error('Erro ao iniciar sesión:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
      </div>
    </Card>
  );
}
