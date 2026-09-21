import { AthleteProfile, ClassSlot, PersonalRecord, WODResultLog, WODSchedule, GymFlyer } from '../types';

export const DEFAULT_EXERCISES = [
  // Halterofilia / CrossFit
  { name: 'Clean & Jerk', category: 'olympic' },
  { name: 'Squat Clean', category: 'olympic' },
  { name: 'Power Clean', category: 'olympic' },
  { name: 'Split Jerk', category: 'olympic' },
  { name: 'Push Jerk', category: 'olympic' },
  { name: 'Snatch', category: 'olympic' },
  { name: 'Power Snatch', category: 'olympic' },
  { name: 'Squat Snatch', category: 'olympic' },
  { name: 'Overhead Squat', category: 'olympic' },
  { name: 'Thruster', category: 'olympic' },

  // Powerlifting & Fuerza Básica
  { name: 'Back Squat (Sentadilla Trasera)', category: 'powerlifting' },
  { name: 'Front Squat (Sentadilla Frontal)', category: 'powerlifting' },
  { name: 'Deadlift (Peso Muerto)', category: 'powerlifting' },
  { name: 'Bench Press (Press de Banca Plano)', category: 'powerlifting' },
  { name: 'Strict Press (Press Militar)', category: 'powerlifting' },
  { name: 'Push Press', category: 'powerlifting' },

  // Musculación & Gimnasio
  { name: 'Incline Bench Press (Press Inclinado)', category: 'bodybuilding' },
  { name: 'Leg Press (Prensa Inclinada 45°)', category: 'bodybuilding' },
  { name: 'Hack Squat (Sentadilla Hack)', category: 'bodybuilding' },
  { name: 'Hip Thrust (Empuje de Cadera)', category: 'bodybuilding' },
  { name: 'Barbell Row (Remo con Barra)', category: 'bodybuilding' },
  { name: 'Lat Pulldown (Jalón al Pecho)', category: 'bodybuilding' },
  { name: 'Barbell Bicep Curl (Curl de Bíceps)', category: 'bodybuilding' },
  { name: 'Dips / Fondos con Lastre', category: 'bodybuilding' },
] as const;

export const DEFAULT_TIME_SLOTS = [
  { time: '05:00', label: '5:00 AM', defaultCapacity: 15 },
  { time: '06:00', label: '6:00 AM', defaultCapacity: 15 },
  { time: '07:00', label: '7:00 AM', defaultCapacity: 15 },
  { time: '08:00', label: '8:00 AM', defaultCapacity: 15 },
  { time: '09:00', label: '9:00 AM', defaultCapacity: 15 },
  { time: '16:00', label: '4:00 PM', defaultCapacity: 15 },
  { time: '17:00', label: '5:00 PM', defaultCapacity: 15 },
  { time: '18:00', label: '6:00 PM', defaultCapacity: 15 },
  { time: '19:00', label: '7:00 PM', defaultCapacity: 15 },
];

export const INITIAL_ATHLETES: AthleteProfile[] = [];

// Helper to get formatted ISO dates around today (2026-09-17)
export const getFormattedDate = (offsetDays: number = 0): string => {
  const base = new Date();
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().split('T')[0];
};

