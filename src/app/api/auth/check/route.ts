import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

/**
 * API para verificar el estado de autenticación
 * Útil para diagnosticar problemas de sesión
 */
export async function GET(request: NextRequest) {
  // Usar el cliente de Supabase con clave de servicio
  const supabase = getServiceSupabase();

  try {
    // Verificar si hay sesión
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json({
        authenticated: false,
        message: 'Error al verificar sesión',
        error: error.message,
      }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: 'No hay sesión activa',
      }, { status: 200 });
    }

    // Verificar datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return NextResponse.json({
        authenticated: true,
        session: {
          userId: session.user.id,
          email: session.user.email,
        },
        profileFound: false,
        message: 'Autenticado pero no se encontró el perfil',
        error: userError.message,
      }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
      },
      profile: userData,
      profileFound: true,
      message: 'Usuario autenticado correctamente',
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      message: 'Error al verificar autenticación',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}

// También permitimos POST para casos donde GET no funcione correctamente
export async function POST(request: NextRequest) {
  return GET(request);
}
