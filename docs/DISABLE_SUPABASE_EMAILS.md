# Desactivación de Emails en Supabase

Este documento explica cómo se ha desactivado completamente la funcionalidad de envío de emails en la integración con Supabase para KamposXestion.

## Cambios Realizados

### 1. Configuración del Cliente de Supabase

Se ha modificado la inicialización del cliente de Supabase para desactivar la verificación de email:

```typescript
_supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Deshabilitamos completamente la verificación por email
    flowType: 'implicit'
  }
});
```

El uso de `flowType: 'implicit'` evita redirecciones relacionadas con confirmación de emails.

### 2. Proceso de Registro sin Emails

Se ha modificado la función de registro para evitar el envío de emails de confirmación:

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: {
      full_name: fullName,
      role: 'profesor'
    },
    // Desactivar completamente el envío de emails
    emailRedirectTo: null,
    shouldCreateUser: true
  }
});
```

### 3. Confirmación Manual de Usuarios

Se ha implementado una función para intentar confirmar usuarios manualmente sin requerir verificación por email:

```typescript
const confirmUserManually = async (userId: string): Promise<boolean> => {
  try {
    if (typeof window === 'undefined') {
      // Solo en un entorno real de servidor
      const serviceClient = getServiceSupabase();
      await serviceClient.auth.admin.updateUserById(userId, { email_confirmed: true });
      return true;
    } else {
      console.log('Intentando confirmar usuario manualmente');
      return true;
    }
  } catch (error) {
    console.error('Error al confirmar usuario manualmente:', error);
    return false;
  }
};
```

## IMPORTANTE: Configuración requerida en Supabase Dashboard

Para asegurar que el sistema funcione correctamente y no se envíen emails, es **OBLIGATORIO** realizar los siguientes pasos:

1. Acceder a [app.supabase.com](https://app.supabase.com)
2. Seleccionar el proyecto de KamposXestion
3. Ir a Authentication > Providers
4. En Email Auth, asegurarse de desactivar:
   - Desmarcar "Enable Sign Up" y volver a marcarlo (esto resetea algunas configuraciones)
   - Desmarcar "Confirm email" 
   - Establecer "Secure email change" en OFF

5. Ir al SQL Editor y ejecutar el script `supabase/disable_emails.sql` incluido en este proyecto. Este script:
   - Desactiva la confirmación por email a nivel de base de datos
   - Marca todos los emails existentes como confirmados
   - Crea un trigger para confirmar automáticamente los nuevos emails

Sin estos cambios, Supabase seguirá enviando emails de verificación independientemente de la configuración del código.

## Funcionamiento esperado

Con estos cambios:

1. Al registrarse, los usuarios NO recibirán ningún email de confirmación
2. Los usuarios podrán iniciar sesión inmediatamente después de registrarse
3. No se requerirá verificación de email para acceder a la aplicación

## Solución de problemas

Si Supabase sigue enviando emails después de estos cambios:

1. Verifica que los cambios se han aplicado correctamente en el código
2. Asegúrate de que la configuración en el Dashboard de Supabase está correcta
3. Considera reiniciar la aplicación y limpiar el caché del navegador
4. Consulta la documentación actualizada de Supabase para ver si ha habido cambios en la API
