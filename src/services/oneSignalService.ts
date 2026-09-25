/**
 * Servicio de Notificaciones Push Web con OneSignal para INDOMABLE CrossFit & Gym
 * Configura VITE_ONESIGNAL_APP_ID y VITE_ONESIGNAL_REST_API_KEY en tu archivo .env
 */

export const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string || '';
export const DEFAULT_ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string || '';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

let isInitialized = false;

/**
 * Inicializa OneSignal en el navegador / PWA
 */
export function initOneSignal(): void {
  if (typeof window === 'undefined' || isInitialized || !ONESIGNAL_APP_ID?.trim()) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (OneSignal?.init) {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID.trim(),
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false, // Usamos nuestra propia UI para no superponer botones flotantes
          },
        });
        isInitialized = true;
        console.log('[OneSignal] Inicializado exitosamente con App ID:', ONESIGNAL_APP_ID);
      }
    } catch (err) {
      console.warn('[OneSignal] Error durante la inicialización:', err);
    }
  });
}

/**
 * Vincula el usuario autenticado con OneSignal y activa la suscripción push
 */
export function identifyUserInOneSignal(userId: string, role: string): void {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID?.trim()) return;
  if (!userId || typeof userId !== 'string' || !userId.trim()) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      if (OneSignal && typeof OneSignal.login === 'function') {
        try {
          await OneSignal.login(userId.trim());
        } catch (loginErr) {
          console.warn('[OneSignal] Advertencia durante login SDK:', loginErr);
        }
      }
      if (OneSignal?.User?.addTag) {
        await OneSignal.User.addTag('role', role);
        await OneSignal.User.addTag('isAuthenticated', 'true');
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        await OneSignal.User?.PushSubscription?.optIn?.();
      }
      console.log('[OneSignal] Usuario autenticado vinculado:', userId);
    } catch (err) {
      console.warn('[OneSignal] Error identificando usuario:', err);
    }
  });
}

/**
 * Cierra la sesión en OneSignal y desactiva las notificaciones push en este dispositivo
 */
export function logoutOneSignal(): void {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID?.trim()) return;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      await OneSignal.User?.PushSubscription?.optOut?.();
      await OneSignal.User?.addTag?.('isAuthenticated', 'false');
      await OneSignal.User?.removeTag?.('role');
      if (typeof OneSignal.logout === 'function') {
        try {
          await OneSignal.logout();
        } catch {
          // Ignore logout error if not logged in
        }
      }
      console.log('[OneSignal] Sesión cerrada y notificaciones push desactivadas en OneSignal');
    } catch (err) {
      console.warn('[OneSignal] Error durante logout de OneSignal:', err);
    }
  });
}

/**
 * Solicita permisos de notificación Push en OneSignal y suscribe al atleta
 */
export async function promptOneSignalPushPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID?.trim()) return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        const permission = await OneSignal.Notifications.requestPermission();
        if (permission) {
          try {
            await OneSignal.User?.PushSubscription?.optIn?.();
          } catch {
            // ignore
          }
        }
        resolve(Boolean(permission));
      } catch (err) {
        console.warn('[OneSignal] Error al solicitar permisos:', err);
        resolve(false);
      }
    });
  });
}

/**
 * Obtiene el estado de permiso en OneSignal
 */
export async function isOneSignalPushSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !ONESIGNAL_APP_ID?.trim()) return false;

  return new Promise((resolve) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        const supported = await OneSignal.Notifications.isPushSupported();
        resolve(Boolean(supported));
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Envía una notificación Push masiva a través de la API REST de OneSignal
 * Esta llamada despierta celulares con pantalla apagada, bloqueados o con la app cerrada.
 */
export async function sendOneSignalPushNotification({
  title,
  body,
  restApiKey,
  url = 'https://app-crossfit-c66a5.web.app',
}: {
  title: string;
  body: string;
  restApiKey?: string;
  url?: string;
}): Promise<{ success: boolean; message: string }> {
  const key =
    restApiKey?.trim() ||
    (import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string | undefined)?.trim() ||
    DEFAULT_ONESIGNAL_REST_API_KEY;

  if (!key) {
    return {
      success: false,
      message: 'Falta la REST API Key de OneSignal. El administrador debe configurarla para enviar Push a celulares cerrados.',
    };
  }

  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: 'tag', key: 'isAuthenticated', relation: '=', value: 'true' },
        ],
        headings: { es: `📢 INDOMABLE: ${title}`, en: `📢 INDOMABLE: ${title}` },
        contents: { es: body, en: body },
        url,
        chrome_web_icon: 'https://app-crossfit-c66a5.web.app/pwa-192x192.png',
        chrome_web_badge: 'https://app-crossfit-c66a5.web.app/pwa-192x192.png',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[OneSignal] Push despachado exitosamente:', data);
      return {
        success: true,
        message: '¡Notificación Push enviada con éxito a todos los dispositivos!',
      };
    } else {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.errors?.[0] || response.statusText;
      console.warn('[OneSignal] Error devuelto por la API:', errData);
      return {
        success: false,
        message: `Error al enviar Push: ${errMsg}`,
      };
    }
  } catch (err: any) {
    console.warn('[OneSignal] Excepción de conexión:', err);
    return {
      success: false,
      message: `Error de conexión con OneSignal: ${err?.message || 'Desconocido'}`,
    };
  }
}
