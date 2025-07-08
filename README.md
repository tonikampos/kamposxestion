# KamposXestion

Sistema de xestión de alumnado desenvolvido con Next.js e Supabase.

## Comenzando

### Desenvolvemento local

Para executar o servidor de desenvolvemento:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abre [http://localhost:3000](http://localhost:3000) no teu navegador para ver o resultado.

### Configuración de Supabase

Para configurar Supabase como base de datos e sistema de autenticación, segue as instruccións en [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Despregamento en Netlify

Este proxecto está configurado para ser despregado facilmente en Netlify:

1. Crea unha conta en [Netlify](https://www.netlify.com/) se aínda non a tes
2. Fai clic en "New site from Git" e conecta o teu repositorio GitHub
3. Selecciona o repositorio `kamposxestion`
4. Configura o seguinte:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Configura as variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`: A URL da túa instancia Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: A clave anónima da túa instancia Supabase
   - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`: A clave de servizo da túa instancia Supabase
6. Fai clic en "Deploy site"

## Tecnoloxías

- [Next.js](https://nextjs.org/) - Framework de React
- [Supabase](https://supabase.com/) - Base de datos e autenticación
- [React Hook Form](https://react-hook-form.com/) - Xestión de formularios
- [Zod](https://zod.dev/) - Validación de datos
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
