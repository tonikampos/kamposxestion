// Script simplificado para verificar la estructura de la tabla profiles
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variables de entorno de Supabase non definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTable() {
  try {
    console.log('Verificando a táboa profiles...');
    
    // Intentar listar registros
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Erro ao consultar profiles:', error);
    } else {
      console.log('Rexistros atopados:', data.length);
      if (data.length > 0) {
        console.log('Exemplo de rexistro:', data[0]);
      }
    }

    // Intentar recrear a táboa
    console.log('\nSuxestión para recrear a táboa profiles:');
    console.log(`
    -- Primeiro eliminar a táboa se existe
    DROP TABLE IF EXISTS profiles;
    
    -- Crear a táboa coa estrutura correcta
    CREATE TABLE profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'profesor',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Configurar RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Políticas de seguridade
    CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
    
    CREATE POLICY "Users can view own profile" ON profiles 
      FOR SELECT USING (auth.uid() = id);
      
    CREATE POLICY "Users can update own profile" ON profiles 
      FOR UPDATE USING (auth.uid() = id);
    `);
    
    // Intentar unha inserción simple
    console.log('\nIntentando insertar un rexistro de proba...');
    
    // Crear un usuario primeiro
    const testEmail = `test${Date.now()}@gmail.com`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Test1234!',
      user_metadata: { full_name: 'Test User', role: 'profesor' }
    });
    
    if (authError) {
      console.error('Erro ao crear usuario:', authError);
      return;
    }
    
    console.log('Usuario creado con ID:', authData.user.id);
    
    // Intentar crear o perfil
    const { data: insertData, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: 'Test User',
        role: 'profesor'
      });
    
    if (insertError) {
      console.error('Erro ao insertar perfil:', insertError);
    } else {
      console.log('Perfil insertado correctamente');
    }
    
  } catch (error) {
    console.error('Erro xeral:', error);
  }
}

testTable();
