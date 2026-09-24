/**
 * INDOMABLE CrossFit - Servicio de Notificaciones por Correo Electrónico
 * 
 * Gestiona el envío de correos transaccionales para:
 * 1. Bienvenida y confirmación de autoregistro de atletas (con Cédula y recordatorio de PIN).
 * 2. Activación / Renovación de membresía aprobada por el Coach.
 * 
 * Funcionalidad:
 * - Soporte nativo para EmailJS (REST API sin dependencias pesadas).
 * - Historial de correos enviados guardado localmente en el dispositivo para auditoría.
 * - Simulación transparente con eventos de interfaz si no hay credenciales configuradas.
 */

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  documentId: string;
  pin: string;
}

export interface ActivationEmailData {
  name: string;
  email: string;
  planName: string;
  startDate: string;
  endDate: string;
  classesCount?: number;
}

export interface SentEmailRecord {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  type: 'welcome' | 'activation' | 'test';
  sentAt: string;
  status: 'sent' | 'simulated' | 'error';
  errorMessage?: string;
  bodySnippet: string;
}

export interface EmailServiceConfig {
  isEnabled: boolean;
  provider: 'apps_script' | 'emailjs' | 'simulation';
  appsScriptWebhookUrl?: string;
  emailjsServiceId: string;
  emailjsTemplateWelcome: string;
  emailjsTemplateActivation: string;
  emailjsPublicKey: string;
  emailjsPrivateKey?: string;
}

import {
  subscribeEmailConfigLive,
  syncSaveEmailConfig,
  syncSaveSentEmail,
  syncPurgeSentEmails,
} from './firestoreService';

const STORAGE_EMAIL_CONFIG_KEY = 'indomable_email_config_v1';
const STORAGE_SENT_EMAILS_KEY = 'indomable_sent_emails_v1';

// Default configuration — Google Apps Script como único proveedor de correos
const DEFAULT_EMAIL_CONFIG: EmailServiceConfig = {
  isEnabled: true,
  provider: 'apps_script',
  appsScriptWebhookUrl: 'https://script.google.com/macros/s/AKfycbzsBATTjDU5EMlckuncNPMR-aZ0jsDVgBQ5z3iGJ3Qq6laAQl98q0wXm_stY0mZ_v9m/exec',
  emailjsServiceId: '',
  emailjsTemplateWelcome: '',
  emailjsTemplateActivation: '',
  emailjsPublicKey: '',
  emailjsPrivateKey: '',
};

let inMemoryConfig: EmailServiceConfig = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_EMAIL_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_EMAIL_CONFIG;
})();

// Suscripción automática a la configuración centralizada en Firestore
if (typeof window !== 'undefined') {
  try {
    subscribeEmailConfigLive((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        inMemoryConfig = {
          ...inMemoryConfig,
          ...cloudConfig,
        };
        try {
          localStorage.setItem(STORAGE_EMAIL_CONFIG_KEY, JSON.stringify(inMemoryConfig));
        } catch {}
      }
    });
  } catch (err) {
    console.warn('[EmailService] No se pudo inicializar listener de Firestore:', err);
  }
}

export const getEmailConfig = (): EmailServiceConfig => {
  return inMemoryConfig;
};

export const saveEmailConfig = (config: EmailServiceConfig): void => {
  inMemoryConfig = config;
  try {
    localStorage.setItem(STORAGE_EMAIL_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error al guardar configuración de email en local:', err);
  }
  // Sincronizar en la nube para TODOS los dispositivos (atletas y entrenadores)
  syncSaveEmailConfig(config).catch((err) => {
    console.warn('Error al sincronizar configuración de email con Firestore:', err);
  });
};

export const getSentEmailsHistory = (): SentEmailRecord[] => {
  try {
    const saved = localStorage.getItem(STORAGE_SENT_EMAILS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const saveSentEmailRecord = (record: SentEmailRecord): void => {
  try {
    const history = getSentEmailsHistory();
    const updated = [record, ...history].slice(0, 50); // Guardar los últimos 50
    localStorage.setItem(STORAGE_SENT_EMAILS_KEY, JSON.stringify(updated));

    // Emitir evento para toasts y observadores en UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('indomable:email-sent', { detail: record })
      );
    }
  } catch (err) {
    console.error('Error al guardar registro de correo:', err);
  }

  // Sincronizar registro en Firestore para auditoría global
  syncSaveSentEmail(record).catch(() => {});
};

export const clearSentEmailsHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_SENT_EMAILS_KEY);
    syncPurgeSentEmails(null).catch(() => {});
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('indomable:email-sent', { detail: [] })
      );
    }
  } catch (err) {
    console.error('Error al vaciar historial de correos:', err);
  }
};

