/**
 * Utilidades para Notificaciones Web, PWA y Alertas In-App de INDOMABLE CrossFit & Gym
 * Soporta Service Worker Registration (showNotification), Notification API estándar,
 * Chime sonoro con Web Audio API y eventos personalizados en ventana.
 */

const SEEN_ANNOUNCEMENTS_KEY = 'indomable_seen_flyers';

export interface InAppAlertDetail {
  id?: string;
  title: string;
  body: string;
  icon?: string;
  date?: string;
}

/**
 * Comprueba si el usuario tiene la aplicación activa y visible en pantalla
 */
export function isUserActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'visible';
}

/**
 * Comprueba si el navegador actual soporta notificaciones
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
}

/**
 * Obtiene el estado actual de los permisos de notificación
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Solicita permisos de notificación al usuario
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Error solicitando permisos de notificación:', err);
    return Notification.permission;
  }
}

/**
 * Emite un sonido de alerta audible y elegante usando Web Audio API.
 * 100% compatible sin requerir archivos mp3 externos, funcionando offline y en PWA.
 */
export function playNotificationSound(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    // Tono de dos fases estilo timbre de alta definición (659Hz E5 -> 880Hz A5)
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.setValueAtTime(880, now + 0.09);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch {
    // Si el navegador requiere interacción previa para audio, no falla la ejecución
  }
}

/**
 * Dispara una alerta visual flotante dentro de la aplicación para garantizar
 * que el usuario reciba el aviso aunque el sistema operativo silencie o agrupe los banners.
 */
export function dispatchInAppAlert(detail: InAppAlertDetail): void {
  if (typeof window === 'undefined') return;
  try {
    const event = new CustomEvent<InAppAlertDetail>('indomable-inapp-alert', {
      detail,
    });
    window.dispatchEvent(event);
  } catch (err) {
    console.warn('No se pudo despachar la alerta in-app:', err);
  }
}

/**
 * Obtiene la registración de Service Worker activa con alta resiliencia para Android Chrome,
 * PWA standalone y navegadores móviles.
 */
async function getActiveServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    // 1. Si el controlador ya está activo
    if (navigator.serviceWorker.controller) {
      const existing = await navigator.serviceWorker.getRegistration();
      if (existing) return existing;
    }

    // 2. Revisar lista de registraciones existentes
    const allRegs = await navigator.serviceWorker.getRegistrations();
    if (allRegs && allRegs.length > 0) {
      const active = allRegs.find(r => r.active) || allRegs[0];
      if (active) return active;
    }

    // 3. Esperar a ready con timeout seguro (2500ms)
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const result = await Promise.race([readyPromise, timeoutPromise]);
    return result || null;
  } catch (err) {
    console.warn('[Notifications] Error al resolver Service Worker:', err);
    return null;
  }
}

/**
 * Dispara una notificación de nuevo anuncio / aviso.
/**
 * Verifica si el usuario actual tiene una sesión iniciada activa en este dispositivo
 */
export function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('indomable_crossfit_state_v2_auth');
    return raw !== null ? JSON.parse(raw) === true : false;
  } catch {
    return false;
  }
}

/**
 * Emite una notificación enriquecida cuando se publica un nuevo aviso/flyer:
 * - Si el usuario no tiene la sesión iniciada, NO emite nada para proteger su privacidad
 * - Suena el chime acústico Web Audio
 * - Emite la alerta visual flotante en la app
 * - Dispara la notificación del sistema operativo (ServiceWorker) para que suene y vibre
 *   en pantalla bloqueada o en segundo plano
 * - Vibra en dispositivos móviles con patrón multi-pulso
 */
