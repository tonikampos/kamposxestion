import EnhancedLoginForm from '@/components/auth/EnhancedLoginForm';

// Usamos a versión mejorada que maneja mejor el entorno de producción
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          KamposXestion
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sistema de xestión de alumnado
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <EnhancedLoginForm />
      </div>
    </div>
  );
}
