// Nota: Este arquivo está configurado como estático para a exportación a Netlify
// A funcionalidade completa só estará dispoñible no cliente, non durante a exportación estática

import Link from 'next/link';
import Button from '@/components/ui/Button';

// Versión estática de Dashboard para a exportación
export default function Dashboard() {
  // Durante a exportación estática, renderizamos unha versión simplificada
  // A versión real con autenticación funcionará no cliente tras a carga
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/auth/login">
            <Button variant="secondary">
              Ir a login
            </Button>
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">Panel de control</h2>
            <p className="text-gray-600">
              Este é o panel de administración para xestionar o teu alumnado.
            </p>
            <p className="mt-4 text-gray-500">
              <strong>Nota:</strong> Esta é unha versión estática da páxina para a exportación.
              A funcionalidade completa con autenticación estará dispoñible ao cargar a aplicación no navegador.
            </p>
          </div>
        </div>
      </main>
      
      {/* Script que se executará no cliente para redirixir se non hai sesión */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Comproba se existe un token de autenticación no localStorage
          const hasSession = localStorage.getItem('supabase.auth.token');
          if (!hasSession) {
            window.location.href = '/auth/login';
          }
        });
      `}} />
    </div>
  );
}
