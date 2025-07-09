import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

// Configuración para exportación estática
export const dynamic = "force-static";

/**
 * API para verificar si se han aplicado las configuraciones SQL necesarias
 * para la desactivación de emails en Supabase
 */
export async function GET(request: NextRequest) {
  // Durante la exportación estática, devolver una respuesta genérica
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({
      message: 'Esta API solo está disponible en tiempo de ejecución'
    });
  }
  
  try {
    // Este endpoint solo debería ser accesible en ambiente de desarrollo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({
        success: false,
        message: "Este endpoint no está disponible en producción por seguridad",
        isProduction: true
      }, { status: 403 });
    }

    // Solo se puede ejecutar en el servidor
    if (typeof window !== 'undefined') {
      return NextResponse.json({
        success: false,
        message: "Este endpoint solo puede ejecutarse en el servidor"
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Verificar configuración de auth.config
    const { data: configData, error: configError } = await supabase.rpc(
      'check_email_confirmation_settings'
    );
    
    if (configError) {
      // La función RPC puede no existir, verificar manualmente
      console.error('Error al verificar configuración:', configError);
      
      // Intentar consultar directamente
      const { data: manualCheck, error: manualError } = await supabase
        .from('auth.config')
        .select('require_email_confirmation')
        .single();
        
      if (manualError) {
        return NextResponse.json({
          success: false,
          message: "No se pudo verificar la configuración de emails",
          error: manualError.message,
          recommendation: "Ejecuta el script SQL disable_emails.sql en el panel de Supabase"
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        requiresEmailConfirmation: manualCheck?.require_email_confirmation || false,
        configurationApplied: manualCheck?.require_email_confirmation === false,
        message: manualCheck?.require_email_confirmation === false 
          ? "La configuración para deshabilitar emails está aplicada correctamente" 
          : "ATENCIÓN: La verificación de email sigue activada, ejecuta el script SQL"
      });
    }
    
    // Verificar el trigger para confirmar emails automáticamente
    const { data: triggerData, error: triggerError } = await supabase
      .from('pg_trigger')
      .select('tgname')
      .eq('tgname', 'confirm_email_trigger')
      .maybeSingle();
    
    const triggerExists = !triggerError && triggerData !== null;
    
    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: configData?.requires_email_confirmation || false,
      triggerExists,
      configurationApplied: 
        (configData?.requires_email_confirmation === false) && 
        triggerExists,
      message: 
        (configData?.requires_email_confirmation === false) && triggerExists
          ? "La configuración para deshabilitar emails está aplicada correctamente"
          : "ATENCIÓN: La configuración SQL no está completa, ejecuta el script disable_emails.sql"
    });
    
  } catch (error) {
    console.error('Error al verificar configuración SQL:', error);
    return NextResponse.json({
      success: false,
      message: "Error al verificar la configuración",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// También permitimos POST para casos donde GET no funcione correctamente
export async function POST(request: NextRequest) {
  return GET(request);
}
