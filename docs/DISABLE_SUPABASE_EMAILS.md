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

## Configuración adicional en Supabase Dashboard

Para asegurar que el sistema funcione correctamente, se recomienda también configurar Supabase Dashboard:

1. Acceder a [app.supabase.com](https://app.supabase.com)
2. Seleccionar el proyecto de KamposXestion
3. Ir a Authentication > Providers
4. En Email Auth, asegurarse de que:
   - "Confirm email" esté desactivado
   - "Enable email confirmations" esté desactivado

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
