# Configuración de Rutas API para Exportación Estática

Este documento explica cómo se ha configurado el proyecto para manejar rutas API en un entorno de exportación estática como Netlify.

## Problema con Rutas API en Exportación Estática

Next.js en modo de exportación estática (`output: 'export'`) no admite rutas API dinámicas que se ejecutan en el servidor. Al intentar exportar un proyecto con rutas API, recibirás errores como:

```
Error: export const dynamic = "force-static"/export const revalidate not configured on route "/api/auth/check-sql"
```

## Solución Implementada

Hemos implementado las siguientes soluciones para que el proyecto se pueda compilar correctamente en Netlify:

### 1. Marcado las rutas API como estáticas

Todas las rutas API incluyen:

```typescript
export const dynamic = "force-static";
```

### 2. Detección de Entorno de Compilación

En cada ruta API, verificamos si estamos en la fase de compilación:

```typescript
if (process.env.NEXT_PHASE === 'phase-production-build') {
  return NextResponse.json({
    message: 'Esta API solo está disponible en tiempo de ejecución'
  });
}
```

### 3. Cliente Supabase Simulado durante Exportación

Durante la exportación estática, usamos un cliente Supabase simulado:

```typescript
if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
  return {
    auth: {
      signUp: () => Promise.resolve({ data: {}, error: null }),
      // ...otros métodos simulados
    },
    // ...otros objetos simulados
  } as any;
}
```

### 4. Manejo de Errores en Componentes de Cliente

Los componentes del lado del cliente están configurados para manejar errores al llamar a estas APIs:

```typescript
try {
  const response = await fetch('/api/auth/check');
  // Manejo normal
} catch (error) {
  // Manejo de error cuando la API no está disponible
}
```

## Comportamiento Esperado

- **Durante la compilación**: Las rutas API devuelven respuestas simuladas estáticas
- **En tiempo de ejecución**: Las rutas API funcionan normalmente en el navegador del cliente

## Rutas API Afectadas

- `/api/auth/check` - Verificación del estado de autenticación
- `/api/auth/check-sql` - Verificación de configuración SQL

## Notas Importantes para Desarrollo

1. Estas APIs no funcionarán durante la fase de exportación estática
2. Usa manejo de errores apropiado al llamar estas APIs desde componentes cliente
3. Para pruebas locales, usa `npm run dev` en lugar de `npm run build && npm run start`

## Referencias

- [Documentación de Next.js sobre exportación estática](https://nextjs.org/docs/advanced-features/static-html-export)
- [Netlify y Next.js](https://docs.netlify.com/integrations/frameworks/next-js/)
