import StaticRegisterForm from '@/components/auth/StaticRegisterForm';

// Usamos unha versión estática para a exportación de Netlify
// A versión real dinámica funcionará no cliente despois da carga
export default function RegisterPage() {
  return <StaticRegisterForm />;
}
