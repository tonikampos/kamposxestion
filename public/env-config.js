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
    console.error('No se encontraron variables de entorno válidas');
    console.error('Por favor, configura las variables en Netlify');
    
    const emptyValues = {
      NEXT_PUBLIC_SUPABASE_URL: '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ''
    };
    
    Object.keys(emptyValues).forEach(key => {
      if (!isValidEnvValue(localStorage.getItem(key))) {
        console.error(`Variable ${key} no encontrada. Por favor configúrala en Netlify.`);
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
