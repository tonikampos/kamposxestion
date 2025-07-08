// Script para verificar la estructura de la tabla profiles
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Variables de entorno de Supabase no definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfilesStructure() {
  try {
    console.log('Verificando la estructura de la tabla profiles...');
    
    // 1. Intentar obtener información sobre las columnas
    // Nota: Esta es una consulta especial que funciona con la clave de servicio
    const { data, error } = await supabase.rpc('get_profiles_info');
    
    if (error) {
      console.error('Error al obtener información de la tabla:', error);
      
      // Intento alternativo: crear un registro y ver qué pasa
      console.log('\nIntentando un enfoque alternativo...');
      
      const testId = '00000000-0000-0000-0000-000000000000'; // UUID inválido a propósito
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: testId,
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'profesor'
        }]);
      
      if (insertError) {
        console.log('Error de inserción (esperado):', insertError);
        console.log('Basado en el error, podemos deducir parte de la estructura');
      }
    } else {
      console.log('Información de la tabla:', data);
    }
    
    // 2. Mostrar el SQL recomendado para crear la tabla correctamente
    console.log('\nRecomendación: Asegúrate de que tu tabla profiles tenga esta estructura:');
    console.log(`
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'profesor',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Permitir inserción pública (importante para el registro)
CREATE POLICY "Anyone can insert profiles" 
  ON profiles 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Permitir que los usuarios vean su propio perfil
CREATE POLICY "Users can view their own profile" 
  ON profiles 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Permitir que los usuarios actualicen su propio perfil
CREATE POLICY "Users can update their own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);
`);

    // 3. Verificar si hay datos en la tabla
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('\nError al consultar la tabla profiles:', profilesError);
    } else {
      console.log('\nRegistros existentes en la tabla profiles:', profilesData.length);
      if (profilesData.length > 0) {
        console.log('Ejemplo de registro:', profilesData[0]);
      }
    }
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

checkProfilesStructure();