export async function notifyNewAnnouncement(
  title: string,
  body: string,
  flyerId?: string,
  forceNotify = false
): Promise<void> {
  // GUARD ESTRICTO: Si no hay sesión iniciada en este dispositivo, salir inmediatamente
  if (!forceNotify && !isUserAuthenticated()) {
    return;
  }

  // 1. Sonido acústico y vibración háptica inmediata
  playNotificationSound();
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 300]);
    } catch {
      // ignore
    }
  }

  // 2. Alerta visual flotante In-App siempre visible si la ventana está abierta
  dispatchInAppAlert({
    id: flyerId,
    title,
    body,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // 3. Deduplicación para notificaciones nativas del sistema operativo
  if (flyerId && !forceNotify) {
    try {
      const seenRaw = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
      const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
      if (seen.includes(flyerId)) {
        return;
      }
      seen.push(flyerId);
      if (seen.length > 50) seen.shift();
      localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(seen));
    } catch {
      // ignore
    }
  }

  // 4. Si el navegador no soporta o no tiene permiso, la alerta in-app ya cubrió la visualización
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notifTitle = `📢 INDOMABLE: ${title}`;
  const notifOptions: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: flyerId || `announcement_${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Se mantiene visible en la pantalla de bloqueo
    silent: false,
  };

  // Método A: Service Worker (Requerido en Android Chrome, móvil y PWAs instaladas)
  try {
    const registration = await getActiveServiceWorker();
    if (registration && typeof registration.showNotification === 'function') {
      await registration.showNotification(notifTitle, notifOptions as NotificationOptions);
      return;
    }
    // Fallback B: Enviar por postMessage al Service Worker si showNotification no responde en window
    if (registration && registration.active) {
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title: notifTitle,
        options: notifOptions,
      });
      return;
    }
  } catch (swErr) {
    console.warn('[Notifications] Error emitiendo por ServiceWorker:', swErr);
  }

  // Método C: Fallback a Notification nativa de escritorio (en Android Chrome lanzará TypeError, se captura seguro)
  try {
    const notification = new Notification(notifTitle, {
      body: notifOptions.body,
      icon: notifOptions.icon,
      badge: notifOptions.badge,
      tag: notifOptions.tag,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (err) {
    // Android Chrome prohíbe el constructor new Notification(), lo cual es esperado
    console.warn('[Notifications] Notification API en ventana no permitida (móvil usa Service Worker):', err);
  }
}

/**
 * Envía una notificación de prueba forzada y solicita permisos si no se han concedido.
 * Proporciona diagnóstico directo del estado de los permisos en el navegador.
 */
export async function sendTestNotification(): Promise<{
  success: boolean;
  permission: NotificationPermission | 'unsupported';
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    // Sonido y banner in-app de todos modos
    playNotificationSound();
    dispatchInAppAlert({
      title: 'Prueba de Alerta INDOMABLE',
      body: 'Tu navegador no soporta la API de notificaciones nativas, pero las alertas internas están 100% activas.',
    });
    return {
      success: false,
      permission: 'unsupported',
      message: 'Tu navegador no soporta notificaciones de sistema operativo. Sin embargo, las alertas dentro de la app funcionan.',
    };
  }

  let permission: NotificationPermission | 'unsupported' = Notification.permission;
  if (permission === 'default') {
    permission = await requestNotificationPermission();
  }

  if (permission === 'denied') {
    // Alertar in-app indicando que el navegador tiene los permisos bloqueados
    playNotificationSound();
    dispatchInAppAlert({
      title: 'Notificaciones Bloqueadas en Navegador',
      body: 'El navegador tiene bloqueadas las notificaciones para este sitio. Toca el candado al lado del link para permitirlas.',
    });
    return {
      success: false,
      permission: 'denied',
      message: 'Las notificaciones están bloqueadas en tu navegador. Haz clic en el candado 🔒 al lado de la barra de direcciones para habilitarlas.',
    };
  }

  if (permission === 'granted') {
    await notifyNewAnnouncement(
      '¡Alerta de Prueba Exitosa!',
      'Las notificaciones de INDOMABLE están configuradas y funcionando a la perfección en este dispositivo.',
      undefined,
      true // forzar notificación
    );
    return {
      success: true,
      permission: 'granted',
      message: '¡Notificación enviada con éxito! Revisa la alerta en pantalla y en la barra de notificaciones de tu equipo.',
    };
  }

  return {
    success: false,
    permission,
    message: 'No se otorgaron permisos de notificación en el navegador.',
  };
}

/**
 * Registra flyers existentes como "ya vistos" en la carga inicial
 */
export function markFlyersAsSeen(flyerIds: string[]): void {
  try {
    const seenRaw = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
    const merged = Array.from(new Set([...seen, ...flyerIds]));
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

/**
 * Calcula los días restantes hasta la fecha de vencimiento (formato YYYY-MM-DD).
 * Devuelve:
 * - número positivo: días restantes (ej: 3, 2, 1)
 * - 0: vence hoy
 * - número negativo: días transcurridos desde que venció (ej: -1, -2)
 * - null: si la fecha no es válida
 */
export function calculateMembershipDaysRemaining(endDateStr?: string): number | null {
  if (!endDateStr) return null;
  const parts = endDateStr.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

  // Final del día de vencimiento (23:59:59)
  const end = new Date(year, month, day, 23, 59, 59, 999);
  const now = new Date();

  const diffMs = end.getTime() - now.getTime();
  if (diffMs < 0) {
    const daysPast = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    return -Math.max(1, daysPast);
  }
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function formatMembershipDaysRemaining(days: number | null): {
  text: string;
  badgeClass: string;
  isUrgent: boolean;
  isExpired: boolean;
} {
  if (days === null) {
    return {
      text: 'Sin fecha',
      badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      isUrgent: false,
      isExpired: false,
    };
  }

  if (days < 0) {
    return {
      text: 'Vencida',
      badgeClass: 'bg-red-950/70 text-red-400 border-red-800/60 font-bold',
      isUrgent: true,
      isExpired: true,
    };
  }

  if (days === 0) {
    return {
      text: '¡Vence hoy!',
      badgeClass: 'bg-red-600/30 text-red-300 border-red-500/50 animate-pulse font-black',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days === 1) {
    return {
      text: 'Queda 1 día',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black',
      isUrgent: true,
      isExpired: false,
    };
  }

  if (days <= 3) {
    return {
      text: `Quedan ${days} días`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
      isUrgent: true,
      isExpired: false,
    };
  }

  return {
    text: `Quedan ${days} días`,
    badgeClass: 'bg-zinc-800/90 text-zinc-300 border-zinc-700/60 font-medium',
    isUrgent: false,
    isExpired: false,
  };
}

/**
 * Notifica al atleta cuando su membresía esté por vencer (3 días o menos).
 * Evita repeticiones no deseadas utilizando una clave de registro por día y umbral.
 */
export async function notifyMembershipExpiring(
  athleteId: string,
  athleteName: string,
  planName: string,
  daysRemaining: number
): Promise<void> {
  if (daysRemaining > 3 || daysRemaining < 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const notifKey = `indomable_notif_membership_${athleteId}_${todayStr}_${daysRemaining}d`;

  try {
    if (localStorage.getItem(notifKey)) {
      return; // Ya notificado hoy para este umbral
    }
  } catch {
    // ignore
  }

  const firstName = athleteName.split(' ')[0] || 'Atleta';
  let timeText = '';
  if (daysRemaining === 0) {
    timeText = 'vence hoy';
  } else if (daysRemaining === 1) {
    timeText = 'te queda solo 1 día de vigencia';
  } else {
    timeText = `te quedan ${daysRemaining} días de vigencia`;
  }

  const title = daysRemaining === 0 ? '🚨 ¡Tu membresía vence hoy!' : '⏳ ¡Tu membresía está por vencer!';
  const body = `Hola ${firstName}, ${timeText} en tu plan "${planName}". Renuévala a tiempo para no interrumpir tus entrenamientos.`;

  // 1. Sonido acústico
  playNotificationSound();

  // 2. Alerta In-App flotante
  dispatchInAppAlert({
    id: `membership_exp_${athleteId}_${daysRemaining}`,
    title,
    body,
    date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });

  // 3. Vibración háptica
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 300]);
    } catch {
      // ignore
    }
  }

  // 4. Notificación de sistema operativo / Service Worker
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    const notifTitle = `📢 INDOMABLE: ${title}`;
    const notifOptions: NotificationOptions & { renotify?: boolean } = {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: `membership_expiry_${athleteId}`,
      renotify: true,
      requireInteraction: true,
      silent: false,
    };

    try {
      const registration = await getActiveServiceWorker();
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(notifTitle, notifOptions as NotificationOptions);
      } else if (registration && registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: notifTitle,
          options: notifOptions,
        });
      } else {
        const notification = new Notification(notifTitle, {
          body: notifOptions.body,
          icon: notifOptions.icon,
          badge: notifOptions.badge,
          tag: notifOptions.tag,
          requireInteraction: true,
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (err) {
      console.warn('Error emitiendo notificación nativa de membresía:', err);
    }
  }

  try {
    localStorage.setItem(notifKey, 'true');
  } catch {
    // ignore
  }
}