export const INITIAL_WODS: WODSchedule[] = [
  {
    id: 'wod-today',
    date: getFormattedDate(0), // Today
    title: 'THE BULL STRENGTH & CHIPPER',
    wodType: 'FOR_TIME',
    timeCapMinutes: 18,
    warmup: `3 Rondas fluidas sin prisa:
- 200m Remo o Trote
- 10 Inchworms con flexión de pecho
- 12 Scapular pull-ups
- 15 Air squats con pausa de 2 segundos en el fondo
- Movilidad articular activa de tobillos y muñecas`,
    strengthSkill: `CLEAN & JERK WAVE LOADING:
- Set 1: 5 reps al 65% de tu RM
- Set 2: 4 reps al 75% de tu RM
- Set 3: 3 reps al 82% de tu RM
- Set 4: 2 reps al 88% de tu RM
- Set 5: 1 rep al 93% de tu RM
*Descanso de 2:00 min entre cada serie. Enfoque en triple extensión agresiva.*`,
    metcon: `FOR TIME (Time Cap: 18:00 min):
50 Wall Ball Shots (20/14 lbs)
40 Box Jumps Over (24/20 in)
30 Toes-to-Bar
20 Power Cleans (135/95 lbs - 61/43 kg)
10 Bar Muscle-Ups (o 15 Chest-to-Bar Pull-ups)`,
    scalingNotes: `RX: Pesos y alturas oficiales indicadas.
SCALED:
- Wall Ball con balón de 14/10 lbs a 9 pies
- Box Step-overs permitidos
- Hanging Knee Raises en vez de T2B
- Power Clean con 95/65 lbs (43/30 kg)
- Pull-ups con banda elástica o Jumping Chest-to-Bar`,
    coachNotes: `Regula el ritmo en los Wall Balls iniciales, no quemes las piernas antes de los Power Cleans. Mantén la espalda neutral al levantar la barra del piso. ¡Hidrátate antes de entrar a la franja!`,
    createdByCoachId: 'coach-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wod-tomorrow',
    date: getFormattedDate(1), // Tomorrow
    title: 'INDOMABLE ENDURANCE: AMRAP 20',
    wodType: 'AMRAP',
    timeCapMinutes: 20,
    warmup: `Calentamiento dinámico de hombros:
- Crossover Symmetry / Banded pull-aparts 20 reps
- 30 jumping jacks
- 10 push-ups escapulares
- 8 Cossack squats por lado`,
    strengthSkill: `SNATCH COMPLEX (Every 90s for 6 sets):
1 Power Snatch + 1 Overhead Squat + 1 Hang Squat Snatch al 70-75% de 1RM Snatch.`,
    metcon: `AMRAP 20 MINUTES:
- 15 Calorie Echo Bike (o Remo)
- 12 Dumbbell Snatches alternados (50/35 lbs)
- 9 Burpees over the bar
- 6 Handstand Push-Ups (o Pike Push-ups)`,
    scalingNotes: `SCALED: Mancuerna de 35/20 lbs, Burpees stepping down/up, Push-ups en cajón o Pike push-ups en piso.`,
    coachNotes: `Pacing clave: Este WOD se gana en la consistencia de cada ronda. No sprintes la Echo Bike en la ronda 1.`,
    specialConsiderations: `Traer medias largas o canilleras protectoras para la sesión de hoy y cinturón lumbar para levantamientos.`,
    createdByCoachId: 'coach-1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wod-yesterday',
    date: getFormattedDate(-1),
    title: 'HEAVY FRONT SQUAT & SPRINT',
    wodType: 'STRENGTH',
    timeCapMinutes: 25,
    warmup: `3 rondas: 10 goblet squats, 10 good mornings con PVC, 20 segundos hollow hold.`,
    strengthSkill: `FRONT SQUAT:
5 x 3 reps al 85% de tu RM. Pausa de 1 seg en el fondo.`,
    metcon: `3 RONDAS POR TIEMPO:
400m Run
15 Thrusters (95/65 lbs)
12 Pull-ups`,
    scalingNotes: `Thrusters con 75/55 lbs o Dumbbells de 25 lbs. Ring rows para pull-ups.`,
    coachNotes: `Intensidad alta en las 3 rondas. Descanso activo al terminar.`,
    createdByCoachId: 'coach-1',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_RMS: PersonalRecord[] = [];

export const INITIAL_WOD_LOGS: WODResultLog[] = [];

// Generate initial slots for current week
export const generateDefaultSlotsForDate = (dateStr: string): ClassSlot[] => {
  return DEFAULT_TIME_SLOTS.map((slot) => {
    return {
      id: `${dateStr}_${slot.time}`,
      date: dateStr,
      time: slot.time,
      label: slot.label,
      coachName: parseInt(slot.time.split(':')[0], 10) < 12 ? 'Coach Camilo' : 'Coach Sofía',
      capacity: slot.defaultCapacity,
      isEnabled: true,
      attendeeIds: [],
    };
  });
};

export const INITIAL_FLYERS: GymFlyer[] = [
  {
    id: 'flyer-1',
    title: 'TORNEO INTERNO INDOMABLE BATTLE 2026',
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    description: '¡Inscripciones abiertas! Categorías Principiante, Scaled y Rx. Premios en efectivo y suplementación. Pregunta en recepción por tu cupo.',
    tag: 'TORNEO',
    date: '2026-10-15',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'flyer-2',
    title: 'NUEVA ZONA DE MUSCULACIÓN & PESO LIBRE',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    description: 'Hemos ampliado el área de máquinas y mancuernas. Nuevas bancas olímpicas, prensas y estaciones de poleas para tus entrenamientos hipertróficos.',
    tag: 'AVISO',
    date: '2026-09-25',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'flyer-3',
    title: 'EVALUACIONES ANTROPOMÉTRICAS MENSUALES',
    imageUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=80',
    description: 'Para todos los miembros de Entrenamiento Personalizado: agenda tu control de pliegues, % de grasa y masa muscular con tu coach asignado.',
    tag: 'EVENTO',
    date: '2026-09-30',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_MEMBERSHIP_PLANS: import('../types').MembershipPlan[] = [
  // CrossFit
  {
    id: 'plan-cf-monthly',
    name: 'Mensual Ilimitado Pro',
    discipline: 'crossfit',
    price: 180000,
    durationDays: 30,
    isPunchCard: false,
    description: 'Acceso ilimitado a todas las clases de CrossFit del mes y open box.',
    isActive: true,
  },
  {
    id: 'plan-cf-trimestral',
    name: 'Trimestral Ilimitado',
    discipline: 'crossfit',
    price: 490000,
    durationDays: 90,
    isPunchCard: false,
    description: '3 meses ilimitados de entrenamiento de alto rendimiento.',
    isActive: true,
  },
  {
    id: 'plan-cf-semestral',
    name: 'Semestral Indomable',
    discipline: 'crossfit',
    price: 920000,
    durationDays: 180,
    isPunchCard: false,
    description: '6 meses de membresía continua al mejor precio por mes.',
    isActive: true,
  },
  {
    id: 'plan-cf-punch12',
    name: 'Tiquetera 12 Clases',
    discipline: 'crossfit',
    price: 150000,
    durationDays: 45,
    isPunchCard: true,
    totalClasses: 12,
    description: '12 clases para usar a tu propio ritmo durante 45 días.',
    isActive: true,
  },
  {
    id: 'plan-cf-punch16',
    name: 'Tiquetera 16 Clases',
    discipline: 'crossfit',
    price: 170000,
    durationDays: 45,
    isPunchCard: true,
    totalClasses: 16,
    description: '16 clases flexibles para deportistas con horarios rotativos.',
    isActive: true,
  },
  {
    id: 'plan-cf-punch24',
    name: 'Tiquetera 24 Clases',
    discipline: 'crossfit',
    price: 220000,
    durationDays: 60,
    isPunchCard: true,
    totalClasses: 24,
    description: '24 clases con 60 días de vigencia.',
    isActive: true,
  },
  {
    id: 'plan-cf-daily',
    name: 'Pase Diario CrossFit',
    discipline: 'crossfit',
    price: 25000,
    durationDays: 1,
    isPunchCard: true,
    totalClasses: 1,
    description: 'Acceso para 1 sesión de clase del día.',
    isActive: true,
  },

  // Musculación
  {
    id: 'plan-musc-monthly',
    name: 'Musculación Mensual Libre',
    discipline: 'musculacion',
    price: 120000,
    durationDays: 30,
    isPunchCard: false,
    description: 'Acceso libre a la zona de máquinas, peso libre y cardio todo el mes.',
    isActive: true,
  },
  {
    id: 'plan-musc-trimestral',
    name: 'Musculación Trimestral',
    discipline: 'musculacion',
    price: 320000,
    durationDays: 90,
    isPunchCard: false,
    description: '3 meses de entrenamiento en zona de musculación y fuerza.',
    isActive: true,
  },
  {
    id: 'plan-musc-semestral',
    name: 'Musculación Semestral',
    discipline: 'musculacion',
    price: 590000,
    durationDays: 180,
    isPunchCard: false,
    description: '6 meses de musculación libre.',
    isActive: true,
  },
  {
    id: 'plan-musc-anual',
    name: 'Musculación Anual',
    discipline: 'musculacion',
    price: 1050000,
    durationDays: 365,
    isPunchCard: false,
    description: '1 año completo de entrenamiento al mejor valor.',
    isActive: true,
  },
  {
    id: 'plan-musc-daily',
    name: 'Musculación Pase Diario',
    discipline: 'musculacion',
    price: 15000,
    durationDays: 1,
    isPunchCard: false,
    description: 'Pase de 1 día libre para zona de musculación.',
    isActive: true,
  },

  // Personalizado
  {
    id: 'plan-pers-12',
    name: 'Personalizado 12 Sesiones',
    discipline: 'personalizado',
    price: 350000,
    durationDays: 30,
    isPunchCard: true,
    totalClasses: 12,
    description: 'Entrenamiento 1 a 1 con coach asignado y seguimiento nutricional.',
    isActive: true,
  },
  {
    id: 'plan-pers-16',
    name: 'Personalizado 16 Sesiones',
    discipline: 'personalizado',
    price: 420000,
    durationDays: 30,
    isPunchCard: true,
    totalClasses: 16,
    description: '16 sesiones personalizadas por mes con valoración antropométrica.',
    isActive: true,
  },
  {
    id: 'plan-pers-vip',
    name: 'Personalizado Ilimitado VIP',
    discipline: 'personalizado',
    price: 550000,
    durationDays: 30,
    isPunchCard: false,
    description: 'Acompañamiento VIP diario ilimitado.',
    isActive: true,
  },
  {
    id: 'plan-pers-daily',
    name: 'Sesión Personalizada Individual',
    discipline: 'personalizado',
    price: 40000,
    durationDays: 1,
    isPunchCard: true,
    totalClasses: 1,
    description: '1 sesión guiada exclusiva.',
    isActive: true,
  },
];
