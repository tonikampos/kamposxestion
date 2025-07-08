import StaticLoginForm from '@/components/auth/StaticLoginForm';

// Usamos unha versión estática para a exportación de Netlify
// A versión real dinámica funcionará no cliente despois da carga
export default function LoginPage() {
  return <StaticLoginForm />;
}
