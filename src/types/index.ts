export type UserRole = 'athlete' | 'coach' | 'admin';

export type AthleteDiscipline = 'crossfit' | 'musculacion' | 'personalizado';

export type WODType = 'FOR_TIME' | 'AMRAP' | 'EMOM' | 'TABATA' | 'STRENGTH' | 'CUSTOM';

export type WeightUnit = 'kg' | 'lbs';

export interface AthleteEmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface AthleteProfile {
  id: string;
  documentId: string; // Número de identificación / Cédula / DNI
  pin?: string; // Código PIN de 4 dígitos para autenticación personal
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  discipline?: AthleteDiscipline; // 'crossfit' | 'musculacion' | 'personalizado'
  // Campos demográficos y de salud
  gender?: 'masculino' | 'femenino' | 'otro';
  birthDate?: string; // YYYY-MM-DD
  address?: string;
  eps?: string;
  emergencyContact?: AthleteEmergencyContact;
  acceptedTerms?: boolean;
  termsAcceptedAt?: string;
  membership: {
    planName: string; // e.g. "Mensual Ilimitado", "Mensual Solo Musculación", "Entrenamiento Personalizado"
    discipline?: AthleteDiscipline;
    totalClasses?: number | null; // for punch card
    remainingClasses?: number | null;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    isActive: boolean;
    isPendingApproval?: boolean;
  };
}

export interface WODSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  title: string; // e.g. "FRAN", "METCON THURSDAY", "CHIPPER DEL BOX"
  wodType: WODType;
  timeCapMinutes?: number;
  warmup: string; // Calentamiento
  strengthSkill?: string; // Trabajo de fuerza o habilidad técnica
  metcon: string; // El WOD en sí
  scalingNotes?: string; // Opciones Rx vs Scaled
  coachNotes?: string; // Recomendaciones del coach
  specialConsiderations?: string; // Consideraciones especiales o equipo requerido (visible aun cuando el WOD esté bloqueado)
  createdByCoachId: string;
  createdAt: string;
}

export interface ClassSlot {
  id: string; // e.g. "2026-09-17_06:00"
  date: string; // YYYY-MM-DD
  time: string; // "05:00", "06:00", etc.
  label: string; // "5:00 AM"
  coachName: string;
  capacity: number; // Cupos máximos
  isEnabled: boolean; // Si la franja está abierta
  attendeeIds: string[]; // List of athleteIds booked
}

export interface BookingRecord {
  id: string;
  slotId: string;
  date: string;
  time: string;
  athleteId: string;
  athleteName: string;
  bookedAt: string;
  checkedIn: boolean; // Asistencia marcada por el coach
}

