# Configuración de Supabase para KamposXestion

Este documento guiarate a través dos pasos necesarios para configurar Supabase como base de datos e autenticación para a aplicación KamposXestion.

## Paso 1: Crear unha conta e un proxecto en Supabase

1. Vai a [Supabase](https://supabase.com/) e crea unha conta se aínda non tes unha.
2. Fai clic en "New Project" para crear un novo proxecto.
3. Escolle un nome para a túa organización e proxecto (ex: "kamposxestion").
4. Establece un contrasinal seguro para a base de datos.
5. Selecciona a rexión máis cercana aos teus usuarios.
6. Espera a que se cree o teu proxecto (pode tardar uns minutos).

## Paso 2: Configurar as variables de entorno

1. No panel de control de Supabase, vai a "Settings" > "API".
2. Copia o "URL", "anon key" e "service_role key".
3. Actualiza o teu arquivo `.env.local` con estes valores:

```
NEXT_PUBLIC_SUPABASE_URL=o-teu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=a-túa-clave-anon
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=a-túa-clave-service-role
```

## Paso 3: Crear a táboa de perfís

1. Vai á sección "SQL Editor" no panel de control de Supabase.
2. Crea unha nova consulta e pega o seguinte SQL:

```sql
-- Crear táboa de perfís para almacenar información adicional dos usuarios
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'profesor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar o timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar o timestamp automaticamente
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at();

-- Políticas de seguridade para a táboa profiles
-- Permitir aos usuarios ver e actualizar só os seus propios datos
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Política para permitir aos usuarios ler o seu propio perfil
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política para permitir aos usuarios actualizar o seu propio perfil
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para permitir crear perfís durante o rexistro
CREATE POLICY "Service role can create profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (true);
```

3. Executa a consulta para crear a táboa e as políticas de seguridade.

## Paso 4: Configurar a autenticación

1. Vai a "Authentication" > "Providers".
2. Asegúrate de que "Email" estea habilitado.
3. Podes configurar provedores adicionais como Google, GitHub, etc. se o desexas.

## Paso 5: Configurar as redireccións URL para a autenticación

1. Vai a "Authentication" > "URL Configuration".
2. Configura as URL de redirección:
   - Para desenvolvemento local: `http://localhost:3000/**`
   - Para produción (cando despregues en Netlify): `https://o-teu-dominio-netlify.netlify.app/**`

## Paso 6: Despregar en Netlify

1. Asegúrate de que o teu repositorio estea en GitHub, GitLab ou BitBucket.
2. Vai a [Netlify](https://www.netlify.com/) e crea unha conta se aínda non tes unha.
3. Fai clic en "New site from Git" e conecta o teu repositorio.
4. Configura as variables de entorno en Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`
5. Configura a función de construción: `npm run build`
6. Configura o directorio de publicación: `.next`

Con estes pasos, configuraches Supabase como o teu sistema de base de datos e autenticación para KamposXestion, listo para despregar en Netlify.
