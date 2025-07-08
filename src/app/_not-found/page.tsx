// Este archivo ayuda a Next.js a entender que no debe intentar exportar la ruta /_not-found
export const dynamic = 'force-static';
export const dynamicParams = false;

export default function NotFoundPage() {
  return null;
}
