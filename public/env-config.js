// Archivo para cargar variables de entorno desde Netlify en tiempo de ejecución
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: '{{ NEXT_PUBLIC_SUPABASE_URL }}',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '{{ NEXT_PUBLIC_SUPABASE_ANON_KEY }}',
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: '{{ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY }}'
};

// Función para verificar si un valor de variable es válido (no contiene placeholders)
function isValidEnvValue(value) {
  return value && typeof value === 'string' && !value.includes('{{') && !value.includes('}}');
}

// Debug: Log de variables cargadas
console.log('Inicializando variables de entorno en env-config.js');

// Intentamos cargar variables de entorno en localStorage para uso en la app
try {
  // 1. Intentar usar las variables de window.ENV (inyectadas por Netlify)
  let hasValidVars = false;
  if (window.ENV) {
    Object.keys(window.ENV).forEach(key => {
      if (isValidEnvValue(window.ENV[key])) {
        localStorage.setItem(key, window.ENV[key]);
        hasValidVars = true;
        console.log(`Variable configurada desde Netlify: ${key}`);
      }
    });
  }

  // 2. Si no hay variables válidas en window.ENV, verificamos si hay valores hardcoded
  if (!hasValidVars) {
    const hardcodedValues = {
      NEXT_PUBLIC_SUPABASE_URL: 'https://qyufkainizdkcnkxzupv.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5dWZrYWluaXpka2Nua3h6dXB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTc3NTcsImV4cCI6MjA2NzM3Mzc1N30.nx3LBmPz2D5UnZXgCtT9zRc6cVXY9rMN2MsP1ETNw8Q'
    };
    
    Object.keys(hardcodedValues).forEach(key => {
      if (!isValidEnvValue(localStorage.getItem(key))) {
        localStorage.setItem(key, hardcodedValues[key]);
        console.warn(`ATENCIÓN: Usando valor predeterminado para ${key}`);
      }
    });
  }
  
  // Verificación final
  const supabaseUrl = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.log('Variables configuradas:',
    'URL=' + (supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'non definida'),
    'KEY=' + (supabaseKey ? 'definida (' + supabaseKey.length + ' caracteres)' : 'non definida')
  );
} catch (error) {
  console.error('Error ao configurar variables de entorno:', error);
}
