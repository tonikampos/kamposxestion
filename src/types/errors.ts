// Tipos para errores
export interface AppError extends Error {
  message: string;
  code?: string;
  details?: string;
}

// Tipo para respuesta de autenticación
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      role?: string;
    };
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
