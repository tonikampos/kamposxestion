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
};

copyConfigFiles();
