// Versión estática para a exportación, sen código cliente que cause problemas na compilación

import Link from 'next/link';

export default function Home() {
  // Esta páxina é estática para a exportación
  // No cliente, o script redireccionará ao usuario á páxina adecuada
  
  return (
    <div className="min-h-screen flex items-center justify-center flex-col">
      <h1 className="text-4xl font-bold mb-8">KamposXestion</h1>
      
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
      
      {/* Script que se executará no cliente para redirixir se hai sesión */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Intentar redireccionar según o estado de autenticación
          const hasSession = localStorage.getItem('supabase.auth.token');
          if (hasSession) {
            window.location.href = '/dashboard';
          }
        });
      `}} />
    </div>
  );
}
