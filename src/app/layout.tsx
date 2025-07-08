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
        {/* Agregar script para cargar las variables de entorno desde window.ENV si está disponible */}
        <script dangerouslySetInnerHTML={{ __html: `
          // Este script carga las variables de entorno desde window.ENV (definido en env-config.js)
          // y las hace disponibles para la aplicación
          (function() {
            try {
              if (typeof window !== 'undefined' && window.ENV) {
                Object.keys(window.ENV).forEach(key => {
                  if (window.ENV[key] && !window.ENV[key].includes('{{')) {
                    localStorage.setItem(key, window.ENV[key]);
                    console.log('Configured env var:', key);
                  }
                });
              }
            } catch(e) {
              console.error('Error loading environment variables:', e);
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
      </body>
    </html>
  );
}
