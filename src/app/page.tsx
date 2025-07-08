'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redireccionar ao dashboard se o usuario está autenticado
      if (user) {
        router.push('/dashboard');
      } else {
        // Redireccionar ao login se o usuario non está autenticado
        router.push('/auth/login');
      }
    }
  }, [user, isLoading, router]);

  // Amosar un indicador de carga mentres se verifica a autenticación
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