export type PurgeEmailTimeRange = 'day' | 'week' | 'month' | 'all';

export const purgeSentEmailsHistory = (
  range: PurgeEmailTimeRange
): SentEmailRecord[] => {
  try {
    if (range === 'all') {
      clearSentEmailsHistory();
      return [];
    }

    const now = Date.now();
    let hours = 24;
    if (range === 'day') hours = 24;
    else if (range === 'week') hours = 24 * 7;
    else if (range === 'month') hours = 24 * 30;

    const cutoffMs = now - hours * 3600 * 1000;
    const cutoffIso = new Date(cutoffMs).toISOString();

    const currentHistory = getSentEmailsHistory();
    // Conservar únicamente correos con fecha igual o posterior al corte
    const updated = currentHistory.filter((item) => {
      const itemTime = new Date(item.sentAt).getTime();
      return itemTime >= cutoffMs;
    });

    localStorage.setItem(STORAGE_SENT_EMAILS_KEY, JSON.stringify(updated));
    syncPurgeSentEmails(cutoffIso).catch(() => {});

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('indomable:email-sent', { detail: updated })
      );
    }

    return updated;
  } catch (err) {
    console.error('Error al depurar historial de correos:', err);
    return getSentEmailsHistory();
  }
};

// ==========================================
// Plantillas de Correo (HTML & Texto)
// ==========================================

