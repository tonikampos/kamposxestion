const fs = require('fs');
const path = require('path');

// Asegurarse de que la configuración de Netlify y redirecciones estén en la carpeta de salida
const copyConfigFiles = () => {
  console.log('Copying Netlify configuration files to output directory...');
  
  // Asegúrate de que el directorio de salida existe
  const outDir = path.join(__dirname, '..', 'out');
  if (!fs.existsSync(outDir)) {
    console.log('Output directory does not exist. Creating...');
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Copia _redirects
  try {
    fs.copyFileSync(
      path.join(__dirname, '..', 'public', '_redirects'),
      path.join(outDir, '_redirects')
    );
    console.log('Successfully copied _redirects to output directory');
  } catch (error) {
    console.error('Error copying _redirects file:', error);
  }

  // Copia config.html
  try {
    fs.copyFileSync(
      path.join(__dirname, '..', 'public', 'config.html'),
      path.join(outDir, 'config.html')
    );
    console.log('Successfully copied config.html to output directory');
  } catch (error) {
    console.error('Error copying config.html file:', error);
  }
  
  // Crear un archivo netlify.toml en la carpeta de salida
  try {
    const netlifyConfig = fs.readFileSync(
      path.join(__dirname, '..', 'netlify.toml'),
      'utf8'
    );
    fs.writeFileSync(path.join(outDir, 'netlify.toml'), netlifyConfig);
    console.log('Successfully copied netlify.toml to output directory');
  } catch (error) {
    console.error('Error copying netlify.toml file:', error);
  }
  
  // Crear un archivo env-config.js que será cargado por la aplicación
  try {
    const envConfigJs = `
// Este archivo se genera durante el build y es reemplazado en tiempo de despliegue por Netlify
window.ENV = {
  NEXT_PUBLIC_SUPABASE_URL: '{{ NEXT_PUBLIC_SUPABASE_URL }}',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '{{ NEXT_PUBLIC_SUPABASE_ANON_KEY }}',
  NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: '{{ NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY }}'
};

// Debug: Log de variables cargadas
console.log('Variables de entorno cargadas en env-config.js');

// Función para verificar si una variable tiene un valor válido (no es un placeholder)
function isValidValue(value) {
  return value && typeof value === 'string' && !value.includes('{{') && !value.includes('}}');
}

// Intenta cargar las variables de entorno desde diferentes fuentes en orden de prioridad
(function() {
  try {
    // 1. Variables inyectadas por Netlify en tiempo de despliegue
    if (isValidValue(window.ENV.NEXT_PUBLIC_SUPABASE_URL) && isValidValue(window.ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      Object.keys(window.ENV).forEach(key => {
        if (isValidValue(window.ENV[key])) {
          localStorage.setItem(key, window.ENV[key]);
          console.log('Variable cargada desde Netlify:', key);
        }
      });
    } else {
      console.log('Variables de Netlify no disponibles o inválidas');
      
      // 2. Variables hardcoded para debug (solo en caso de que no haya variables de entorno configuradas)
      const storedUrl = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
      const storedKey = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      if (!storedUrl || !storedKey) {
        console.warn('ATENCIÓN: Usando variables de entorno por defecto - Isto debería verse só en desenvolvemento');
      }
    }
  } catch (error) {
    console.error('Error ao cargar variables de entorno:', error);
  }
})();
`;
    fs.writeFileSync(path.join(outDir, 'env-config.js'), envConfigJs);
    console.log('Successfully created env-config.js in output directory');
  } catch (error) {
    console.error('Error creating env-config.js file:', error);
  }
  
  // Añadir el archivo 404.html que apunta a la página personalizada
  try {
    const notFoundHTML = `<!DOCTYPE html>
<html lang="gl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Páxina non atopada</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #f9fafb;
      color: #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.25rem;
      margin-bottom: 1.5rem;
      color: #4b5563;
    }
    a {
      background-color: #2563eb;
      color: white;
      text-decoration: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.25rem;
      font-weight: 500;
      display: inline-block;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>Páxina non atopada</p>
    <a href="/">Volver ao inicio</a>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(path.join(outDir, '404.html'), notFoundHTML);
    console.log('Successfully created 404.html in output directory');
  } catch (error) {
    console.error('Error creating 404.html file:', error);
  }
  
  // Modificar los archivos HTML para incluir el archivo de configuración
  try {
    const htmlFiles = fs.readdirSync(outDir).filter(file => file.endsWith('.html'));
    htmlFiles.forEach(file => {
      const htmlPath = path.join(outDir, file);
      let htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // Añadir el script de configuración de variables de entorno
      if (!htmlContent.includes('env-config.js')) {
        htmlContent = htmlContent.replace('</head>', '<script src="/env-config.js"></script></head>');
        fs.writeFileSync(htmlPath, htmlContent);
      }
    });
    console.log('Successfully added env-config.js to all HTML files');
  } catch (error) {
    console.error('Error modifying HTML files:', error);
  }
};

copyConfigFiles();