export interface PersonalRecord {
  id: string;
  athleteId: string;
  exerciseName: string;
  category: 'olympic' | 'powerlifting' | 'gymnastic' | 'bodybuilding' | 'other';
  weight: number; // In selected unit
  unit: WeightUnit;
  reps: number; // 1 for 1RM, or 3RM, 5RM
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface WODResultLog {
  id: string;
  athleteId: string;
  athleteName: string;
  wodDate: string; // YYYY-MM-DD
  wodTitle: string;
  wodType: WODType;
  division: 'RX' | 'SCALED';
  resultValue: string; // e.g. "12:45" (time) or "5 rounds + 14 reps" or "95 kg"
  rounds?: number;
  reps?: number;
  timeSeconds?: number;
  loadWeight?: number;
  notes?: string;
  loggedAt: string;
}

export interface GymStats {
  totalAthletes: number;
  activeBookingsToday: number;
  occupancyRate: number;
}

export interface ActivityLogRecord {
  id: string;
  timestamp: string; // ISO 8601
  category: 'SECURITY' | 'ATHLETE' | 'MEMBERSHIP' | 'BOOKING' | 'WOD' | 'ADMIN';
  action: string;
  description: string;
  actor: string;
  target?: string;
  details?: Record<string, any>;
}

export interface CoachUser {
  id: string;
  name: string;
  username: string; // ej: 'coach' o 'coach.carlos'
  email: string;
  password: string; // Contraseña robusta
  role?: 'coach' | 'admin'; // Rol del miembro de staff ('coach' o 'admin')
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCredentials {
  username: string;
  email: string;
  password: string;
  updatedAt: string;
}

export interface AdminSessionLock {
  username: string;
  activeSessionId: string;
  lastHeartbeat: string; // ISO 8601
  userAgent?: string;
  deviceInfo?: string;
}

export interface GymFlyer {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  tag?: 'EVENTO' | 'AVISO' | 'TORNEO' | 'PROMO' | 'HORARIO' | 'COMUNIDAD';
  date?: string;
  isActive: boolean;
  isPinned?: boolean;
  createdAt: string;
}

export interface AnthropometricMeasurement {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  weightKg?: number;
  heightCm?: number;
  bodyFatPercent?: number; // % grasa corporal estimada
  muscleMassKg?: number; // kg masa muscular estimada
  visceralFat?: number;
  chestCm?: number; // Pecho / Tórax
  waistCm?: number; // Cintura
  abdomenCm?: number; // Abdomen (a la altura del ombligo)
  hipsCm?: number; // Cadera / Glúteos
  armRelaxedCm?: number; // Brazo relajado
  armFlexedCm?: number; // Brazo contraído
  thighCm?: number; // Muslo medio
  calfCm?: number; // Pantorrilla
  notes?: string;
  evaluatorName?: string; // Coach o Admin que tomó las medidas
  createdAt: string;
}

export type ProgressPhotoPose = 'frente' | 'perfil' | 'espalda' | 'libre';

export interface ProgressPhoto {
  id: string;
  athleteId: string;
  date: string; // YYYY-MM-DD
  imageUrl: string; // Base64 comprimido o URL de imagen
  pose: ProgressPhotoPose;
  weightKg?: number; // Peso corporal de referencia opcional
  notes?: string;
  evaluatorName?: string; // Nombre de quien la subió (Atleta, Coach o Admin)
  createdAt: string;
}

export interface CustomExercise {
  id: string;
  name: string;
  category: 'olympic' | 'powerlifting' | 'gymnastic' | 'bodybuilding' | 'other';
  createdBy?: string;
  createdAt?: string;
}

export interface GymSettings {
  whatsappGroupUrl?: string;
  oneSignalRestApiKey?: string;
  oneSignalAppId?: string;
  // Modo Mantenimiento
  isMaintenanceMode?: boolean;
  maintenanceMessage?: string;
  // Contabilidad y Google Sheets
  googleSheetsAccountingWebhookUrl?: string;
  // Medios de pago Colombia
  nequiNumber?: string;
  daviplataNumber?: string;
  bancolombiaAccount?: string;
  brebKey?: string;
  paymentInstructions?: string;
  wompiPublicKey?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'efectivo' | 'nequi' | 'daviplata' | 'pse' | 'wompi' | 'tarjeta' | 'breb' | 'transferencia' | 'otro';

export type TransactionType = 'membership_new' | 'membership_renewal' | 'manual_income' | 'manual_expense';

export interface AccountingTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO 8601
  athleteId?: string;
  athleteName: string;
  athleteDocumentId?: string;
  planName?: string;
  discipline?: AthleteDiscipline;
  amount: number; // Monto en COP
  paymentMethod: PaymentMethod;
  type: TransactionType;
  approvedBy: string; // Admin o Coach que registró
  notes?: string;
  syncedToGoogleSheets?: boolean;
}

export interface TurnstileAccessLog {
  id: string;
  timestamp: string; // ISO 8601
  athleteId?: string;
  athleteName: string;
  documentId?: string;
  accessType: 'athlete_self' | 'admin_manual' | 'guest';
  status: 'granted' | 'denied';
  planName?: string;
  reason?: string;
  remainingClasses?: number | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  discipline: AthleteDiscipline;
  price: number;
  durationDays: number;
  isPunchCard?: boolean;
  totalClasses?: number | null;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}
