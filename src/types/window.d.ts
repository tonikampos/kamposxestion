// Extiende o tipo Window para incluir as variables de entorno dinámicas
interface Window {
  ENV?: Record<string, string>;
}
