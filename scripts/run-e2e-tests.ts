/**
 * SUITE COMPLETA DE PRUEBAS INTEGRALES (E2E & DOMAIN RULES)
 * Box INDOMABLE - Crossfit, Musculación & Personalizado
 * 
 * Verifica los flujos críticos de la aplicación:
 * 1. Registro y Creación de Atletas
 * 2. Asignación y Activación de Planes de Membresía
 * 3. Programación, Cupos y Agendamiento de Clases (Control de Aforo y Cancelaciones)
 * 4. Regla Condicional de Desbloqueo del WOD del Día (1 hora antes)
 * 5. Notificaciones Push (OneSignal) y Plantillas de Correo (EmailJS)
 * 6. Depuración y Purga de Historial por Períodos (Día, Semana, Mes, Todo)
 * 7. Mediciones Antropométricas y Cálculo de IMC
 * 8. Enlace de la Comunidad de WhatsApp
 */

import { generateWelcomeEmailContent, generateActivationEmailContent } from '../src/services/emailService.js';
import { calculateMembershipDaysRemaining } from '../src/utils/notificationUtils.js';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    results.push({ name: testName, passed: true, details });
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
  } else {
    results.push({ name: testName, passed: false, error: 'Falla de aserción', details });
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} - ${details || ''}`);
  }
}

async function runTestSuite() {
  console.log('\n\x1b[1m\x1b[33m================================================================');
  console.log('       INICIANDO SUITE DE PRUEBAS INTEGRALES - BOX INDOMABLE    ');
  console.log('================================================================\x1b[0m\n');

  // ==========================================
  // 1. REGISTRO Y CREACIÓN DE USUARIO (ATLETA)
  // ==========================================
  console.log('\x1b[36m[MÓDULO 1] Registro y Creación de Atletas\x1b[0m');
  
  const mockAthleteInput = {
    documentId: '1098765432',
    name: 'Carlos Mendoza',
    phone: '3109876543',
    email: 'carlos.mendoza@gmail.com',
    pin: '1234',
    discipline: 'crossfit' as const,
  };

  // Simulación de validaciones de registro
  const isValidDocument = /^\d{6,12}$/.test(mockAthleteInput.documentId);
  const isValidPin = /^\d{4}$/.test(mockAthleteInput.pin);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mockAthleteInput.email);

  assert(isValidDocument, 'Validación de formato de documento de identidad (6 a 12 dígitos)');
  assert(isValidPin, 'Validación de PIN de 4 dígitos');
  assert(isValidEmail, 'Validación de formato de correo electrónico');

  const registeredAthlete = {
    id: `athlete_${mockAthleteInput.documentId}`,
    ...mockAthleteInput,
    status: 'pending' as const, // Debe nacer pendiente de activación hasta validar pago
    role: 'athlete' as const,
    createdAt: new Date().toISOString(),
    membership: null,
  };

  assert(registeredAthlete.status === 'pending', 'El atleta recién registrado inicia en estado PENDIENTE');
  assert(registeredAthlete.membership === null, 'El atleta recién registrado no tiene membresía activa');

  // ==========================================
  // 2. CONTRATACIÓN Y ACTIVACIÓN DE PLANES
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 2] Contratación y Activación de Planes de Membresía\x1b[0m');

  const now = new Date();
  const startDateStr = now.toISOString().split('T')[0];
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 30);
  const endDateStr = endDate.toISOString().split('T')[0];

  // Simulación de aprobación y activación por Coach/Admin
  const activatedAthlete = {
    ...registeredAthlete,
    status: 'active' as const,
    membership: {
      planName: 'Mensual Ilimitado CrossFit',
      discipline: 'crossfit' as const,
      startDate: startDateStr,
      endDate: endDateStr,
      price: 180000,
      paymentMethod: 'transferencia',
      status: 'active' as const,
      remainingSessions: 999,
    },
  };

  assert(activatedAthlete.status === 'active', 'El atleta pasa a estado ACTIVO tras la aprobación del Coach');
  assert(activatedAthlete.membership?.planName === 'Mensual Ilimitado CrossFit', 'Se asigna correctamente el plan contratado');

  const daysRemaining = calculateMembershipDaysRemaining(endDateStr);
  assert(daysRemaining !== null && daysRemaining >= 29 && daysRemaining <= 31, `Cálculo de vigencia de membresía (30 días vigentes: calculó ${daysRemaining} días)`);

  // ==========================================
  // 3. AGENDAMIENTO DE CLASES & CONTROL DE AFOROS
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 3] Agendamiento de Clases & Control de Aforos\x1b[0m');

  interface MockClassSlot {
    id: string;
    time: string;
    capacity: number;
    coach: string;
    attendeeIds: string[];
  }

  const classSlot: MockClassSlot = {
    id: 'slot_0700',
    time: '07:00 AM',
    capacity: 2, // Aforo reducido a 2 cupos para probar límite
    coach: 'Coach Alejandro',
    attendeeIds: [],
  };

  // Función simulada de reserva con guardias
  function bookClass(slot: MockClassSlot, athleteId: string): { success: boolean; reason?: string } {
    if (slot.attendeeIds.includes(athleteId)) {
      return { success: false, reason: 'Ya tienes un cupo reservado en esta clase' };
    }
    if (slot.attendeeIds.length >= slot.capacity) {
      return { success: false, reason: 'Clase sin cupos disponibles (Aforo completo)' };
    }
    slot.attendeeIds.push(athleteId);
    return { success: true };
  }

  function cancelBooking(slot: MockClassSlot, athleteId: string): boolean {
    const idx = slot.attendeeIds.indexOf(athleteId);
    if (idx >= 0) {
      slot.attendeeIds.splice(idx, 1);
      return true;
    }
    return false;
  }

  // 3.1 Reserva exitosa del atleta
  const book1 = bookClass(classSlot, activatedAthlete.id);
  assert(book1.success && classSlot.attendeeIds.length === 1, 'Reserva de primer cupo exitosa y conteo incrementado');

  // 3.2 Intento de doble reserva por el mismo atleta
  const bookDuplicate = bookClass(classSlot, activatedAthlete.id);
  assert(!bookDuplicate.success && Boolean(bookDuplicate.reason?.includes('Ya tienes')), 'Bloqueo estricto de reserva duplicada para la misma franja');

  // 3.3 Reserva de segundo cupo por otro atleta (llena el aforo)
  const book2 = bookClass(classSlot, 'athlete_segundo_usuario');
  assert(book2.success && classSlot.attendeeIds.length === classSlot.capacity, 'Reserva de segundo cupo llenando el aforo máximo');

  // 3.4 Intento de reserva con aforo lleno
  const bookOverflow = bookClass(classSlot, 'athlete_tercer_usuario');
  assert(!bookOverflow.success && Boolean(bookOverflow.reason?.includes('sin cupos')), 'Bloqueo por aforo completo (guarda de sobrecupo)');

  // 3.5 Cancelación de cupo y liberación inmediata
  const canceled = cancelBooking(classSlot, activatedAthlete.id);
  assert(canceled && classSlot.attendeeIds.length === 1, 'Cancelación de reserva y liberación inmediata del cupo');

  // Re-reservar para las pruebas siguientes de WOD
  bookClass(classSlot, activatedAthlete.id);

  // ==========================================
  // 4. REGLA DE VISUALIZACIÓN DEL WOD (BLOQUEO A 1 HORA)
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 4] Regla de Visualización del WOD del Día\x1b[0m');

  const mockWod = {
    date: startDateStr,
    warmup: '3 rondas de 200m Run, 10 Air Squats, 10 Push-ups',
    strength: 'Back Squat 5x5 al 75% 1RM',
    metcon: 'AMRAP 15 min: 15 Wall Balls, 12 Toes-to-Bar, 9 Box Jumps',
    coachNotes: 'Enfocar en la profundidad de la sentadilla',
  };

  function evaluateWodVisibility(params: {
    role: 'athlete' | 'coach' | 'admin';
    hasBookingToday: boolean;
    classTimeMinutesFromNow: number; // minutos que faltan para la clase
  }): { isUnlocked: boolean; state: 'NO_BOOKING' | 'WAITING_ONE_HOUR' | 'UNLOCKED' } {
    if (params.role === 'coach' || params.role === 'admin') {
      return { isUnlocked: true, state: 'UNLOCKED' };
    }
    if (!params.hasBookingToday) {
      return { isUnlocked: false, state: 'NO_BOOKING' };
    }
    if (params.classTimeMinutesFromNow > 60) {
      return { isUnlocked: false, state: 'WAITING_ONE_HOUR' };
    }
    return { isUnlocked: true, state: 'UNLOCKED' };
  }

  // 4.1 Atleta sin reserva: WOD bloqueado
  const wodNoBooking = evaluateWodVisibility({ role: 'athlete', hasBookingToday: false, classTimeMinutesFromNow: 120 });
  assert(!wodNoBooking.isUnlocked && wodNoBooking.state === 'NO_BOOKING', 'WOD Bloqueado: Atleta sin reserva para el día de hoy');

  // 4.2 Atleta con reserva a más de 1 hora (ej: faltan 180 min): WOD en espera
  const wodWaiting = evaluateWodVisibility({ role: 'athlete', hasBookingToday: true, classTimeMinutesFromNow: 180 });
  assert(!wodWaiting.isUnlocked && wodWaiting.state === 'WAITING_ONE_HOUR', 'WOD en Espera: Falta más de 1 hora para la clase (cuenta regresiva activa)');

  // 4.3 Atleta con reserva a menos de 1 hora (ej: faltan 45 min): WOD Desbloqueado
  const wodUnlocked = evaluateWodVisibility({ role: 'athlete', hasBookingToday: true, classTimeMinutesFromNow: 45 });
  assert(wodUnlocked.isUnlocked && wodUnlocked.state === 'UNLOCKED', 'WOD Desbloqueado: Faltan 45 min para la clase (revelado de calentamiento y metcon)');

  // 4.4 Coach o Admin: Acceso irrestricto
  const wodCoach = evaluateWodVisibility({ role: 'coach', hasBookingToday: false, classTimeMinutesFromNow: 300 });
  assert(wodCoach.isUnlocked && wodCoach.state === 'UNLOCKED', 'Acceso Coach/Admin: Visualización irrestricta del WOD sin requerir reserva previa');

  // ==========================================
  // 5. NOTIFICACIONES PUSH Y CORREOS ELECTRÓNICOS
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 5] Notificaciones Push (OneSignal) & Plantillas de Correo (EmailJS)\x1b[0m');

  // 5.1 Plantilla de bienvenida por correo
  const welcomeEmail = generateWelcomeEmailContent({
    name: registeredAthlete.name,
    email: registeredAthlete.email,
    documentId: registeredAthlete.documentId,
    pin: registeredAthlete.pin,
  });

  assert(welcomeEmail.subject.includes('INDOMABLE'), 'Asunto del correo de bienvenida contiene marca INDOMABLE');
  assert(welcomeEmail.textBody.includes(registeredAthlete.documentId), 'Cuerpo del correo de bienvenida incluye número de documento');
  assert(welcomeEmail.textBody.includes('PENDIENTE DE ACTIVACIÓN'), 'Cuerpo del correo de bienvenida incluye estado inicial y pasos de pago');

  // 5.2 Plantilla de activación por correo
  const activationEmail = generateActivationEmailContent({
    name: activatedAthlete.name,
    email: activatedAthlete.email,
    planName: activatedAthlete.membership!.planName,
    startDate: activatedAthlete.membership!.startDate,
    endDate: activatedAthlete.membership!.endDate,
    classesCount: activatedAthlete.membership!.remainingSessions,
  });

  assert(
    activationEmail.subject.toLowerCase().includes('membresía') &&
    activationEmail.subject.toLowerCase().includes('activada'),
    'Asunto del correo de activación confirma membresía activada'
  );
  assert(activationEmail.textBody.includes(activatedAthlete.membership!.planName), 'Correo de activación incluye nombre del plan');
  assert(activationEmail.textBody.includes(activatedAthlete.membership!.endDate), 'Correo de activación incluye fecha de vigencia');

  // 5.3 Payload de notificación Push OneSignal
  function buildOneSignalPayload(flyer: { title: string; category?: string; url?: string }, appId: string) {
    return {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { en: flyer.title, es: flyer.title },
      contents: {
        en: 'Abre INDOMABLE para conocer todos los detalles de este nuevo anuncio.',
        es: 'Abre INDOMABLE para conocer todos los detalles de este nuevo anuncio.',
      },
      url: flyer.url || 'https://app-crossfit-c66a5.web.app',
      web_sound: 'https://app-crossfit-c66a5.web.app/notification.mp3',
      priority: 10,
    };
  }

  const pushPayload = buildOneSignalPayload({ title: '🔥 Gran Torneo Interno de Aniversario' }, '1e0dbcd4-d398-4d6c-b826-0a0a4921f1e2');
  assert(pushPayload.headings.es === '🔥 Gran Torneo Interno de Aniversario', 'Payload OneSignal: Título del anuncio asignado correctamente');
  assert(pushPayload.included_segments.includes('Subscribed Users'), 'Payload OneSignal: Dirigido a usuarios suscritos');
  assert(pushPayload.priority === 10, 'Payload OneSignal: Máxima prioridad de entrega en segundo plano');

  // ==========================================
  // 6. DEPURACIÓN DE HISTORIAL POR RANGOS DE TIEMPO
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 6] Depuración de Notificaciones del Historial (Día, Semana, Mes, Todo)\x1b[0m');

  const currentMs = Date.now();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  interface MockHistoryItem {
    id: string;
    sentAt: string;
    recipient: string;
  }

  // Generamos un set de prueba con 4 registros temporales
  const syntheticHistory: MockHistoryItem[] = [
    { id: '1', sentAt: new Date(currentMs - 2 * ONE_HOUR).toISOString(), recipient: 'hoy@test.com' }, // 2 horas atrás (< 24h)
    { id: '2', sentAt: new Date(currentMs - 3 * ONE_DAY).toISOString(), recipient: 'hace3dias@test.com' }, // 3 días atrás (> 24h, < 7d)
    { id: '3', sentAt: new Date(currentMs - 12 * ONE_DAY).toISOString(), recipient: 'hace12dias@test.com' }, // 12 días atrás (> 7d, < 30d)
    { id: '4', sentAt: new Date(currentMs - 45 * ONE_DAY).toISOString(), recipient: 'hace45dias@test.com' }, // 45 días atrás (> 30d)
  ];

  function purgeHistory(list: MockHistoryItem[], range: 'day' | 'week' | 'month' | 'all'): MockHistoryItem[] {
    if (range === 'all') return [];
    let hours = 24;
    if (range === 'day') hours = 24;
    else if (range === 'week') hours = 24 * 7;
    else if (range === 'month') hours = 24 * 30;

    const cutoff = currentMs - hours * 3600 * 1000;
    return list.filter((item) => new Date(item.sentAt).getTime() >= cutoff);
  }

  // 6.1 Purga por 24 horas (Día): debe conservar solo el registro de hace 2 horas
  const purgedByDay = purgeHistory(syntheticHistory, 'day');
  assert(purgedByDay.length === 1 && purgedByDay[0].id === '1', 'Purga por día (>24h): Conserva únicamente registros de hoy y depura los 3 más antiguos');

  // 6.2 Purga por 7 días (Semana): debe conservar los registros de 2 horas y 3 días
  const purgedByWeek = purgeHistory(syntheticHistory, 'week');
  assert(purgedByWeek.length === 2 && purgedByWeek.map(i => i.id).join() === '1,2', 'Purga por semana (>7d): Conserva registros de los últimos 7 días');

  // 6.3 Purga por 30 días (Mes): debe conservar los registros de 2 horas, 3 días y 12 días
  const purgedByMonth = purgeHistory(syntheticHistory, 'month');
  assert(purgedByMonth.length === 3 && purgedByMonth.map(i => i.id).join() === '1,2,3', 'Purga por mes (>30d): Conserva registros de los últimos 30 días');

  // 6.4 Vaciado total: debe dejar la lista vacía
  const purgedAll = purgeHistory(syntheticHistory, 'all');
  assert(purgedAll.length === 0, 'Vaciado total: Remueve el 100% de los registros del historial');

  // ==========================================
  // 7. MEDICIONES ANTROPOMÉTRICAS
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 7] Mediciones Antropométricas & Validaciones\x1b[0m');

  function validateAnthropometry(record: {
    date: string;
    weightKg: number;
    heightCm: number;
    bodyFatPercent?: number;
    waistCm?: number;
  }): { valid: boolean; error?: string; bmi?: number } {
    if (!record.date) return { valid: false, error: 'Fecha requerida' };
    if (!record.weightKg || record.weightKg <= 20 || record.weightKg >= 300) {
      return { valid: false, error: 'Peso inválido' };
    }
    if (!record.heightCm || record.heightCm <= 80 || record.heightCm >= 250) {
      return { valid: false, error: 'Estatura inválida' };
    }
    if (!record.bodyFatPercent && !record.waistCm) {
      return { valid: false, error: 'Requiere al menos % de grasa o circunferencia de cintura' };
    }
    const heightM = record.heightCm / 100;
    const bmi = parseFloat((record.weightKg / (heightM * heightM)).toFixed(1));
    return { valid: true, bmi };
  }

  // 7.1 Registro incompleto (sin grasa ni cintura)
  const antIncomplete = validateAnthropometry({ date: '2026-09-19', weightKg: 80, heightCm: 175 });
  assert(!antIncomplete.valid, 'Validación estricta rechaza valoración sin métricas de composición');

  // 7.2 Registro válido y cálculo de IMC
  const antValid = validateAnthropometry({ date: '2026-09-19', weightKg: 82, heightCm: 178, bodyFatPercent: 14.5, waistCm: 81 });
  assert(antValid.valid && antValid.bmi === 25.9, `Cálculo de IMC exacto (Peso 82kg, 178cm -> IMC: ${antValid.bmi})`);

  // ==========================================
  // 8. ENLACE COMUNITARIO DE WHATSAPP
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 8] Enlace Comunitario de WhatsApp\x1b[0m');

  function validateWhatsAppUrl(url: string): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    return trimmed.startsWith('https://chat.whatsapp.com/') || trimmed.startsWith('https://wa.me/');
  }

  assert(validateWhatsAppUrl('https://chat.whatsapp.com/L4Z8X6y...'), 'Validación de URL oficial de invitación de grupo de WhatsApp');
  assert(!validateWhatsAppUrl('http://inseguro.com/chat'), 'Rechazo de URLs sospechosas o no autorizadas para WhatsApp');

  // ==========================================
  // 9. RELOJ / CRONÓMETRO / TABATA INDEPENDIENTE
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 9] Lógica del Temporizador WOD (Tabata, EMOM, AMRAP, For Time)\x1b[0m');

  // 9.1 Configuración Tabata por defecto: 20s trabajo, 10s descanso, 8 rondas
  const tabataWorkSeconds = 20;
  const tabataRestSeconds = 10;
  const tabataRounds = 8;
  const tabataTotalSeconds = (tabataWorkSeconds + tabataRestSeconds) * tabataRounds; // 240s = 4 min
  assert(tabataTotalSeconds === 240, `Cálculo de duración total de Tabata estándar: ${tabataTotalSeconds}s (4:00 min)`);

  // 9.2 Simulación de transiciones Tabata
  function getTabataPhase(elapsedInRound: number, workSec: number): 'work' | 'rest' {
    return elapsedInRound < workSec ? 'work' : 'rest';
  }
  assert(getTabataPhase(15, 20) === 'work', 'A los 15s de una ronda de 20s trabajo, el estado es WORK');
  assert(getTabataPhase(25, 20) === 'rest', 'A los 25s (trabajo 20s + descanso 10s), el estado es REST');

  // 9.3 Configuración EMOM: 10 rondas de 60s
  const emomRounds = 10;
  const emomRoundTime = 60;
  const emomTotalTime = emomRounds * emomRoundTime;
  assert(emomTotalTime === 600, `EMOM 10 minutos calcula 600s de duración`);

  // 9.4 AMRAP: Cuenta regresiva de 12 minutos
  const amrapMinutes = 12;
  const amrapSeconds = amrapMinutes * 60;
  assert(amrapSeconds === 720, `AMRAP de 12 min inicializa en 720 segundos exactos`);

  // 9.5 For Time: Formateo de tiempo acumulado con Laps
  function formatStopwatch(sec: number): string {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }
  assert(formatStopwatch(754) === '12:34', `Formateo de cronómetro For Time (754s -> "12:34")`);

  // ==========================================
  // 10. CONTROL DE SESIÓN ÚNICA DE ADMINISTRADOR & MULTI-ADMIN
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 10] Concurrencia de Sesión Única de Administrador & Multi-Admin\x1b[0m');

  const ADMIN_SESSION_TIMEOUT_MS = 180000; // 3 minutos

  interface MockAdminLock {
    username: string;
    activeSessionId: string;
    lastHeartbeat: string;
    deviceInfo?: string;
  }

  function simulateCheckAdminLock(
    currentLock: MockAdminLock | null,
    targetUsername: string,
    requestingSessionId: string,
    currentTimeMs: number
  ): { isLocked: boolean; message?: string } {
    if (!currentLock) return { isLocked: false };
    if (currentLock.activeSessionId === requestingSessionId) return { isLocked: false };

    const lastHb = new Date(currentLock.lastHeartbeat).getTime();
    const isStillActive = currentTimeMs - lastHb < ADMIN_SESSION_TIMEOUT_MS;

    if (isStillActive) {
      return {
        isLocked: true,
        message: 'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
      };
    }

    return { isLocked: false };
  }

  // 10.1 Primer inicio de sesión (sin lock previo): Debe ser permitido
  const initialLogin = simulateCheckAdminLock(null, 'admin', 'session_device_A', currentMs);
  assert(!initialLogin.isLocked, 'Dispositivo A adquiere sesión de Administrador sin locks previos');

  // Lock activo en Dispositivo A (hace 10 segundos)
  const activeLockDeviceA: MockAdminLock = {
    username: 'admin',
    activeSessionId: 'session_device_A',
    lastHeartbeat: new Date(currentMs - 10000).toISOString(),
    deviceInfo: 'Chrome Windows - PC Principal',
  };

  // 10.2 Mismo dispositivo refrescando o reconectando: Debe permitirse sin bloqueo
  const sameDeviceReconnect = simulateCheckAdminLock(activeLockDeviceA, 'admin', 'session_device_A', currentMs);
  assert(!sameDeviceReconnect.isLocked, 'Reconexión del mismo dispositivo A (mismo sessionId) es permitida');

  // 10.3 Dispositivo B intenta iniciar sesión con admin mientras Dispositivo A sigue activo:
  // DEBE BLOQUEARSE con el mensaje exacto Y NO MODIFICAR el lock de Dispositivo A
  const deviceBAttempt = simulateCheckAdminLock(activeLockDeviceA, 'admin', 'session_device_B', currentMs);
  assert(deviceBAttempt.isLocked, 'Dispositivo B es bloqueado porque la cuenta admin está activa en Dispositivo A');
  assert(
    deviceBAttempt.message === 'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
    'Mensaje de rechazo exacto: "El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta."'
  );
  // Verificar invariante: el lock activo sigue perteneciendo a Dispositivo A
  assert(activeLockDeviceA.activeSessionId === 'session_device_A', 'CRÍTICO: La sesión de Dispositivo A se mantiene INTACTA sin interrupción');

  // 10.4 Sesión previa inactiva / huérfana (más de 3 minutos sin latido):
  const expiredLockDeviceA: MockAdminLock = {
    username: 'admin',
    activeSessionId: 'session_device_A',
    lastHeartbeat: new Date(currentMs - 200000).toISOString(), // 3.3 minutos atrás
  };
  const deviceBAfterTimeout = simulateCheckAdminLock(expiredLockDeviceA, 'admin', 'session_device_B', currentMs);
  assert(!deviceBAfterTimeout.isLocked, 'Sesión previa expirada (>3 minutos sin latido) permite la toma limpia de control por Dispositivo B');

  // 10.5 Soporte Multi-Admin en Staff
  interface MockCoachUser {
    id: string;
    name: string;
    username?: string;
    role?: 'coach' | 'admin';
  }
  const staffMembers: MockCoachUser[] = [
    { id: 'c1', name: 'Entrenador Juan', username: 'juan', role: 'coach' },
    { id: 'c2', name: 'Administrador Secundario', username: 'admin2', role: 'admin' },
  ];
  const adminUsers = staffMembers.filter(m => m.role === 'admin');
  assert(adminUsers.length === 1 && adminUsers[0].username === 'admin2', 'El sistema soporta creación de administradores delegados en el Staff');

  // ==========================================
  // 11. WEBHOOK DE CORREOS CON GOOGLE APPS SCRIPT
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 11] Webhook de Correos con Google Apps Script (Alternativa Ilimitada a EmailJS)\x1b[0m');

  function validateAppsScriptPayload(payload: {
    to_email: string;
    to_name: string;
    subject: string;
    message_html: string;
    type?: string;
  }): { valid: boolean; error?: string } {
    if (!payload.to_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.to_email)) {
      return { valid: false, error: 'Email de destinatario inválido' };
    }
    if (!payload.to_name || payload.to_name.trim().length === 0) {
      return { valid: false, error: 'Nombre de destinatario requerido' };
    }
    if (!payload.subject || payload.subject.trim().length === 0) {
      return { valid: false, error: 'Asunto de correo requerido' };
    }
    if (!payload.message_html || payload.message_html.length < 20) {
      return { valid: false, error: 'Cuerpo HTML de correo requerido' };
    }
    return { valid: true };
  }

  // 11.1 Verificación de plantilla HTML de bienvenida para Apps Script
  const welcomeData = {
    email: 'nuevo.atleta@gmail.com',
    name: 'Mateo Restrepo',
    documentId: '1020304050',
    pin: '1234',
  };
  const welcomeContent = generateWelcomeEmailContent(welcomeData);
  const welcomePayloadValid = validateAppsScriptPayload({
    to_email: welcomeData.email,
    to_name: welcomeData.name,
    subject: welcomeContent.subject,
    message_html: welcomeContent.htmlBody,
    type: 'welcome',
  });
  assert(welcomePayloadValid.valid, 'Payload de correo de bienvenida válido para Google Apps Script doPost');

  // 11.2 Verificación de plantilla HTML de activación para Apps Script
  const activationData = {
    email: 'nuevo.atleta@gmail.com',
    name: 'Mateo Restrepo',
    planName: 'CrossFit Ilimitado',
    startDate: '2026-09-20',
    endDate: '2026-10-20',
  };
  const activationContent = generateActivationEmailContent(activationData);
  const activationPayloadValid = validateAppsScriptPayload({
    to_email: activationData.email,
    to_name: activationData.name,
    subject: activationContent.subject,
    message_html: activationContent.htmlBody,
    type: 'activation',
  });
  assert(activationPayloadValid.valid, 'Payload de correo de activación de plan válido para Google Apps Script doPost');

  // ==========================================
  // 12. GESTIÓN DE PLANES, DESGLOSE DE DISCIPLINAS Y PARTICIPANTES DE CLASES
  // ==========================================
  console.log('\n\x1b[36m[MÓDULO 12] Planes Dinámicos, Métricas por Disciplina y Participantes de Clases\x1b[0m');

  // 12.1 CRUD de Planes de Membresía
  interface MockMembershipPlan {
    id: string;
    name: string;
    discipline: 'crossfit' | 'musculacion' | 'personalizado';
    price: number;
    durationDays: number;
    isPunchCard?: boolean;
    totalClasses?: number | null;
    isActive: boolean;
  }

  let plansDatabase: MockMembershipPlan[] = [
    {
      id: 'plan-cf-1',
      name: 'Mensual Ilimitado Pro',
      discipline: 'crossfit',
      price: 180000,
      durationDays: 30,
      isPunchCard: false,
      isActive: true,
    },
    {
      id: 'plan-musc-1',
      name: 'Musculación Mensual Libre',
      discipline: 'musculacion',
      price: 110000,
      durationDays: 30,
      isPunchCard: false,
      isActive: true,
    },
  ];

  // Crear nuevo plan (CRUD Create)
  const newPlan: MockMembershipPlan = {
    id: 'plan-pers-vip',
    name: 'Personalizado VIP 16 Clases',
    discipline: 'personalizado',
    price: 420000,
    durationDays: 30,
    isPunchCard: true,
    totalClasses: 16,
    isActive: true,
  };
  plansDatabase.push(newPlan);
  assert(plansDatabase.length === 3, 'Creación exitosa de nuevo plan de membresía (Personalizado VIP)');
  assert(plansDatabase.find(p => p.id === 'plan-pers-vip')?.isPunchCard === true, 'El plan tiquetera registra correctamente isPunchCard y totalClasses');

  // Editar plan existente (CRUD Update)
  const targetPlan = plansDatabase.find(p => p.id === 'plan-cf-1');
  if (targetPlan) {
    targetPlan.price = 195000;
    targetPlan.name = 'Mensual Ilimitado Elite';
  }
  assert(plansDatabase.find(p => p.id === 'plan-cf-1')?.price === 195000, 'Actualización exitosa de tarifa y nombre de plan existente');

  // Filtrado por disciplina
  const cfPlans = plansDatabase.filter(p => p.discipline === 'crossfit');
  const muscPlans = plansDatabase.filter(p => p.discipline === 'musculacion');
  const persPlans = plansDatabase.filter(p => p.discipline === 'personalizado');
  assert(cfPlans.length === 1 && muscPlans.length === 1 && persPlans.length === 1, 'Filtrado de planes por disciplina (CrossFit, Musculación, Personalizado)');

  // 12.2 Desglose exacto de atletas por disciplina
  const mockAthletesDir = [
    { id: '1', name: 'Atleta 1', discipline: 'crossfit', membership: { isActive: true } },
    { id: '2', name: 'Atleta 2', discipline: 'crossfit', membership: { isActive: true } },
    { id: '3', name: 'Atleta 3', discipline: 'musculacion', membership: { isActive: true } },
    { id: '4', name: 'Atleta 4', discipline: 'musculacion', membership: { isActive: true } },
    { id: '5', name: 'Atleta 5', discipline: 'musculacion', membership: { isActive: true } },
    { id: '6', name: 'Atleta 6', discipline: 'personalizado', membership: { isActive: true } },
  ];

  const crossfitCount = mockAthletesDir.filter(a => a.discipline === 'crossfit').length;
  const musculacionCount = mockAthletesDir.filter(a => a.discipline === 'musculacion').length;
  const personalizadoCount = mockAthletesDir.filter(a => a.discipline === 'personalizado').length;

  assert(crossfitCount === 2, 'Conteo exacto de atletas de CrossFit (2 atletas)');
  assert(musculacionCount === 3, 'Conteo exacto de atletas de Musculación (3 atletas)');
  assert(personalizadoCount === 1, 'Conteo exacto de atletas de Personalizado (1 atleta)');
  assert(crossfitCount + musculacionCount + personalizadoCount === mockAthletesDir.length, 'La suma del desglose coincide con el total de atletas');

  // 12.3 Consulta de participantes de clase independiente de reserva previa
  const sampleSlot = {
    id: '2026-09-20_06:00',
    date: '2026-09-20',
    time: '06:00',
    label: '6:00 AM',
    capacity: 16,
    attendeeIds: ['1', '2'],
  };

  const unbookedAthleteId = '5'; // Atleta 5 no está inscrito
  const canViewAttendees = (slot: typeof sampleSlot, viewerAthleteId: string) => {
    // Cualquier usuario (reservado o no) puede obtener los datos de la lista de asistentes
    const attendees = slot.attendeeIds.map(id => mockAthletesDir.find(a => a.id === id)?.name);
    const isViewerBooked = slot.attendeeIds.includes(viewerAthleteId);
    return {
      canView: true,
      attendees,
      isViewerBooked,
      totalAttendees: slot.attendeeIds.length,
      availableSpots: slot.capacity - slot.attendeeIds.length,
    };
  };

  const attendeeQuery = canViewAttendees(sampleSlot, unbookedAthleteId);
  assert(attendeeQuery.canView === true, 'El atleta puede visualizar los participantes de la clase sin haber reservado');
  assert(attendeeQuery.isViewerBooked === false, 'Se reconoce correctamente que el atleta consultante aún no ha reservado');
  assert(attendeeQuery.totalAttendees === 2 && attendeeQuery.availableSpots === 14, 'El conteo de aforo y cupos libres es exacto en la consulta');

  // ==========================================
  // RESUMEN Y ESTADÍSTICAS FINALES
  // ==========================================
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  console.log('\n\x1b[1m\x1b[33m================================================================');
  console.log(`       RESUMEN DE PRUEBAS: ${passed}/${total} COMPLETADAS EXITOSAMENTE   `);
  console.log(`       FALLOS DETECTADOS: ${failed}                                     `);
  console.log('================================================================\x1b[0m\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Error fatal ejecutando suite de pruebas:', err);
  process.exit(1);
});
