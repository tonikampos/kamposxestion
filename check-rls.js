// Script para verificar as políticas RLS en Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variables de entorno de Supabase non definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  try {
    console.log('Comprobando políticas RLS en Supabase...');
    
    // 1. Comprobar se a táboa profiles ten RLS habilitada
    console.log('\n1. Intentando facer unha consulta simple á táboa profiles:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (profilesError) {
      console.error('Erro ao consultar profiles:', profilesError);
    } else {
      console.log('Consulta exitosa:', profilesData.length, 'rexistros atopados');
    }
    
    // 2. Obter información sobre táboas e políticas (require permisos elevados)
    console.log('\n2. Intentando crear un usuario e un perfil nunha soa transacción:');
    const testEmail = `test${Date.now()}@gmail.com`;
    const testPassword = 'Test1234!';
    const testName = 'Usuario Proba';
    
    try {
      // Primeiro creamos o usuario en auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: { full_name: testName, role: 'profesor' }
      });
      
      if (authError) {
        console.error('Erro ao crear usuario de proba:', authError);
        return;
      }
      
      console.log('Usuario creado correctamente con ID:', authData.user.id);
      
      // Logo insertamos o perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: testEmail,
          full_name: testName,
          role: 'profesor'
        }]);
      
      if (profileError) {
        console.error('Erro ao crear perfil:', profileError);
      } else {
        console.log('Perfil creado correctamente');
      }
      
    } catch (error) {
      console.error('Erro xeral no proceso:', error);
    }
    
    // 3. Verificar a configuración SQL da táboa
    console.log('\n3. Consello: Verifica que executaras o SQL correcto para crear a táboa profiles e as súas políticas:');
    console.log(`
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      email TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'profesor',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Políticas RLS
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    -- Permitir insercións públicas durante o rexistro
    CREATE POLICY "Service role can create profiles"
      ON profiles
      FOR INSERT
      WITH CHECK (true);
    `);
    
  } catch (error) {
    console.error('Erro xeral:', error);
  }
}

checkRLS();