export const generateWelcomeEmailContent = (data: WelcomeEmailData) => {
  const subject = `🔥 ¡Bienvenido a INDOMABLE CrossFit! Tu cuenta ha sido creada`;
  const textBody = `
¡HOLA, ${data.name.toUpperCase()}!

Te damos la bienvenida a la comunidad de INDOMABLE CROSSFIT.
Tu cuenta ha sido creada exitosamente con los siguientes datos de acceso:

• Documento de Identificación: ${data.documentId}
• PIN de Acceso Configurado: ${data.pin}
• Estado Inicial: PENDIENTE DE ACTIVACIÓN

PASOS SIGUIENTES PARA ACTIVAR TU PLAN:
Para comenzar a agendar tus franjas horarias y registrar tus marcas (RMs), acércate a la recepción del Box o realiza el pago de tu mensualidad/tiquetera. El Coach o Staff activará tu membresía inmediatamente tras confirmar el pago.

¡Prepárate para superar tus límites!
INDOMABLE CROSSFIT - Potencia, Disciplina y Comunidad.
`;

  const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
  <div style="background: linear-gradient(135deg, #7f1d1d, #450a0a); padding: 32px 24px; text-align: center; border-bottom: 2px solid #dc2626;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">INDOMABLE</h1>
    <p style="color: #fca5a5; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">CrossFit & Performance Box</p>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0;">¡Bienvenido a la manada, ${data.name}! 🔥</h2>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
      Tu cuenta de atleta ha sido creada en la plataforma de <strong>INDOMABLE CrossFit</strong>. A continuación tienes tus credenciales para ingresar:
    </p>

    <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="margin-bottom: 12px; font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">Documento / Cédula:</span><br/>
        <strong style="color: #ffffff; font-size: 16px;">${data.documentId}</strong>
      </div>
      <div style="margin-bottom: 12px; font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">PIN de Acceso:</span><br/>
        <strong style="color: #ef4444; font-family: monospace; font-size: 18px; letter-spacing: 2px;">${data.pin}</strong>
      </div>
      <div style="font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">Estado de Cuenta:</span><br/>
        <span style="display: inline-block; background-color: #451a03; color: #fde047; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; border: 1px solid #854d0e;">
          ⏳ Pendiente de Activación
        </span>
      </div>
    </div>

    <div style="background-color: #1c1917; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="color: #fef3c7; font-size: 13px; margin: 0; line-height: 1.5;">
        <strong>¿Cómo activar tu plan?</strong><br/>
        Realiza el pago de tu plan o tiquetera en el box o por transferencia bancaria. Una vez registrado por el Coach, recibirás un correo confirmando la activación de tus cupos.
      </p>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app-crossfit-c66a5.web.app'}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
        Ingresar a INDOMABLE CrossFit →
      </a>
    </div>

    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 20px;">
      INDOMABLE CrossFit • Aplicativo Web Progresivo (PWA)<br/>
      Entrenamiento de Alta Intensidad, Fuerza & Comunidad.
    </p>
  </div>
</div>
`;

  return { subject, textBody, htmlBody };
};

export const generateActivationEmailContent = (data: ActivationEmailData) => {
  const subject = `⚡ ¡Tu membresía en INDOMABLE CrossFit ha sido ACTIVADA!`;
  const textBody = `
¡EXCELENTE NOTICIA, ${data.name.toUpperCase()}!

Tu membresía en INDOMABLE CROSSFIT ha sido activada y verificada por el Coach.

DETALLES DE TU PLAN ACTIVADO:
• Plan: ${data.planName}
• Fecha de Inicio: ${data.startDate}
• Válido Hasta: ${data.endDate}
${data.classesCount ? `• Clases Disponibles: ${data.classesCount}` : '• Clases: Ilimitadas durante la vigencia'}

¡TU CUPO YA ESTÁ HABILITADO!
Abre la aplicación ahora mismo para consultar el WOD del día y agendar tu primera clase.

¡Nos vemos en el box a darlo todo!
INDOMABLE CROSSFIT
`;

  const htmlBody = `
<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; color: #f4f4f5; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
  <div style="background: linear-gradient(135deg, #15803d, #14532d); padding: 32px 24px; text-align: center; border-bottom: 2px solid #22c55e;">
    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px;">INDOMABLE</h1>
    <p style="color: #bbf7d0; margin: 6px 0 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">¡Membresía Oficialmente Activada!</p>
  </div>
  
  <div style="padding: 32px 24px;">
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 800; margin-top: 0;">¡Todo listo para entrenar, ${data.name}! ⚡</h2>
    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
      El Coach ha confirmado tu suscripción. Tu membresía se encuentra <strong>100% ACTIVA</strong> y habilitada para reservar franjas de clase en la plataforma.
    </p>

    <div style="background-color: #18181b; border: 1px solid #14532d; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="margin-bottom: 12px; font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">Plan Autorizado:</span><br/>
        <strong style="color: #22c55e; font-size: 16px;">${data.planName}</strong>
      </div>
      <div style="margin-bottom: 12px; font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">Vigencia:</span><br/>
        <strong style="color: #ffffff; font-size: 14px;">${data.startDate} al ${data.endDate}</strong>
      </div>
      <div style="font-size: 13px;">
        <span style="color: #71717a; text-transform: uppercase; font-weight: 700; font-size: 11px;">Cupos / Clases Disponibles:</span><br/>
        <strong style="color: #ffffff; font-size: 14px;">${data.classesCount ? `${data.classesCount} Clases` : 'Ilimitadas durante el periodo'}</strong>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://app-crossfit-c66a5.web.app'}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; text-decoration: none; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);">
        Ir a Reservar Clase →
      </a>
    </div>

    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #27272a; padding-top: 20px;">
      INDOMABLE CrossFit • Box Oficial<br/>
      Recuerda llegar 10 minutos antes de tu clase para el calentamiento general.
    </p>
  </div>
</div>
`;

  return { subject, textBody, htmlBody };
};

// ==========================================
// Funciones de Envío
// ==========================================

/**
 * Realiza el envío o simulación de correo
 */
async function dispatchEmail(
  toEmail: string,
  toName: string,
  subject: string,
  type: 'welcome' | 'activation' | 'test',
  bodySnippet: string,
  templateParams: Record<string, string>
): Promise<{ success: boolean; message: string }> {
  const config = getEmailConfig();

  // Si Google Apps Script Webhook está seleccionado como proveedor activo (Recomendado / Sin límite)
  if (config.isEnabled && config.provider === 'apps_script') {
    const webhookUrl = config.appsScriptWebhookUrl?.trim();

    if (!webhookUrl) {
      const errorMsg = 'Configuración de Google Apps Script incompleta: Debes ingresar la URL del Webhook de Apps Script en los ajustes.';
      saveSentEmailRecord({
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        toEmail,
        toName,
        subject,
        type,
        sentAt: new Date().toISOString(),
        status: 'error',
        errorMessage: errorMsg,
        bodySnippet,
      });
      return { success: false, message: errorMsg };
    }

    try {
      const payload = {
        to: toEmail.trim(),
        name: toName.trim(),
        subject,
        type,
        bodySnippet,
        htmlBody: templateParams.html_body || templateParams.message_html || '',
        textBody: templateParams.message_body || bodySnippet,
        params: templateParams,
      };

      // Disparar POST hacia Google Apps Script Web App
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      saveSentEmailRecord({
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        toEmail,
        toName,
        subject,
        type,
        sentAt: new Date().toISOString(),
        status: 'sent',
        bodySnippet,
      });

      return {
        success: true,
        message: `¡Correo enviado exitosamente vía Google Apps Script a ${toEmail}!`,
      };
    } catch (err: any) {
      const errorMsg = `Error de conexión al despachar vía Google Apps Script: ${err?.message || 'Verifica tu conexión'}`;
      saveSentEmailRecord({
        id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        toEmail,
        toName,
        subject,
        type,
        sentAt: new Date().toISOString(),
        status: 'error',
        errorMessage: errorMsg,
        bodySnippet,
      });
      return { success: false, message: errorMsg };
    }
  }

  // Modo Simulación Automática (Offline / Desarrollo / Producción sin webhook configurado)
  // Guarda el correo en el historial local para auditoría visual del Coach
  saveSentEmailRecord({
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    toEmail,
    toName,
    subject,
    type,
    sentAt: new Date().toISOString(),
    status: 'simulated',
    bodySnippet,
  });

  return {
    success: true,
    message: `Notificación registrada en modo local para ${toEmail} (EmailJS no configurado o en simulación).`,
  };
}

/**
 * Enviar correo de bienvenida tras autoregistro
 */
export const sendWelcomeRegistrationEmail = async (
  data: WelcomeEmailData
): Promise<{ success: boolean; message: string }> => {
  if (!data.email) {
    return { success: false, message: 'El atleta no cuenta con correo registrado.' };
  }

  const { subject, textBody, htmlBody } = generateWelcomeEmailContent(data);

  return dispatchEmail(
    data.email,
    data.name,
    subject,
    'welcome',
    `Bienvenida a INDOMABLE. Cédula: ${data.documentId}, PIN asignado: ${data.pin}. Cuenta en espera de activación.`,
    {
      athlete_name: data.name,
      name: data.name,
      nombre: data.name,
      to_name: data.name,

      document_id: data.documentId,
      cedula: data.documentId,
      documento: data.documentId,

      access_pin: data.pin,
      pin: data.pin,

      message_body: textBody,
      message: textBody,
      mensaje: textBody,
      cuerpo: textBody,
      content: textBody,
      html_body: htmlBody,
      message_html: htmlBody,
    }
  );
};

/**
 * Enviar correo de membresía activada / renovada
 */
export const sendMembershipActivatedEmail = async (
  data: ActivationEmailData
): Promise<{ success: boolean; message: string }> => {
  if (!data.email) {
    return { success: false, message: 'El atleta no cuenta con correo registrado.' };
  }

  const { subject, textBody, htmlBody } = generateActivationEmailContent(data);

  return dispatchEmail(
    data.email,
    data.name,
    subject,
    'activation',
    `Membresía ACTIVADA: ${data.planName} (${data.startDate} al ${data.endDate}). Cupos habilitados.`,
    {
      athlete_name: data.name,
      name: data.name,
      nombre: data.name,
      to_name: data.name,

      plan_name: data.planName,
      plan: data.planName,
      nombre_plan: data.planName,

      start_date: data.startDate,
      fecha_inicio: data.startDate,

      end_date: data.endDate,
      fecha_fin: data.endDate,
      fecha_vencimiento: data.endDate,

      classes_count: data.classesCount ? data.classesCount.toString() : 'Ilimitadas',
      clases: data.classesCount ? data.classesCount.toString() : 'Ilimitadas',
      cupos: data.classesCount ? data.classesCount.toString() : 'Ilimitadas',

      message_body: textBody,
      message: textBody,
      mensaje: textBody,
      cuerpo: textBody,
      content: textBody,
      html_body: htmlBody,
      message_html: htmlBody,
    }
  );
};

/**
 * Envía un correo de prueba (puede probar plantilla de bienvenida o de activación)
 */
export const sendTestEmail = async (
  targetEmail: string,
  testType: 'welcome' | 'activation' = 'activation'
): Promise<{ success: boolean; message: string }> => {
  if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
    return { success: false, message: 'Dirección de correo electrónico inválida.' };
  }

  if (testType === 'welcome') {
    return sendWelcomeRegistrationEmail({
      name: 'Atleta de Prueba',
      email: targetEmail,
      documentId: '1234567890',
      pin: '1234',
    });
  } else {
    const today = new Date().toISOString().split('T')[0];
    const end = new Date();
    end.setDate(end.getDate() + 30);
    const endStr = end.toISOString().split('T')[0];

    return sendMembershipActivatedEmail({
      name: 'Atleta de Prueba',
      email: targetEmail,
      planName: 'Mensual Ilimitado Pro (Prueba)',
      startDate: today,
      endDate: endStr,
      classesCount: undefined,
    });
  }
};

