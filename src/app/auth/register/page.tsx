'use client';

import { useState, useEffect } from 'react';
import StaticRegisterForm from '@/components/auth/StaticRegisterForm';
import RegisterForm from '@/components/auth/RegisterForm';

// Usamos unha versión estática para a exportación de Netlify
// A versión real dinámica cargarase no cliente
export default function RegisterPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Ao executarse useEffect, sabemos que estamos no cliente
    setIsClient(true);
  }, []);
  
  // Renderizar o formulario dinámico se estamos no cliente, senón o estático
  return isClient ? <RegisterForm /> : <StaticRegisterForm />;
}
