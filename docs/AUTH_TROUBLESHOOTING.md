# Solución para Problemas de Autenticación en Supabase

## Problema: Bloqueo en "Iniciando Sesión"

Si experimentas que la aplicación se queda bloqueada en el estado "Iniciando Sesión" o tienes problemas para autenticarte, puedes seguir estas instrucciones para diagnosticar y solucionar el problema.

## Posibles causas

1. **Estado corrupto en localStorage**: Supabase almacena tokens y datos de sesión en el localStorage que pueden quedar en un estado inconsistente.
2. **Conexión fallida con Supabase**: El servidor de Supabase puede estar teniendo problemas temporales.
3. **Conflicto de sesiones**: Múltiples sesiones en conflicto pueden causar bloqueos.
4. **Variables de entorno incorrectas**: Las variables de conexión a Supabase podrían estar mal configuradas.

## Soluciones rápidas

### 1. Reiniciar la conexión desde la página de login

La página de inicio de sesión ahora incluye un botón **"Reiniciar conexión a Supabase"** que:
- Limpia el estado de autenticación en localStorage
- Reinicia el cliente de Supabase
- Mantiene las variables de entorno

### 2. Usar la página de diagnóstico

Hemos añadido una nueva página de diagnóstico en `/debug` que permite:

- Ver el estado de la conexión a Supabase
- Comprobar si hay una sesión activa
- Verificar las variables de entorno
- Reiniciar la conexión
- Limpiar el localStorage
- Cerrar la sesión actual

Accede a esta página haciendo clic en **"Ver diagnóstico de conexión"** en la página de login.

### 3. Limpiar manualmente el localStorage

Si los métodos anteriores no funcionan, puedes limpiar manualmente el localStorage:

1. Abre las herramientas de desarrollo del navegador (F12 o Clic derecho > Inspeccionar)
2. Ve a la pestaña "Application" (Chrome) o "Storage" (Firefox)
3. Selecciona "Local Storage" en el panel izquierdo
4. Encuentra y elimina todas las entradas que comienzan con "supabase" o "auth"
5. Recarga la página

## Ajustes implementados

Para evitar estos problemas, hemos implementado las siguientes mejoras:

1. **Timeouts en operaciones de autenticación**: Se ha añadido un límite de tiempo a las operaciones de inicio/cierre de sesión para evitar bloqueos indefinidos.

2. **Limpieza mejorada al cerrar sesión**: Al cerrar sesión, ahora se eliminan todas las cookies y datos de localStorage relacionados con la autenticación.

3. **Cliente de Supabase reiniciable**: Se puede reiniciar el cliente cuando se detectan problemas de conexión.

4. **Mejor manejo de errores**: Se proporcionan mensajes de error más descriptivos y se registran más detalles para diagnóstico.

## Si el problema persiste

Si después de intentar estas soluciones el problema persiste, puede ser necesario:

1. Comprobar si Supabase está funcionando correctamente visitando [status.supabase.com](https://status.supabase.com)
2. Verificar que las variables de entorno en Netlify están correctamente configuradas
3. Contactar con el soporte de Supabase si se trata de un problema de su plataforma
