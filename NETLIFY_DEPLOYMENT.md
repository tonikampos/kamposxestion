# Guía de despregamento en Netlify

Esta guía explica como despregar KamposXestion en Netlify e asegurar a correcta conexión coa base de datos de Supabase.

## ⚠️ SOLUCIÓN PARA PROBLEMAS DE VARIABLES DE ENTORNO ⚠️

Para resolver o problema das variables de entorno en Netlify, sigue estes pasos:

1. **Engade as variables de entorno en Netlify:**
   - Accede ao panel de Netlify
   - Vai a **Site settings** > **Build & deploy** > **Environment**
   - Engade as seguintes variables:
     - `NEXT_PUBLIC_SUPABASE_URL`: A URL do teu proxecto Supabase
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A clave anónima do teu proxecto Supabase
     - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`: A clave de servizo (opcional)

2. **Activa a sustitución de variables:**
   - En **Build & deploy** > **Post processing** > **Asset optimization**
   - Asegúrate de que a opción **Enable variable substitution in HTML files** está activada

## Pasos para despregar en Netlify

### 1. Acceder a Netlify
- Visita [Netlify](https://app.netlify.com) e inicia sesión ou crea unha conta.
- Na páxina principal, fai clic en **Add new site** e selecciona **Import an existing project**.

### 2. Conectar con GitHub
- Selecciona **GitHub** como proveedor Git.
- Autoriza a Netlify para acceder aos teus repositorios, se é necesario.
- Busca e selecciona o repositorio **kamposxestion**.

### 3. Configurar opcións de despregamento
- **Owner**: Selecciona a túa conta.
- **Branch to deploy**: master
- **Base directory**: (déixao en branco)
- **Build command**: npm run build
- **Publish directory**: .next

### 4. Configurar variables de entorno
É crucial configurar as variables de entorno para que a túa aplicación se poida conectar a Supabase:

1. Expande a sección **Advanced build settings**.
2. Engade as seguintes variables de entorno (os valores debes obelos do panel de control de Supabase):
   - `NEXT_PUBLIC_SUPABASE_URL`: URL do teu proxecto Supabase 
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima do teu proxecto Supabase
   - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`: (Opcional) Clave de servizo do teu proxecto Supabase

### 5. Despregar o sitio
- Fai clic en **Deploy site**.

## Configuración de Supabase para permitir o dominio de Netlify

Unha vez que Netlify despregue o teu sitio, recibirás unha URL temporal (algo como `random-name.netlify.app`). É necesario engadir esta URL á configuración de Supabase:

1. Inicia sesión no [Dashboard de Supabase](https://app.supabase.io).
2. Selecciona o teu proxecto **kamposxestion**.
3. Vai a **Authentication** > **URL Configuration** no menú da esquerda.
4. Engade a URL de Netlify á lista de **Redirect URLs** co formato: `https://tu-sitio-netlify.netlify.app/**`.
5. Garda os cambios.

## Verificar a conexión

Para verificar que todo funciona correctamente:

1. Visita o teu sitio despregado en Netlify.
2. Intenta rexistrarte cun novo usuario ou iniciar sesión cun usuario existente.
3. Se podes iniciar sesión e ver o dashboard, significa que a conexión con Supabase está funcionando correctamente.

## Solución de problemas

Se experimentas problemas de conexión:

1. **Verifica as variables de entorno**: Asegúrate de que as variables de entorno están configuradas correctamente en Netlify. Podes editalas en **Site settings** > **Build & deploy** > **Environment**.

2. **Comproba os logs de construción**: Se o despregamento falla, revisa os logs de construción para identificar o problema.

3. **Problemas de autenticación**: Se non podes iniciar sesión, verifica que a URL de Netlify está correctamente engadida nas configuracións de Supabase.

4. **Actualiza o despregamento**: Se fixeches cambios recentes, podes forzar un novo despregamento desde o panel de Netlify.

## Personalizar o dominio (opcional)

Se queres usar un dominio personalizado:

1. Vai a **Domain settings** no teu panel de Netlify.
2. Fai clic en **Add custom domain**.
3. Segue as instrucións para configurar o teu dominio personalizado.
4. Lembra engadir tamén este dominio personalizado á configuración de URLs en Supabase.
