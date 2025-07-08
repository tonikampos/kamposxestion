import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth/auth-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KamposXestion - Sistema de xestión de alumnado",
  description: "Aplicación para a xestión integral de alumnado, exames e avaliacións",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="gl">
      <head>
        {/* Script externo para cargar variables de entorno */}
        <script src="/env-config.js"></script>
        
        {/* Script para cargar variables de entorno desde diferentes fuentes */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Este script carga las variables de entorno desde window.ENV (definido en env-config.js)
          // y las hace disponibles para la aplicación
          (function() {
            try {
              if (typeof window !== 'undefined' && window.ENV) {
                Object.keys(window.ENV).forEach(key => {
                  if (window.ENV[key] && !window.ENV[key].includes('{{')) {
                    localStorage.setItem(key, window.ENV[key]);
                    console.log('Configurada variable de entorno:', key);
                  }
                });
              }
            } catch(e) {
              console.error('Error cargando variables de entorno:', e);
            }
          })();
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>

        {/* Script para verificar que las variables se han cargado correctamente */}
        <script dangerouslySetInnerHTML={{ __html: `
          setTimeout(function() {
            try {
              const url = localStorage.getItem('NEXT_PUBLIC_SUPABASE_URL');
              const key = localStorage.getItem('NEXT_PUBLIC_SUPABASE_ANON_KEY');
              console.log('Variables de entorno disponibles:',
                'URL=' + (url ? url.substring(0, 15) + '...' : 'non definida'),
                'KEY=' + (key ? 'definida (' + key.length + ' caracteres)' : 'non definida')
              );
            } catch(e) {
              console.error('Error verificando variables de entorno:', e);
            }
          }, 1000);
        ` }} />
      </body>
    </html>
  );
}
