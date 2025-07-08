'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { signOut } from '@/lib/auth/auth-service';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function Dashboard() {
  const { user, userData, isLoading } = useAuth();
  const router = useRouter();
  
  // Redireccionar a login se o usuario non está autenticado
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);
  
  const handleSignOut = async () => {
    try {
      console.log('Iniciando proceso de peche de sesión');
      await signOut();
      console.log('Sesión pechada con éxito en Supabase');
      toast.success('Sesión pechada con éxito');
      
      // Pequena pausa para asegurar que se completa o peche de sesión
      setTimeout(() => {
        console.log('Redirixindo á páxina de login');
        router.push('/auth/login');
      }, 500);
    } catch (error) {
      console.error('Erro ao pechar sesión:', error);
      toast.error('Erro ao pechar sesión');
    }
  };
  
  // Amosar estado de carga mentres se verifica a autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Se non hai usuario autenticado, non amosamos nada (xa que o useEffect redireccionará)
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Button 
            onClick={() => {
              console.log('Botón Pechar sesión clickado');
              handleSignOut();
            }} 
            variant="secondary"
          >
            Pechar sesión
          </Button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">¡Benvido/a, {userData?.full_name || 'Profesor/a'}!</h2>
            <p className="text-gray-600">
              Este é o panel de administración para xestionar o teu alumnado.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Pronto terás acceso a todas as funcionalidades para xestionar alumnos, exames, notas e avaliacións.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
