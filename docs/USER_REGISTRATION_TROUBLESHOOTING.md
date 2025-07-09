# Solución de problemas de registro de usuarios en Supabase

Este documento proporciona una guía para diagnosticar y resolver problemas específicos relacionados con el registro de usuarios y la inserción de perfiles en la base de datos de Supabase.

## 1. Verificar la configuración SQL para desactivar emails

El problema más común es que no se haya aplicado correctamente la configuración SQL para desactivar la verificación de emails. Cuando esto sucede, los usuarios se crean en `auth.users` pero pueden no insertarse correctamente en la tabla `profiles`.

### Pasos para verificar:

1. Accede al **SQL Editor** de Supabase en el dashboard
2. Ejecuta la siguiente consulta:

```sql
SELECT require_email_confirmation FROM auth.config;
```

3. Deberías obtener `false` como resultado. Si es `true`, ejecuta el script `disable_emails.sql` completo:

```sql
-- Configuración para desactivar el envío de emails en Supabase
-- Ejecutar esto en el SQL Editor de Supabase

-- 1. Desactivar la confirmación por email
UPDATE auth.config
SET require_email_confirmation = false;

-- 2. Modificar la tabla auth.users para confirmar automáticamente emails
UPDATE auth.users 
SET email_confirmed_at = CURRENT_TIMESTAMP 
WHERE email_confirmed_at IS NULL;

-- 3. Crear un trigger para confirmar emails automáticamente en nuevas cuentas
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users 
    SET email_confirmed_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Asegurar que el trigger no esté duplicado
DROP TRIGGER IF EXISTS confirm_email_trigger ON auth.users;

-- 5. Crear el trigger para nuevos usuarios
CREATE TRIGGER confirm_email_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_email();
```

## 2. Verificar la estructura de la tabla profiles

Asegúrate de que la tabla `profiles` tenga la estructura correcta:

```sql
-- Verificar la estructura de la tabla profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles';
```

Los campos mínimos necesarios son:
- `id` (UUID) - clave primaria
- `email` (text)
- `full_name` (text)
- `role` (text)

Si falta alguno de estos campos, créalo:

```sql
-- Añadir campos que falten
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS role TEXT;
```

## 3. Verificar políticas de seguridad de RLS

Asegúrate de que las políticas RLS (Row Level Security) permitan la inserción de nuevos perfiles:

```sql
-- Verificar políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Crear política para inserción si no existe
CREATE POLICY IF NOT EXISTS "Allow insert for authenticated users" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

## 4. Prueba manual de inserción

Puedes probar la inserción manual en la tabla `profiles`:

```sql
-- Crear un usuario de prueba en auth.users (primero)
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000123', 'prueba@ejemplo.com', '{"full_name":"Usuario Prueba","role":"profesor"}', now())
RETURNING id;

-- Confirmar el email manualmente
UPDATE auth.users 
SET email_confirmed_at = CURRENT_TIMESTAMP 
WHERE id = '00000000-0000-0000-0000-000000000123';

-- Insertar el perfil
INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000123', 'prueba@ejemplo.com', 'Usuario Prueba', 'profesor', now())
RETURNING id, email, full_name, role;
```

## 5. Verificación adicional de permisos

Asegúrate de que el rol anónimo tenga permisos para insertar en la tabla `profiles`:

```sql
-- Verificar permisos del rol anónimo
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles' AND grantee = 'anon';

-- Otorgar permisos si es necesario
GRANT INSERT ON TABLE public.profiles TO anon;
```

## 6. Solución para entornos de producción

Si continúas teniendo problemas en producción, implementa esta función RPC que puede ejecutarse desde el cliente:

```sql
-- Crear función segura para registrar usuarios completos
CREATE OR REPLACE FUNCTION public.register_user_with_profile(
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT DEFAULT 'profesor'
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Verificar si el usuario ya existe
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  -- Si no existe, registrar error (esto normalmente no debería pasar)
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users';
  END IF;
  
  -- Insertar o actualizar el perfil
  INSERT INTO public.profiles (id, email, full_name, role, updated_at)
  VALUES (user_id, user_email, user_full_name, user_role, now())
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      updated_at = EXCLUDED.updated_at
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Luego puedes llamar a esta función desde tu código:

```typescript
const { error: signUpError, data: authData } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName, role: 'profesor' }
  }
});

if (authData?.user && !signUpError) {
  // Llamar a la función RPC para asegurar la creación del perfil
  const { data, error } = await supabase.rpc('register_user_with_profile', {
    user_email: email,
    user_full_name: fullName,
    user_role: 'profesor'
  });
  
  if (error) console.error('Error al registrar perfil:', error);
  else console.log('Perfil registrado correctamente:', data);
}
```

## 7. Uso de la página de diagnóstico

Utiliza la página `/debug` para:
1. Verificar la conexión a Supabase
2. Comprobar el estado de la sesión
3. Verificar la configuración SQL para emails
4. Reiniciar la conexión a Supabase si es necesario

Si todos estos pasos no resuelven el problema, es posible que haya un problema temporal con la API de Supabase. Espera unos minutos e inténtalo de nuevo.
