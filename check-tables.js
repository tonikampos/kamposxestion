// Script para verificar a existencia de táboas en Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variables de entorno de Supabase non definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  try {
    console.log('Comprobando a conexión a Supabase...');
    console.log('URL:', supabaseUrl);
    
    // Verificar se podemos acceder á táboa profiles
    console.log('Intentando acceder á táboa profiles...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('Erro ao acceder á táboa profiles:', profilesError);
      if (profilesError.code === '42P01') {
        console.log('A táboa "profiles" non existe. Necesitas creala.');
        console.log('Por favor, executa o SQL que se atopa en SUPABASE_SETUP.md');
      }
    } else {
      console.log('A táboa profiles existe e é accesible');
      console.log('Estrutura de datos:', profilesData);
    }
    
    // Intentar crear un usuario para probas
    const testEmail = `test${Date.now()}@gmail.com`;
    console.log('\nIntentando crear un usuario de proba:', testEmail);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'Test1234!',
      options: {
        data: {
          full_name: 'Usuario Proba',
          role: 'profesor'
        }
      }
    });
    
    if (authError) {
      console.error('Erro ao crear usuario de proba:', authError);
    } else {
      console.log('Usuario creado con éxito:', authData);
      
      if (authData.user) {
        console.log('\nIntentando insertar na táboa profiles...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert([{ 
            id: authData.user.id, 
            email: testEmail, 
            full_name: 'Usuario Proba',
            role: 'profesor'
          }]);
        
        if (profileError) {
          console.error('Erro ao insertar en profiles:', profileError);
        } else {
          console.log('Inserción en profiles exitosa:', profileData);
        }
      }
    }
    
  } catch (error) {
    console.error('Erro xeral:', error);
  }
}

checkTable();
