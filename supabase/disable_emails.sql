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

-- 6. Verificar que la configuración se haya aplicado correctamente
SELECT require_email_confirmation FROM auth.config;
