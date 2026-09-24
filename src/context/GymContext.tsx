import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  AthleteProfile,
  ClassSlot,
  PersonalRecord,
  UserRole,
  WeightUnit,
  WODResultLog,
  WODSchedule,
  ActivityLogRecord,
  CoachUser,
  AdminCredentials,
  AthleteDiscipline,
  GymFlyer,
  AnthropometricMeasurement,
  ProgressPhoto,
  CustomExercise,
  GymSettings,
  MembershipPlan,
  AccountingTransaction,
} from '../types';
import {
  subscribeTransactionsLive,
  saveTransactionInFirestore,
  deleteTransactionInFirestore,
  sendTransactionToGoogleSheets,
} from '../services/accountingService';
import {
  generateDefaultSlotsForDate,
  getFormattedDate,
  INITIAL_ATHLETES,
  INITIAL_RMS,
  INITIAL_WOD_LOGS,
  INITIAL_WODS,
  DEFAULT_TIME_SLOTS,
  INITIAL_FLYERS,
  DEFAULT_MEMBERSHIP_PLANS,
} from '../data/seedData';
import {
  sendWelcomeRegistrationEmail,
  sendMembershipActivatedEmail,
} from '../services/emailService';
import { isFirebaseConfigured } from '../services/firebase';
import {
  subscribeAthletesLive,
  subscribeSlotsLive,
  subscribeWodsLive,
  subscribeRMsLive,
  subscribeWodLogsLive,
  subscribeCoachPinLive,
  subscribeActivityLogsLive,
  subscribeCoachesLive,
  syncSaveCoachUser,
  syncDeleteCoachUser,
  subscribeAdminCredentialsLive,
  syncSaveAdminCredentials,
  findAthleteByDocumentIdInFirestore,
  syncSaveAthlete,
  syncUpdateAthlete,
  syncDeleteAthlete,
  syncSaveSlot,
  syncBookSlot,
  syncCancelBooking,
  syncUpdateSlot,
  syncSaveWod,
  syncSaveRM,
  syncDeleteRM,
  syncSaveWodLog,
  syncDeleteWodLog,
  syncSaveCoachPin,
  syncSaveActivityLog,
  syncClearActivityLogs,
  syncPurgeActivityLogs,
  seedFirestoreIfEmpty,
  subscribeFlyersLive,
  syncSaveFlyer,
  syncDeleteFlyer,
  subscribeAnthropometryLive,
  syncSaveAnthropometry,
  syncDeleteAnthropometry,
  subscribeProgressPhotosLive,
  syncSaveProgressPhoto,
  syncDeleteProgressPhoto,
  subscribeCustomExercisesLive,
  syncSaveCustomExercise,
  subscribeGymSettingsLive,
  syncSaveGymSettings,
  acquireAdminSessionLock,
  heartbeatAdminSessionLock,
  releaseAdminSessionLock,
  checkAdminSessionLock,
  subscribeMembershipPlansLive,
  syncSaveMembershipPlan,
  syncDeleteMembershipPlan,
  seedMembershipPlansIfEmpty,
} from '../services/firestoreService';
import {
  notifyNewAnnouncement,
  dispatchInAppAlert,
  playNotificationSound,
  markFlyersAsSeen,
  calculateMembershipDaysRemaining,
  notifyMembershipExpiring,
} from '../utils/notificationUtils';
import { sendOneSignalPushNotification, logoutOneSignal } from '../services/oneSignalService';

interface GymContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentAthleteId: string;
  setCurrentAthleteId: (id: string) => void;
  currentAthlete: AthleteProfile | null;
  athletes: AthleteProfile[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  // Authentication & Access
  isAuthenticated: boolean;
  coachPin: string;
  updateCoachPin: (currentPin: string, newPin: string) => { success: boolean; message: string };
  refreshCurrentAthlete: () => Promise<AthleteProfile | null>;
  loginWithDocumentId: (docId: string, pin: string) => Promise<{ success: boolean; message: string; athlete?: AthleteProfile }>;
  loginAsCoachWithPin: (pin: string) => { success: boolean; message: string };
  
  // Robust Staff Authentication & Coach Management
  currentCoachId: string | null;
  currentCoach: CoachUser | null;
  coaches: CoachUser[];
  adminCredentials: AdminCredentials | null;
  loginAsCoach: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string; coach?: CoachUser }>;
  loginAsAdmin: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginAsTestUser: () => { success: boolean; message: string; athlete?: AthleteProfile };
  isPaymentModalOpen: boolean;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  updateAdminPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  adminActiveUsername?: string | null;
  forceReleaseAdminSession: (username: string) => Promise<{ success: boolean; message: string }>;
  addCoach: (data: Omit<CoachUser, 'id' | 'createdAt'>) => Promise<{ success: boolean; message: string; coach?: CoachUser }>;
  updateCoach: (id: string, updates: Partial<CoachUser>) => Promise<{ success: boolean; message: string }>;
  deleteCoach: (id: string) => Promise<{ success: boolean; message: string }>;

  registerAthlete: (data: {
    documentId: string;
    name: string;
    pin: string;
    email: string;
    phone?: string;
    planName?: string;
    discipline?: AthleteDiscipline;
    avatar?: string;
    gender?: 'masculino' | 'femenino' | 'otro';
    birthDate?: string;
    address?: string;
    eps?: string;
    emergencyContact?: { name: string; phone: string; relationship?: string };
    acceptedTerms?: boolean;
  }) => { success: boolean; message: string; athlete?: AthleteProfile };
  resetAthletePin: (athleteId: string, newPin?: string) => string;
  logout: () => void;
  
  // WODs
  wods: WODSchedule[];
  currentWod: WODSchedule | undefined;
  saveWod: (wod: WODSchedule) => void;
  
  // Athletes & User Management
  addAthlete: (athlete: Omit<AthleteProfile, 'id'>) => AthleteProfile;
  updateAthlete: (id: string, updates: Partial<AthleteProfile>) => void;
  deleteAthlete: (id: string) => Promise<void>;
  renewAthleteMembership: (
    id: string,
    planName: string,
    durationDays: number,
    classesCount?: number,
    discipline?: AthleteDiscipline,
    customStartDate?: string
  ) => Promise<{ success: boolean; message: string; emailResult?: { success: boolean; message: string } }>;
  approveAthleteMembership: (
    id: string,
    planName: string,
    durationDays: number,
    classesCount?: number,
    discipline?: AthleteDiscipline,
    customStartDate?: string
  ) => Promise<{ success: boolean; message: string; emailResult?: { success: boolean; message: string } }>;

  // Classes & Bookings
  slots: ClassSlot[];
  slotsForSelectedDate: ClassSlot[];
  bookSlot: (slotId: string, athleteId?: string) => { success: boolean; message: string };
  cancelBooking: (slotId: string, athleteId?: string) => { success: boolean; message: string };
  toggleSlotEnabled: (slotId: string) => void;
  updateSlotCapacity: (slotId: string, newCapacity: number) => void;
  markAttendance: (slotId: string, athleteId: string, attended: boolean) => void;
  generateWeekSchedule: (weekStartDate: string) => void;
  addNewSlot: (date: string, time: string, label: string, capacity: number, coachName: string) => void;
  
  // Personal Records (RM)
  rms: PersonalRecord[];
  activeUnit: WeightUnit;
  setActiveUnit: (unit: WeightUnit) => void;
  saveRM: (record: Omit<PersonalRecord, 'id'> & { id?: string }) => void;
  deleteRM: (id: string) => void;
  
  // WOD Result Logs
  wodLogs: WODResultLog[];
  saveWodLog: (log: Omit<WODResultLog, 'id' | 'loggedAt'> & { id?: string }) => void;
  deleteWodLog: (id: string) => void;
  
  // Activity Logs / Auditoría
  activityLogs: ActivityLogRecord[];
  addActivityLog: (record: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }) => void;
  clearActivityLogs: () => void;
  purgeActivityLogs: (range: 'day' | 'week' | 'month' | 'all') => void;
  // Discipline & Access Roles
  athleteDiscipline: AthleteDiscipline;
  isCrossFitAthlete: boolean;
  isMusculacionAthlete: boolean;
  isPersonalizadoAthlete: boolean;

  // Flyers & Event Posters
  flyers: GymFlyer[];
  saveFlyer: (flyer: GymFlyer) => Promise<void>;
  deleteFlyer: (id: string) => Promise<void>;

  // Anthropometry & Physical Tracking
  anthropometricRecords: AnthropometricMeasurement[];
  athleteAnthropometry: AnthropometricMeasurement[];
  saveAnthropometry: (record: AnthropometricMeasurement) => Promise<void>;
  deleteAnthropometry: (id: string) => Promise<void>;

  // Progress Photos (Before / After Reel)
  progressPhotos: ProgressPhoto[];
  athleteProgressPhotos: ProgressPhoto[];
  saveProgressPhoto: (photo: ProgressPhoto) => Promise<void>;
  deleteProgressPhoto: (id: string) => Promise<void>;

  // Custom Exercises
  customExercises: CustomExercise[];
  addCustomExercise: (name: string, category?: any) => Promise<void>;

  // Gym Settings (WhatsApp, etc.)
  gymSettings: GymSettings;
  updateGymSettings: (settings: Partial<GymSettings>) => Promise<void>;

  // Membership Plans & Categories Management
  plans: MembershipPlan[];
  addPlan: (plan: Omit<MembershipPlan, 'id'>) => Promise<{ success: boolean; message: string; plan?: MembershipPlan }>;
  updatePlan: (id: string, updates: Partial<MembershipPlan>) => Promise<{ success: boolean; message: string }>;
  deletePlan: (id: string) => Promise<{ success: boolean; message: string }>;

  // Accounting & Financial Management
  transactions: AccountingTransaction[];
  addTransaction: (transaction: AccountingTransaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Maintenance Mode
  isMaintenanceMode: boolean;
  setMaintenanceMode: (enabled: boolean, message?: string) => Promise<void>;

  // Reset
  resetToDefaultData: () => void;
}

const STORAGE_KEY = 'indomable_crossfit_state_v2';

// Limpieza de datos antiguos v1 si existen
try {
  if (typeof window !== 'undefined' && localStorage.getItem('indomable_crossfit_state_v1_athletes')) {
    localStorage.removeItem('indomable_crossfit_state_v1_athletes');
    localStorage.removeItem('indomable_crossfit_state_v1_slots');
    localStorage.removeItem('indomable_crossfit_state_v1_rms');
    localStorage.removeItem('indomable_crossfit_state_v1_wodlogs');
    localStorage.removeItem('indomable_crossfit_state_v1_auth');
    localStorage.removeItem('indomable_crossfit_state_v1_current_athlete');
    localStorage.removeItem('indomable_crossfit_state_v1_role');
  }
} catch {
  // ignore
}

const GymContext = createContext<GymContextType | undefined>(undefined);

// Helper to ensure strictly unique slot IDs
const deduplicateSlots = (slotList: ClassSlot[]): ClassSlot[] => {
  const seen = new Set<string>();
  return slotList.filter((s) => {
    if (!s || !s.id) return false;
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
};

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session & Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_auth`);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_role`);
      if (saved === 'coach' || saved === 'admin') return saved;
      return 'athlete';
    } catch {
      return 'athlete';
    }
  });

  const [currentCoachId, setCurrentCoachId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_current_coach_id`) || null;
    } catch {
      return null;
    }
  });

  const [coaches, setCoaches] = useState<CoachUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_coaches`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_admin_creds`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminSessionId, setAdminSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_admin_session_id`) || null;
    } catch {
      return null;
    }
  });

  const [adminActiveUsername, setAdminActiveUsername] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_admin_active_username`) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (adminSessionId) {
        localStorage.setItem(`${STORAGE_KEY}_admin_session_id`, adminSessionId);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_admin_session_id`);
      }
    } catch {}
  }, [adminSessionId]);

  useEffect(() => {
    try {
      if (adminActiveUsername) {
        localStorage.setItem(`${STORAGE_KEY}_admin_active_username`, adminActiveUsername);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}_admin_active_username`);
      }
    } catch {}
  }, [adminActiveUsername]);

  const [coachPin, setCoachPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_coach_pin`);
      return saved || '1234';
    } catch {
      return '1234';
    }
  });

  const [currentAthleteId, setCurrentAthleteId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_current_athlete`);
      return saved || '';
    } catch {
      return '';
    }
  });

  const [selectedDate, setSelectedDate] = useState<string>(getFormattedDate(0));
  const [activeUnit, setActiveUnit] = useState<WeightUnit>('kg');

  // Load athletes cleanly
  const [athletes, setAthletes] = useState<AthleteProfile[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_athletes`);
      if (saved) {
        const parsed: AthleteProfile[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [wods, setWods] = useState<WODSchedule[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_wods`);
      return saved ? JSON.parse(saved) : INITIAL_WODS;
    } catch {
      return INITIAL_WODS;
    }
  });

  const [slots, setSlots] = useState<ClassSlot[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_slots`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateSlots(parsed);
        }
      }
    } catch {
      // ignore and generate defaults
    }
    // Generate slots for today, yesterday, and next 5 days
    const allInitialSlots: ClassSlot[] = [];
    for (let i = -2; i <= 6; i++) {
      const d = getFormattedDate(i);
      allInitialSlots.push(...generateDefaultSlotsForDate(d));
    }
    return deduplicateSlots(allInitialSlots);
  });

  const [rms, setRms] = useState<PersonalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_rms`);
      return saved ? JSON.parse(saved) : INITIAL_RMS;
    } catch {
      return INITIAL_RMS;
    }
  });

  const [wodLogs, setWodLogs] = useState<WODResultLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_wodlogs`);
      return saved ? JSON.parse(saved) : INITIAL_WOD_LOGS;
    } catch {
      return INITIAL_WOD_LOGS;
    }
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_activity_logs`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [flyers, setFlyers] = useState<GymFlyer[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_flyers`);
      return saved ? JSON.parse(saved) : INITIAL_FLYERS;
    } catch {
      return INITIAL_FLYERS;
    }
  });

  const [anthropometricRecords, setAnthropometricRecords] = useState<AnthropometricMeasurement[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_anthropometry`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_progress_photos`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customExercises, setCustomExercises] = useState<CustomExercise[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_custom_exercises`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [plans, setPlans] = useState<MembershipPlan[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_membership_plans`);
      return saved ? JSON.parse(saved) : DEFAULT_MEMBERSHIP_PLANS;
    } catch {
      return DEFAULT_MEMBERSHIP_PLANS;
    }
  });

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_membership_plans`, JSON.stringify(plans));
  }, [plans]);

  const [gymSettings, setGymSettings] = useState<GymSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_gym_settings`);
      return saved ? JSON.parse(saved) : { whatsappGroupUrl: '' };
    } catch {
      return { whatsappGroupUrl: '' };
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_gym_settings`, JSON.stringify(gymSettings));
  }, [gymSettings]);

  // Accounting Transactions State
  const [transactions, setTransactions] = useState<AccountingTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_transactions`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Payment Modal Global State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const openPaymentModal = () => setIsPaymentModalOpen(true);
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_transactions`, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    const unsub = subscribeTransactionsLive((cloudTxs) => {
      if (cloudTxs && Array.isArray(cloudTxs)) {
        setTransactions(cloudTxs);
      }
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_athletes`, JSON.stringify(athletes));
  }, [athletes]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_wods`, JSON.stringify(wods));
  }, [wods]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_slots`, JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_rms`, JSON.stringify(rms));
  }, [rms]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_wodlogs`, JSON.stringify(wodLogs));
  }, [wodLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_activity_logs`, JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_flyers`, JSON.stringify(flyers));
  }, [flyers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_anthropometry`, JSON.stringify(anthropometricRecords));
  }, [anthropometricRecords]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_progress_photos`, JSON.stringify(progressPhotos));
  }, [progressPhotos]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_custom_exercises`, JSON.stringify(customExercises));
  }, [customExercises]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auth`, JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_role`, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_current_athlete`, currentAthleteId);
  }, [currentAthleteId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_coach_pin`, coachPin);
  }, [coachPin]);

  useEffect(() => {
    if (currentCoachId) {
      localStorage.setItem(`${STORAGE_KEY}_current_coach_id`, currentCoachId);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_current_coach_id`);
    }
  }, [currentCoachId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_coaches`, JSON.stringify(coaches));
  }, [coaches]);

  useEffect(() => {
    if (adminCredentials) {
      localStorage.setItem(`${STORAGE_KEY}_admin_creds`, JSON.stringify(adminCredentials));
    }
  }, [adminCredentials]);

  // Current active athlete profile
  const currentAthlete = useMemo(() => {
    if (!currentAthleteId) return null;
    return athletes.find((a) => a.id === currentAthleteId) || null;
  }, [athletes, currentAthleteId]);

  // Monitoreo de vigencia de membresía del atleta: emite notificación y alerta sonora cuando quedan 3 días o menos
  useEffect(() => {
    if (role === 'athlete' && currentAthlete && currentAthlete.membership) {
      if (currentAthlete.membership.isActive && !currentAthlete.membership.isPendingApproval) {
        const daysRemaining = calculateMembershipDaysRemaining(currentAthlete.membership.endDate);
        if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0) {
          notifyMembershipExpiring(
            currentAthlete.id,
            currentAthlete.name,
            currentAthlete.membership.planName,
            daysRemaining
          );
        }
      }
    }
  }, [
    role,
    currentAthlete?.id,
    currentAthlete?.name,
    currentAthlete?.membership?.endDate,
    currentAthlete?.membership?.isActive,
    currentAthlete?.membership?.isPendingApproval,
    currentAthlete?.membership?.planName,
  ]);

  // Athlete discipline derivation
  const athleteDiscipline = useMemo<AthleteDiscipline>(() => {
    if (!currentAthlete) return 'crossfit';
    if (currentAthlete.discipline) return currentAthlete.discipline;
    if (currentAthlete.membership?.discipline) return currentAthlete.membership.discipline;
    
    // Auto-detect based on planName
    const plan = (currentAthlete.membership?.planName || '').toLowerCase();
    if (plan.includes('personalizad')) return 'personalizado';
    if (plan.includes('musculaci')) return 'musculacion';
    return 'crossfit';
  }, [currentAthlete]);

  const isCrossFitAthlete = athleteDiscipline === 'crossfit';
  const isMusculacionAthlete = athleteDiscipline === 'musculacion';
  const isPersonalizadoAthlete = athleteDiscipline === 'personalizado';

  // Athlete anthropometric records sorted by date descending
  const athleteAnthropometry = useMemo(() => {
    if (!currentAthleteId) return [];
    return anthropometricRecords
      .filter((rec) => rec.athleteId === currentAthleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [anthropometricRecords, currentAthleteId]);

  // Athlete progress photos sorted by date descending
  const athleteProgressPhotos = useMemo(() => {
    if (!currentAthleteId) return [];
    return progressPhotos
      .filter((p) => p.athleteId === currentAthleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progressPhotos, currentAthleteId]);

  // Current active coach profile
  const currentCoach = useMemo(() => {
    if (role !== 'coach' || !currentCoachId) return null;
    return coaches.find((c) => c.id === currentCoachId) || null;
  }, [role, currentCoachId, coaches]);

  // Current selected WOD
  const currentWod = useMemo(() => {
    return wods.find((w) => w.date === selectedDate);
  }, [wods, selectedDate]);

  // Slots for selected date (strictly deduplicated by ID)
  const slotsForSelectedDate = useMemo(() => {
    const found = slots.filter((s) => s.date === selectedDate);
    if (found.length > 0) {
      return deduplicateSlots(found);
    }
    // If not existing yet in state, generate pure default slots for immediate display
    return generateDefaultSlotsForDate(selectedDate);
  }, [slots, selectedDate]);

  // Ensure default slots are persisted to state for newly viewed dates in an effect
  useEffect(() => {
    setSlots((prev) => {
      const hasForDate = prev.some((s) => s.date === selectedDate);
      if (hasForDate) return prev;
      const newSlots = generateDefaultSlotsForDate(selectedDate);
      const existingIds = new Set(prev.map((s) => s.id));
      const nonColliding = newSlots.filter((s) => !existingIds.has(s.id));
      if (nonColliding.length === 0) return prev;
      // Also sync new slots to Firestore
      nonColliding.forEach((slot) => syncSaveSlot(slot).catch(() => {}));
      return [...prev, ...nonColliding];
    });
  }, [selectedDate]);

  // Suscripciones y sincronización en tiempo real con Cloud Firestore
  useEffect(() => {
    const unsubAthletes = subscribeAthletesLive((liveAthletes) => {
      // Sincronizar SIEMPRE con Cloud Firestore (incluso si la lista queda vacía [])
      if (liveAthletes) {
        setAthletes(liveAthletes);

        // Si el usuario en este dispositivo está logueado como atleta y su cuenta fue eliminada:
        if (role === 'athlete' && currentAthleteId) {
          const stillExists = liveAthletes.some((a) => a.id === currentAthleteId);
          if (!stillExists) {
            console.warn('[GymContext] Tu cuenta de atleta ha sido eliminada por el administrador. Cerrando sesión...');
            setIsAuthenticated(false);
            setCurrentAthleteId('');
            try {
              localStorage.removeItem(`${STORAGE_KEY}_auth`);
              localStorage.removeItem(`${STORAGE_KEY}_current_athlete`);
              localStorage.removeItem(`${STORAGE_KEY}_role`);
            } catch {}
          }
        }
      }
    });

    const unsubSlots = subscribeSlotsLive((liveSlots) => {
      if (liveSlots && liveSlots.length > 0) {
        setSlots(deduplicateSlots(liveSlots));
      }
    });

    const unsubWods = subscribeWodsLive((liveWods) => {
      if (liveWods && liveWods.length > 0) {
        setWods(liveWods);
      }
    });

    const unsubRms = subscribeRMsLive((liveRms) => {
      if (liveRms && liveRms.length > 0) {
        setRms(liveRms);
      }
    });

    const unsubWodLogs = subscribeWodLogsLive((liveLogs) => {
      if (liveLogs && liveLogs.length > 0) {
        setWodLogs(liveLogs);
      }
    });

    const unsubCoach = subscribeCoachPinLive((livePin) => {
      if (livePin) {
        setCoachPin(livePin);
      }
    });

    const unsubActivityLogs = subscribeActivityLogsLive((liveLogs) => {
      if (liveLogs && Array.isArray(liveLogs)) {
        setActivityLogs(liveLogs);
      }
    });

    const unsubCoaches = subscribeCoachesLive((liveCoaches) => {
      if (liveCoaches && Array.isArray(liveCoaches)) {
        setCoaches(liveCoaches);
      }
    });

    const unsubAdmin = subscribeAdminCredentialsLive((liveAdmin) => {
      if (liveAdmin) {
        setAdminCredentials(liveAdmin);
      }
    });

    let initialFlyersLoaded = false;
    const unsubFlyers = subscribeFlyersLive((liveFlyers) => {
      if (liveFlyers && liveFlyers.length > 0) {
        try {
          // Si el usuario no tiene la sesión iniciada en este dispositivo, NO emitir alertas
          const isAuth = (() => {
            try {
              const raw = localStorage.getItem(`${STORAGE_KEY}_auth`);
              return raw !== null ? JSON.parse(raw) === true : false;
            } catch {
              return false;
            }
          })();

          if (!isAuth) {
            setFlyers(liveFlyers);
            return;
          }

          const currentSeenRaw = localStorage.getItem('indomable_seen_flyers');
          if (currentSeenRaw === null) {
            // Primerísima carga en este dispositivo: marcar existentes para no bombardear al usuario
            markFlyersAsSeen(liveFlyers.map((f) => f.id));
            initialFlyersLoaded = true;
          } else {
            // Usuario con sesión e historial en el dispositivo:
            // Disparar notificación únicamente para anuncios no vistos si la sesión está abierta
            const currentSeen: string[] = JSON.parse(currentSeenRaw);
            liveFlyers.forEach((f) => {
              if (!currentSeen.includes(f.id) && f.isActive !== false) {
                // Alerta visual y sonora dentro de la app sin duplicar la notificación del sistema
                dispatchInAppAlert({
                  id: f.id,
                  title: f.title,
                  body: f.description || 'Nuevo anuncio disponible en INDOMABLE',
                  date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
                playNotificationSound();
              }
            });
            initialFlyersLoaded = true;
          }
        } catch (err) {
          console.warn('[GymContext] Error al evaluar notificaciones de flyers:', err);
        }
        setFlyers(liveFlyers);
      }
    });

    // Revalidar inmediatamente al encender pantalla, desbloquear celular o volver al navegador
    const handleWakeOrFocus = () => {
      try {
        const isAuth = (() => {
          try {
            const raw = localStorage.getItem(`${STORAGE_KEY}_auth`);
            return raw !== null ? JSON.parse(raw) === true : false;
          } catch {
            return false;
          }
        })();

        if (!isAuth) return;

        const currentSeenRaw = localStorage.getItem('indomable_seen_flyers');
        if (!currentSeenRaw) return;
        const currentSeen: string[] = JSON.parse(currentSeenRaw);
        setFlyers((currentFlyers) => {
          currentFlyers.forEach((f) => {
            if (!currentSeen.includes(f.id) && f.isActive !== false) {
              dispatchInAppAlert({
                id: f.id,
                title: f.title,
                body: f.description || 'Nuevo anuncio disponible en INDOMABLE',
                date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              });
              playNotificationSound();
            }
          });
          return currentFlyers;
        });
      } catch {
        // ignore
      }
    };

    window.addEventListener('visibilitychange', handleWakeOrFocus);
    window.addEventListener('focus', handleWakeOrFocus);
    window.addEventListener('online', handleWakeOrFocus);

    const unsubAnthropometry = subscribeAnthropometryLive((liveRecords) => {
      if (liveRecords) {
        setAnthropometricRecords(liveRecords);
      }
    });

    const unsubProgressPhotos = subscribeProgressPhotosLive((livePhotos) => {
      if (livePhotos) {
        setProgressPhotos(livePhotos);
      }
    });

    const unsubCustomExercises = subscribeCustomExercisesLive((liveExercises) => {
      if (liveExercises) {
        setCustomExercises(liveExercises);
      }
    });

    const unsubGymSettings = subscribeGymSettingsLive((liveSettings) => {
      if (liveSettings) {
        setGymSettings((prev) => ({ ...prev, ...liveSettings }));
      }
    });

    const unsubPlans = subscribeMembershipPlansLive((livePlans) => {
      if (livePlans && Array.isArray(livePlans)) {
        setPlans(livePlans);
        // Marcar que ya existen planes en Firestore (evita re-sembrar defaults)
        if (livePlans.length > 0) {
          try { localStorage.setItem(`${STORAGE_KEY}_plans_seeded`, 'true'); } catch {}
        }
      }
    });

    // Solo sembrar planes por defecto la primera vez que se usa la app
    const plansSeedFlag = localStorage.getItem(`${STORAGE_KEY}_plans_seeded`);
    if (!plansSeedFlag) {
      seedMembershipPlansIfEmpty(DEFAULT_MEMBERSHIP_PLANS).then(() => {
        try { localStorage.setItem(`${STORAGE_KEY}_plans_seeded`, 'true'); } catch {}
      }).catch(() => {});
    }

    // Sembrar la base de datos Firestore si está vacía (excluye atletas para evitar resurrecciones)
    seedFirestoreIfEmpty({
      slots,
      wods,
      coachPin,
    });

    return () => {
      window.removeEventListener('visibilitychange', handleWakeOrFocus);
      window.removeEventListener('focus', handleWakeOrFocus);
      window.removeEventListener('online', handleWakeOrFocus);
      unsubAthletes?.();
      unsubSlots?.();
      unsubWods?.();
      unsubRms?.();
      unsubWodLogs?.();
      unsubCoach?.();
      unsubActivityLogs?.();
      unsubCoaches?.();
      unsubAdmin?.();
      unsubFlyers?.();
      unsubAnthropometry?.();
      unsubProgressPhotos?.();
      unsubCustomExercises?.();
      unsubGymSettings?.();
      unsubPlans?.();
    };
  }, []);

  // Latido periódico de sesión única de administrador (Heartbeat en Firestore)
  useEffect(() => {
    if (isAuthenticated && role === 'admin' && adminActiveUsername && adminSessionId) {
      // Latido inicial inmediato
      heartbeatAdminSessionLock(adminActiveUsername, adminSessionId).catch(() => {});

      // Latido cada 35 segundos para mantener la sesión activa
      const interval = setInterval(() => {
        heartbeatAdminSessionLock(adminActiveUsername, adminSessionId).catch(() => {});
      }, 35000);

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, role, adminActiveUsername, adminSessionId]);

  // Activity Log Operations
  const addActivityLog = (
    record: Omit<ActivityLogRecord, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ) => {
    const newLog: ActivityLogRecord = {
      id: record.id || `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: record.timestamp || new Date().toISOString(),
      category: record.category,
      action: record.action,
      description: record.description,
      actor: record.actor || 'Coach',
      target: record.target,
      details: record.details,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
    syncSaveActivityLog(newLog).catch((err) => {
      console.warn('[Firestore] Error sincronizando log de actividad:', err);
    });
  };

  const clearActivityLogs = () => {
    setActivityLogs([]);
    syncClearActivityLogs().catch((err) => {
      console.warn('[Firestore] Error limpiando historial de actividades:', err);
    });
  };

  const purgeActivityLogs = (range: 'day' | 'week' | 'month' | 'all') => {
    if (range === 'all') {
      clearActivityLogs();
      return;
    }

    const now = Date.now();
    let hours = 24;
    if (range === 'day') hours = 24;
    else if (range === 'week') hours = 24 * 7;
    else if (range === 'month') hours = 24 * 30;

    const cutoffMs = now - hours * 3600 * 1000;
    const cutoffIso = new Date(cutoffMs).toISOString();

    setActivityLogs((prev) =>
      prev.filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= cutoffMs;
      })
    );

    syncPurgeActivityLogs(cutoffIso).catch((err) => {
      console.warn('[Firestore] Error purgando historial de actividades:', err);
    });
  };

  // WOD Operations
  const saveWod = (wod: WODSchedule) => {
    setWods((prev) => {
      const existsIndex = prev.findIndex((w) => w.date === wod.date);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = wod;
        return copy;
      }
      return [...prev, wod];
    });
    syncSaveWod(wod).catch(() => {});
    addActivityLog({
      category: 'WOD',
      action: 'Publicación de WOD',
      description: `WOD "${wod.title}" actualizado/publicado para el día ${wod.date}.`,
      actor: 'Coach',
    });
  };

  // Booking Operations
  const bookSlot = (slotId: string, athleteIdToBook?: string) => {
    const athleteId = athleteIdToBook || currentAthleteId;
    const athlete = athletes.find((a) => a.id === athleteId);
    
    if (!athlete) {
      return { success: false, message: 'Atleta no encontrado.' };
    }

    // Check if pending approval or inactive
    if (athlete.membership.isPendingApproval || !athlete.membership.isActive) {
      return {
        success: false,
        message: 'Tu membresía se encuentra pendiente de activación o inactiva. Acércate al coach o solicita activación para poder reservar clases.',
      };
    }

    // Check expiration
    const todayStr = new Date().toISOString().split('T')[0];
    if (athlete.membership.endDate < todayStr) {
      return {
        success: false,
        message: 'Tu membresía ha vencido. Por favor renueva tu plan con el coach para reservar clases.',
      };
    }

    // Check remaining classes for punch card (only applies if explicitly a number)
    if (
      typeof athlete.membership.remainingClasses === 'number' &&
      athlete.membership.remainingClasses !== null &&
      athlete.membership.remainingClasses <= 0
    ) {
      return {
        success: false,
        message: 'Has agotado todas las clases de tu tiquetera. Renueva con tu coach para continuar entrenando.',
      };
    }

    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) {
      return {
        success: false,
        message: 'La clase seleccionada no existe o no está disponible.',
      };
    }

    if (!targetSlot.isEnabled) {
      return { success: false, message: 'Esta franja horaria no está habilitada.' };
    }

    if (targetSlot.attendeeIds.includes(athleteId)) {
      return { success: false, message: 'Ya tienes un cupo reservado en esta clase.' };
    }

    // MANDATORY RULE: Maximum 1 class reservation per day per athlete
    const alreadyBookedToday = slots.some(
      (s) => s.date === targetSlot.date && s.attendeeIds.includes(athleteId)
    );
    if (alreadyBookedToday) {
      return {
        success: false,
        message: 'Solo puedes reservar una clase por día. Ya tienes un cupo reservado para esta fecha. Si deseas cambiar de horario, cancela primero tu reserva actual.',
      };
    }

    if (targetSlot.attendeeIds.length >= targetSlot.capacity) {
      return { success: false, message: 'Lo sentimos, los cupos para esta clase están agotados.' };
    }

    let success = false;
    let message = '';

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;

        success = true;
        message = `¡Cupo reservado con éxito para las ${slot.label}! Te esperamos en el box.`;
        return {
          ...slot,
          attendeeIds: [...slot.attendeeIds, athleteId],
        };
      })
    );

    if (success) {
      // Sync reservation to Firestore
      syncBookSlot(slotId, athleteId).catch(() => {});

      // Registrar actividad
      addActivityLog({
        category: 'BOOKING',
        action: 'Reserva de Clase',
        description: `${athlete.name} reservó cupo para las ${targetSlot.label} (${targetSlot.date}).`,
        actor: athlete.name,
        target: targetSlot.label,
      });

      // Deduct punch card class if applicable
      setAthletes((prev) =>
        prev.map((a) => {
          if (a.id !== athleteId) return a;
          if (
            typeof a.membership.remainingClasses === 'number' &&
            a.membership.remainingClasses !== null &&
            a.membership.remainingClasses > 0
          ) {
            const updated = {
              ...a,
              membership: {
                ...a.membership,
                remainingClasses: a.membership.remainingClasses - 1,
              },
            };
            syncUpdateAthlete(athleteId, updated).catch(() => {});
            return updated;
          }
          return a;
        })
      );

      // Trigger celebratory confetti in Red & Black
      try {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.7 },
          colors: ['#dc2626', '#ef4444', '#b91c1c', '#ffffff', '#18181b'],
        });
      } catch (e) {
        console.log('Confetti effect', e);
      }
    }

    return { success, message };
  };

  const cancelBooking = (slotId: string, athleteIdToCancel?: string) => {
    const athleteId = athleteIdToCancel || currentAthleteId;
    let success = false;
    let message = '';

    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;

        if (!slot.attendeeIds.includes(athleteId)) {
          message = 'No tienes reserva en esta clase.';
          return slot;
        }

        success = true;
        message = `Has cancelado tu reserva de las ${slot.label}. Tu cupo quedó libre para otro atleta.`;
        return {
          ...slot,
          attendeeIds: slot.attendeeIds.filter((id) => id !== athleteId),
        };
      })
    );

    if (success) {
      // Sync cancel booking to Firestore
      syncCancelBooking(slotId, athleteId).catch(() => {});

      const athleteObj = athletes.find((a) => a.id === athleteId);
      const slotObj = slots.find((s) => s.id === slotId);
      addActivityLog({
        category: 'BOOKING',
        action: 'Cancelación de Reserva',
        description: `${athleteObj?.name || 'Atleta'} canceló su cupo en clase ${slotObj?.label || slotId} (${slotObj?.date || ''}).`,
        actor: athleteObj?.name || 'Atleta',
        target: slotObj?.label,
      });

      // Restore punch card class if applicable
      setAthletes((prev) =>
        prev.map((a) => {
          if (a.id !== athleteId) return a;
          if (
            typeof a.membership.remainingClasses === 'number' &&
            a.membership.remainingClasses !== null
          ) {
            const updated = {
              ...a,
              membership: {
                ...a.membership,
                remainingClasses: a.membership.remainingClasses + 1,
              },
            };
            syncUpdateAthlete(athleteId, updated).catch(() => {});
            return updated;
          }
          return a;
        })
      );
    }

    return { success, message };
  };

  const toggleSlotEnabled = (slotId: string) => {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          const updated = { ...s, isEnabled: !s.isEnabled };
          syncUpdateSlot(slotId, { isEnabled: updated.isEnabled }).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  const updateSlotCapacity = (slotId: string, newCapacity: number) => {
    if (newCapacity < 1) return;
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === slotId) {
          syncUpdateSlot(slotId, { capacity: newCapacity }).catch(() => {});
          return { ...s, capacity: newCapacity };
        }
        return s;
      })
    );
  };

  const markAttendance = (slotId: string, athleteId: string, attended: boolean) => {
    console.log(`Athlete ${athleteId} checked-in: ${attended} for slot ${slotId}`);
  };

  const addNewSlot = (
    date: string,
    time: string,
    label: string,
    capacity: number,
    coachName: string
  ) => {
    const newSlot: ClassSlot = {
      id: `${date}_${time}_${Date.now()}`,
      date,
      time,
      label,
      coachName,
      capacity,
      isEnabled: true,
      attendeeIds: [],
    };
    setSlots((prev) => [...prev, newSlot]);
    syncSaveSlot(newSlot).catch(() => {});
  };

  const generateWeekSchedule = (weekStartDate: string) => {
    const newSlots: ClassSlot[] = [];
    const baseDate = new Date(weekStartDate);

    for (let day = 0; day < 7; day++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + day);
      const dateStr = d.toISOString().split('T')[0];

      DEFAULT_TIME_SLOTS.forEach((slot) => {
        const slotItem: ClassSlot = {
          id: `${dateStr}_${slot.time}`,
          date: dateStr,
          time: slot.time,
          label: slot.label,
          coachName: parseInt(slot.time.split(':')[0], 10) < 12 ? 'Coach Camilo' : 'Coach Sofía',
          capacity: slot.defaultCapacity,
          isEnabled: true,
          attendeeIds: [],
        };
        newSlots.push(slotItem);
        syncSaveSlot(slotItem).catch(() => {});
      });
    }

    // Merge without overriding existing bookings and ensure uniqueness
    setSlots((prev) => {
      const filtered = prev.filter(
        (existing) =>
          !newSlots.some((ns) => ns.date === existing.date && ns.time === existing.time)
      );
      return deduplicateSlots([...filtered, ...newSlots]);
    });
  };

  // Personal Records Operations
  const saveRM = (recordData: Omit<PersonalRecord, 'id'> & { id?: string }) => {
    if (recordData.id) {
      setRms((prev) =>
        prev.map((r) => (r.id === recordData.id ? ({ ...r, ...recordData } as PersonalRecord) : r))
      );
      syncSaveRM({ ...recordData } as PersonalRecord).catch(() => {});
    } else {
      const newRecord: PersonalRecord = {
        ...recordData,
        id: `pr-${Date.now()}`,
      };
      setRms((prev) => [newRecord, ...prev]);
      syncSaveRM(newRecord).catch(() => {});
    }
  };

  const deleteRM = (id: string) => {
    setRms((prev) => prev.filter((r) => r.id !== id));
    syncDeleteRM(id).catch(() => {});
  };

  // WOD Results Logs Operations
  const saveWodLog = (logData: Omit<WODResultLog, 'id' | 'loggedAt'> & { id?: string }) => {
    if (logData.id) {
      setWodLogs((prev) =>
        prev.map((l) => (l.id === logData.id ? ({ ...l, ...logData } as WODResultLog) : l))
      );
      syncSaveWodLog({ ...logData } as WODResultLog).catch(() => {});
    } else {
      const newLog: WODResultLog = {
        ...logData,
        id: `log-${Date.now()}`,
        loggedAt: new Date().toISOString(),
      };
      setWodLogs((prev) => [newLog, ...prev]);
      syncSaveWodLog(newLog).catch(() => {});
    }
  };

  const deleteWodLog = (id: string) => {
    setWodLogs((prev) => prev.filter((l) => l.id !== id));
    syncDeleteWodLog(id).catch(() => {});
  };

  // Athlete Management Operations
  const addAthlete = (newAthleteData: Omit<AthleteProfile, 'id'>): AthleteProfile => {
    const newAthlete: AthleteProfile = {
      ...newAthleteData,
      id: `ath-${Date.now()}`,
      pin: newAthleteData.pin || '1234',
    };
    setAthletes((prev) => [newAthlete, ...prev]);
    syncSaveAthlete(newAthlete).catch(() => {});
    return newAthlete;
  };

  const resetAthletePin = (athleteId: string, customPin?: string): string => {
    const cleanPin = customPin && /^\d{4}$/.test(customPin.trim())
      ? customPin.trim()
      : Math.floor(1000 + Math.random() * 9000).toString();
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== athleteId) return a;
        return {
          ...a,
          pin: cleanPin,
        };
      })
    );
    syncUpdateAthlete(athleteId, { pin: cleanPin }).catch(() => {});
    const targetAth = athletes.find((a) => a.id === athleteId);
    addActivityLog({
      category: 'SECURITY',
      action: 'Restablecimiento de PIN',
      description: `El Coach restableció el PIN de acceso del atleta ${targetAth?.name || athleteId}.`,
      actor: 'Coach',
      target: targetAth?.documentId,
    });
    return cleanPin;
  };

  const updateAthlete = (id: string, updates: Partial<AthleteProfile>) => {
    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          ...updates,
          membership: updates.membership ? { ...a.membership, ...updates.membership } : a.membership,
        };
      })
    );
    syncUpdateAthlete(id, updates).catch(() => {});
  };

  const deleteAthlete = async (id: string): Promise<void> => {
    const targetAth = athletes.find((a) => a.id === id);
    const targetDocId = targetAth?.documentId;
    const targetName = targetAth?.name || id;

    // 1. Remover reactivamente del estado local
    const remainingAthletes = athletes.filter((a) => a.id !== id);
    setAthletes(remainingAthletes);

    // 2. Limpiar de inmediato en localStorage para evitar reaparición tras reload
    try {
      localStorage.setItem(`${STORAGE_KEY}_athletes`, JSON.stringify(remainingAthletes));
    } catch {}

    // 3. Si el atleta eliminado era el activo en este cliente, cerrar su sesión
    if (currentAthleteId === id) {
      setCurrentAthleteId('');
      if (role === 'athlete') {
        setIsAuthenticated(false);
        try {
          localStorage.removeItem(`${STORAGE_KEY}_auth`);
          localStorage.removeItem(`${STORAGE_KEY}_current_athlete`);
          localStorage.removeItem(`${STORAGE_KEY}_role`);
        } catch {}
      }
    }

    // 4. Remover al atleta de cualquier cupo reservado en slots
    setSlots((prev) =>
      prev.map((s) => {
        if (s.attendeeIds.includes(id)) {
          const updated = {
            ...s,
            attendeeIds: s.attendeeIds.filter((athId) => athId !== id),
          };
          syncUpdateSlot(s.id, { attendeeIds: updated.attendeeIds }).catch(() => {});
          return updated;
        }
        return s;
      })
    );

    // 5. Eliminar de forma definitiva de Cloud Firestore
    try {
      await syncDeleteAthlete(id, targetDocId);
    } catch (err) {
      console.error('[Firestore] Error al eliminar atleta de Firestore:', err);
    }

    // 6. Registrar en auditoría
    addActivityLog({
      category: 'ATHLETE',
      action: 'Eliminación de Atleta',
      description: `El Administrador eliminó permanentemente al atleta ${targetName} (CC ${targetDocId || 'N/A'}).`,
      actor: 'Administrador',
      target: targetDocId,
    });
  };

  const renewAthleteMembership = async (
    id: string,
    planName: string,
    durationDays: number = 30,
    classesCount?: number,
    discipline?: AthleteDiscipline,
    customStartDate?: string
  ): Promise<{ success: boolean; message: string; emailResult?: { success: boolean; message: string } }> => {
    if (role !== 'admin') {
      return {
        success: false,
        message: 'Operación denegada. Solo el Administrador general tiene autorización para renovar membresías.',
      };
    }

    const now = new Date();
    const baseDate = customStartDate ? new Date(customStartDate + 'T00:00:00') : now;
    const startDate = baseDate.toISOString().split('T')[0];
    const end = new Date(baseDate);
    end.setDate(baseDate.getDate() + (durationDays > 0 ? durationDays : 30));
    const endDate = end.toISOString().split('T')[0];

    const safePlan = (!planName || planName.toLowerCase().includes('pendiente'))
      ? 'Mensual Ilimitado Pro'
      : planName;
    const isPunch = (classesCount !== undefined && classesCount > 0);
    const resolvedClasses = isPunch ? classesCount : null;

    const athleteToNotify = athletes.find((a) => a.id === id);

    const resolvedDiscipline: AthleteDiscipline = discipline ||
      (safePlan.toLowerCase().includes('personalizad') ? 'personalizado' :
       safePlan.toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');

    const updatedMembership = {
      planName: safePlan,
      startDate,
      endDate,
      isActive: true,
      isPendingApproval: false,
      totalClasses: resolvedClasses ?? null,
      remainingClasses: resolvedClasses ?? null,
      discipline: resolvedDiscipline,
    };

    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          discipline: resolvedDiscipline,
          membership: updatedMembership as any,
        };
      })
    );

    try {
      await syncUpdateAthlete(id, {
        discipline: resolvedDiscipline,
        membership: updatedMembership as any,
      });
      console.log(`[GymContext] Membresía renovada y persistida en Firestore para atleta: ${id}`);
    } catch (syncErr) {
      console.error('[GymContext] Error al persistir renovación en Firestore:', syncErr);
    }

    // Notificar al atleta por correo electrónico
    let emailResult: { success: boolean; message: string } | undefined;
    if (athleteToNotify && athleteToNotify.email) {
      try {
        emailResult = await sendMembershipActivatedEmail({
          name: athleteToNotify.name,
          email: athleteToNotify.email,
          planName: safePlan,
          startDate,
          endDate,
          classesCount: resolvedClasses || undefined,
        });
      } catch (err: any) {
        console.warn('Error al enviar correo de activación:', err);
        emailResult = {
          success: false,
          message: err?.message || 'Error de conexión al enviar correo de activación',
        };
      }
    }

    // Registrar automáticamente en Contabilidad y Google Sheets
    const matchingPlan = plans.find((p) => p.name.toLowerCase() === safePlan.toLowerCase());
    const resolvedPrice = (matchingPlan?.price !== undefined && matchingPlan?.price !== null) ? matchingPlan.price : (resolvedDiscipline === 'musculacion' ? 120000 : resolvedDiscipline === 'personalizado' ? 350000 : 160000);
    const renewTx: AccountingTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: startDate,
      timestamp: now.toISOString(),
      athleteId: id,
      athleteName: athleteToNotify?.name || 'Atleta',
      athleteDocumentId: athleteToNotify?.documentId,
      planName: safePlan,
      discipline: resolvedDiscipline,
      amount: resolvedPrice,
      paymentMethod: 'efectivo',
      type: 'membership_renewal',
      approvedBy: 'Administrador',
      notes: `Renovación de membresía (${safePlan})`,
    };
    saveTransactionInFirestore(renewTx).catch(() => {});
    if (gymSettings?.googleSheetsAccountingWebhookUrl) {
      sendTransactionToGoogleSheets(renewTx, gymSettings.googleSheetsAccountingWebhookUrl).catch(() => {});
    }
    setTransactions((prev) => [renewTx, ...prev]);

    addActivityLog({
      category: 'MEMBERSHIP',
      action: 'Renovación de Membresía',
      description: `Membresía renovada para ${athleteToNotify?.name || 'atleta'} (${safePlan}, vence ${endDate}).`,
      actor: 'Administrador',
      target: athleteToNotify?.documentId,
    });

    return {
      success: true,
      message: `Membresía renovada para ${athleteToNotify?.name || 'el atleta'}.`,
      emailResult,
    };
  };

  const approveAthleteMembership = async (
    id: string,
    planName: string = 'Mensual Ilimitado Pro',
    durationDays: number = 30,
    classesCount?: number,
    discipline?: AthleteDiscipline,
    customStartDate?: string
  ): Promise<{ success: boolean; message: string; emailResult?: { success: boolean; message: string } }> => {
    if (role !== 'admin' && role !== 'coach') {
      return {
        success: false,
        message: 'Operación denegada. Solo el Administrador general o Staff autorizado tiene autorización para aprobar y activar membresías.',
      };
    }

    const now = new Date();
    const baseDate = customStartDate ? new Date(customStartDate + 'T00:00:00') : now;
    const startDate = baseDate.toISOString().split('T')[0];
    const end = new Date(baseDate);
    end.setDate(baseDate.getDate() + (durationDays > 0 ? durationDays : 30));
    const endDate = end.toISOString().split('T')[0];

    const safePlan = (!planName || planName.toLowerCase().includes('pendiente'))
      ? 'Mensual Ilimitado Pro'
      : planName;
    const isPunch = (classesCount !== undefined && classesCount > 0);
    const resolvedClasses = isPunch ? classesCount : null;

    const athleteToNotify = athletes.find((a) => a.id === id);

    const resolvedDiscipline: AthleteDiscipline = discipline ||
      (safePlan.toLowerCase().includes('personalizad') ? 'personalizado' :
       safePlan.toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');

    const updatedMembership = {
      planName: safePlan,
      startDate,
      endDate,
      isActive: true,
      isPendingApproval: false,
      totalClasses: resolvedClasses ?? null,
      remainingClasses: resolvedClasses ?? null,
      discipline: resolvedDiscipline,
    };

    setAthletes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          discipline: resolvedDiscipline,
          membership: updatedMembership as any,
        };
      })
    );

    try {
      await syncUpdateAthlete(id, {
        discipline: resolvedDiscipline,
        membership: updatedMembership as any,
      });
      console.log(`[GymContext] Membresía aprobada y persistida en Firestore para atleta: ${id}`);
    } catch (syncErr) {
      console.error('[GymContext] Error al persistir aprobación en Firestore:', syncErr);
    }

    // Notificar al atleta por correo electrónico
    let emailResult: { success: boolean; message: string } | undefined;
    if (athleteToNotify && athleteToNotify.email) {
      try {
        emailResult = await sendMembershipActivatedEmail({
          name: athleteToNotify.name,
          email: athleteToNotify.email,
          planName: safePlan,
          startDate,
          endDate,
          classesCount: resolvedClasses || undefined,
        });
      } catch (err: any) {
        console.warn('Error al enviar correo de activación:', err);
        emailResult = {
          success: false,
          message: err?.message || 'Error de conexión al enviar correo de activación',
        };
      }
    }

    // Registrar automáticamente en Contabilidad y Google Sheets
    const matchingPlan = plans.find((p) => p.name.toLowerCase() === safePlan.toLowerCase());
    const resolvedPrice = (matchingPlan?.price !== undefined && matchingPlan?.price !== null) ? matchingPlan.price : (resolvedDiscipline === 'musculacion' ? 120000 : resolvedDiscipline === 'personalizado' ? 350000 : 160000);
    const approveTx: AccountingTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      date: startDate,
      timestamp: now.toISOString(),
      athleteId: id,
      athleteName: athleteToNotify?.name || 'Atleta',
      athleteDocumentId: athleteToNotify?.documentId,
      planName: safePlan,
      discipline: resolvedDiscipline,
      amount: resolvedPrice,
      paymentMethod: 'efectivo',
      type: 'membership_new',
      approvedBy: 'Administrador',
      notes: `Aprobación y activación de membresía (${safePlan})`,
    };
    saveTransactionInFirestore(approveTx).catch(() => {});
    if (gymSettings?.googleSheetsAccountingWebhookUrl) {
      sendTransactionToGoogleSheets(approveTx, gymSettings.googleSheetsAccountingWebhookUrl).catch(() => {});
    }
    setTransactions((prev) => [approveTx, ...prev]);

    addActivityLog({
      category: 'MEMBERSHIP',
      action: 'Aprobación de Membresía',
      description: `Membresía aprobada y activada para ${athleteToNotify?.name || 'atleta'} (${safePlan}, vigente hasta ${endDate}).`,
      actor: 'Administrador',
      target: athleteToNotify?.documentId,
    });

    return {
      success: true,
      message: `Membresía aprobada y activada para ${athleteToNotify?.name || 'el atleta'}.`,
      emailResult,
    };
  };

  // Refresca el estado del atleta activo directamente desde Cloud Firestore
  const refreshCurrentAthlete = async (): Promise<AthleteProfile | null> => {
    const docToSearch = currentAthlete?.documentId;
    if (!docToSearch) return null;

    try {
      const fresh = await findAthleteByDocumentIdInFirestore(docToSearch);
      if (fresh) {
        setAthletes((prev) => {
          const idx = prev.findIndex((a) => a.id === fresh.id || a.documentId.trim().toLowerCase() === docToSearch.trim().toLowerCase());
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = fresh;
            return next;
          }
          return [fresh, ...prev];
        });
        return fresh;
      } else if (isFirebaseConfigured()) {
        // El atleta ya no existe en Firestore (fue eliminado por el administrador)
        console.warn('[GymContext] El atleta actual fue eliminado de Firestore. Cerrando sesión...');
        if (role === 'athlete') {
          setIsAuthenticated(false);
          setCurrentAthleteId('');
          try {
            localStorage.removeItem(`${STORAGE_KEY}_auth`);
            localStorage.removeItem(`${STORAGE_KEY}_current_athlete`);
            localStorage.removeItem(`${STORAGE_KEY}_role`);
          } catch {}
        }
      }
    } catch (e) {
      console.warn('Error al refrescar estado del atleta desde Firestore:', e);
    }
    return null;
  };

  // Actualizar automáticamente los datos del atleta cuando la aplicación recupera el foco o se hace visible
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && currentAthleteId) {
        refreshCurrentAthlete();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [currentAthleteId, currentAthlete?.documentId]);

  // Authentication & Access Operations
  const loginWithDocumentId = async (
    docId: string,
    pin: string
  ): Promise<{ success: boolean; message: string; athlete?: AthleteProfile }> => {
    const cleanDoc = docId.trim().toLowerCase();
    const cleanPin = (pin || '').trim();

    if (!cleanDoc) {
      return { success: false, message: 'Por favor ingresa tu número de documento.' };
    }
    if (!cleanPin) {
      return { success: false, message: 'Por favor ingresa tu PIN de acceso de 4 dígitos.' };
    }

    // 1. Consultar PRIMERO en Firestore para obtener el estado más reciente (la nube es la fuente autoritativa)
    let found: AthleteProfile | null = null;
    let queryAttempted = false;
    try {
      if (isFirebaseConfigured()) {
        queryAttempted = true;
        found = await findAthleteByDocumentIdInFirestore(cleanDoc);
        if (found) {
          setAthletes((prev) => {
            const index = prev.findIndex((a) => a.id === found!.id || a.documentId.trim().toLowerCase() === cleanDoc);
            if (index >= 0) {
              const next = [...prev];
              next[index] = found!;
              return next;
            }
            return [found!, ...prev];
          });
        }
      }
    } catch (err) {
      console.warn('Error consultando Firestore en login, usando respaldo local:', err);
    }

    // Si la nube respondió y NO encontró al atleta, significa inequívocamente que NO EXISTE o FUE ELIMINADO.
    // Purgamos cualquier dato residual en memoria local para no arrastrar fantasmas.
    if (!found && queryAttempted) {
      setAthletes((prev) => prev.filter((a) => a.documentId.trim().toLowerCase() !== cleanDoc));
      return {
        success: false,
        message: `No se encontró ningún atleta registrado con el documento "${docId}". Verifica el número o regístrate en el box.`,
      };
    }

    // 2. Solo si Firebase no estaba configurado o la red falló completamente, buscar en memoria local
    if (!found && !queryAttempted) {
      found = athletes.find(
        (a) => a.documentId.trim().toLowerCase() === cleanDoc
      ) || null;
    }

    if (!found) {
      return {
        success: false,
        message: `No se encontró ningún atleta registrado con el documento "${docId}". Verifica el número o regístrate en el box.`,
      };
    }

    const expectedPin = (found.pin && found.pin.trim()) || '1234';
    if (cleanPin !== expectedPin) {
      return {
        success: false,
        message: 'El PIN de acceso ingresado es incorrecto. Si lo olvidaste, solicita a tu coach que lo restablezca desde el panel de administración.',
      };
    }

    setCurrentAthleteId(found.id);
    setRole('athlete');
    setIsAuthenticated(true);
    return { success: true, message: `¡Bienvenido, ${found.name}!`, athlete: found };
  };

  const loginAsCoachWithPin = (pin: string) => {
    if (pin.trim() === coachPin.trim()) {
      setRole('coach');
      setIsAuthenticated(true);
      return { success: true, message: 'Acceso de Entrenador autorizado.' };
    }
    return { success: false, message: 'PIN incorrecto. Ingresa el PIN de seguridad de entrenador configurado.' };
  };

  const loginAsCoach = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message: string; coach?: CoachUser }> => {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Por favor ingresa usuario/correo y contraseña.' };
    }

    const found = coaches.find(
      (c) =>
        (c.username.toLowerCase() === cleanUser || c.email.toLowerCase() === cleanUser) &&
        c.password === cleanPass
    );

    if (!found) {
      return { success: false, message: 'Credenciales incorrectas de Entrenador. Verifica tu usuario y contraseña.' };
    }

    if (!found.isActive) {
      return {
        success: false,
        message: 'Esta cuenta de entrenador ha sido desactivada. Por favor contacta al Administrador.',
      };
    }

    setCurrentCoachId(found.id);
    setRole('coach');
    setIsAuthenticated(true);

    addActivityLog({
      category: 'SECURITY',
      action: 'Inicio de Sesión Coach',
      description: `El entrenador ${found.name} (@${found.username}) inició sesión exitosamente.`,
      actor: found.name,
    });

    return {
      success: true,
      message: `¡Bienvenido Coach ${found.name}!`,
      coach: found,
    };
  };

  const loginAsAdmin = async (
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Por favor ingresa usuario/correo y contraseña de Administrador.' };
    }

    const masterUser = (adminCredentials?.username || 'admin').toLowerCase();
    const masterEmail = (adminCredentials?.email || 'alejandroescaev@gmail.com').toLowerCase();
    const masterPass = adminCredentials?.password || 'AdminIndomable2026!*';

    const isMaster = (cleanUser === masterUser || cleanUser === masterEmail) && cleanPass === masterPass;

    if (!isMaster) {
      // Los miembros de staff con rol 'admin' ya no tienen acceso al panel de Administrador.
      // Deben ingresar como Coach desde la sección de Entrenadores.
      return {
        success: false,
        message: 'Credenciales de Administrador incorrectas. Si eres miembro del Staff, ingresa desde la sección de Entrenadores.',
      };
    }

    // Nombre canónico para el bloqueo de concurrencia
    const canonicalUsername = masterUser;
    const adminDisplayName = 'Administrador General';

    // Generar un identificador de sesión único para este dispositivo
    const newSessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Control de concurrencia: Adquirir bloqueo en Firestore
    const lockRes = await acquireAdminSessionLock(canonicalUsername, newSessionId);
    if (!lockRes.success) {
      // IMPORTANTE: Se rechaza el login y NUNCA se mata la sesión activa previa
      return {
        success: false,
        message:
          lockRes.message ||
          'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
      };
    }

    setAdminSessionId(newSessionId);
    setAdminActiveUsername(canonicalUsername);
    setCurrentCoachId(null);
    setRole('admin');
    setIsAuthenticated(true);

    addActivityLog({
      category: 'SECURITY',
      action: 'Inicio de Sesión Administrador',
      description: `${adminDisplayName} inició sesión en la plataforma.`,
      actor: adminDisplayName,
      target: canonicalUsername,
    });

    return {
      success: true,
      message: `Acceso de Administrador autorizado. Bienvenido, ${adminDisplayName}.`,
    };
  };

  const loginAsTestUser = (): { success: boolean; message: string; athlete?: AthleteProfile } => {
    let testAthlete = athletes.find((a) => a.documentId === 'TEST-001');
    if (!testAthlete) {
      testAthlete = {
        id: 'athlete-test-demo',
        documentId: 'TEST-001',
        name: 'Usuario de Prueba (Demo)',
        email: 'demo@indomable.com',
        phone: '3001234567',
        pin: '1234',
        gender: 'otro',
        birthDate: '1995-01-01',
        address: 'Box INDOMABLE',
        eps: 'Sura EPS',
        emergencyContact: {
          name: 'Soporte Box',
          phone: '3001234567',
        },
        acceptedTerms: true,
        termsAcceptedAt: new Date().toISOString(),
        discipline: 'crossfit',
        membership: {
          planName: 'Mensual Ilimitado Pro',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          isActive: true,
          isPendingApproval: false,
          totalClasses: 15,
          remainingClasses: 12,
          discipline: 'crossfit',
        },
        recordsCount: 6,
        streakDays: 5,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString(),
      };
      setAthletes((prev) => [testAthlete!, ...prev]);
      syncSaveAthlete(testAthlete).catch(() => {});
    }

    setCurrentAthleteId(testAthlete.id);
    setRole('athlete');
    setIsAuthenticated(true);

    addActivityLog({
      category: 'ATHLETE',
      action: 'Ingreso Usuario de Prueba',
      description: 'Ingreso autorizado de Usuario de Prueba para explorar el Box.',
      actor: testAthlete.name,
      target: testAthlete.documentId,
    });

    return {
      success: true,
      message: '¡Bienvenido Usuario de Prueba! Puedes explorar todas las funciones del box.',
      athlete: testAthlete,
    };
  };

  const updateAdminPassword = async (
    currentPass: string,
    newPass: string
  ): Promise<{ success: boolean; message: string }> => {
    if (role !== 'admin') {
      return { success: false, message: 'Operación denegada. Se requiere rol de Administrador.' };
    }

    const expectedPass = adminCredentials?.password || 'AdminIndomable2026!*';
    if (currentPass.trim() !== expectedPass) {
      return { success: false, message: 'La contraseña actual no es correcta.' };
    }

    const cleanNew = newPass.trim();
    if (cleanNew.length < 8) {
      return { success: false, message: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }

    const updatedCreds: AdminCredentials = {
      username: adminCredentials?.username || 'admin',
      email: adminCredentials?.email || 'alejandroescaev@gmail.com',
      password: cleanNew,
      updatedAt: new Date().toISOString(),
    };

    setAdminCredentials(updatedCreds);
    await syncSaveAdminCredentials(updatedCreds);

    addActivityLog({
      category: 'SECURITY',
      action: 'Contraseña Administrador Actualizada',
      description: 'La clave maestra del Administrador fue actualizada correctamente.',
      actor: 'Administrador',
    });

    return {
      success: true,
      message: 'Contraseña de Administrador actualizada con éxito.',
    };
  };

  const addCoach = async (
    data: Omit<CoachUser, 'id' | 'createdAt'>
  ): Promise<{ success: boolean; message: string; coach?: CoachUser }> => {
    if (role !== 'admin') {
      return { success: false, message: 'Solo el Administrador puede registrar usuarios de staff.' };
    }

    const cleanName = data.name.trim();
    const cleanUsername = data.username.trim().toLowerCase();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPass = data.password.trim();
    const cleanRole = data.role === 'admin' ? 'admin' : 'coach';

    if (!cleanName || !cleanUsername || !cleanEmail || !cleanPass) {
      return { success: false, message: 'Todos los campos obligatorios deben ser diligenciados.' };
    }

    if (cleanPass.length < 6) {
      return { success: false, message: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    const exists = coaches.some(
      (c) => c.username.toLowerCase() === cleanUsername || c.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      return { success: false, message: 'Ya existe un usuario de staff con ese usuario o correo.' };
    }

    const newCoach: CoachUser = {
      id: `coach-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: cleanPass,
      role: cleanRole,
      phone: data.phone?.trim() || '',
      avatar: data.avatar || `https://images.unsplash.com/photo-${1534528741775 + (coaches.length % 5) * 1000}?w=150&auto=format&fit=crop&q=80`,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
    };

    setCoaches((prev) => [newCoach, ...prev]);
    await syncSaveCoachUser(newCoach);

    addActivityLog({
      category: 'SECURITY',
      action: cleanRole === 'admin' ? 'Nuevo Administrador Creado' : 'Nuevo Coach Creado',
      description: `El Administrador creó la cuenta con rol de ${cleanRole === 'admin' ? 'Administrador' : 'Coach'} para ${newCoach.name} (@${newCoach.username}).`,
      actor: 'Administrador',
      target: newCoach.username,
    });

    return {
      success: true,
      message: `${cleanRole === 'admin' ? 'Administrador' : 'Coach'} ${newCoach.name} creado exitosamente.`,
      coach: newCoach,
    };
  };

  const updateCoach = async (
    id: string,
    updates: Partial<CoachUser>
  ): Promise<{ success: boolean; message: string }> => {
    if (role !== 'admin') {
      return { success: false, message: 'Solo el Administrador puede editar usuarios de staff.' };
    }

    const target = coaches.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    const updatedCoach: CoachUser = {
      ...target,
      ...updates,
      username: updates.username ? updates.username.trim().toLowerCase() : target.username,
      email: updates.email ? updates.email.trim().toLowerCase() : target.email,
      role: updates.role !== undefined ? updates.role : target.role || 'coach',
    };

    setCoaches((prev) => prev.map((c) => (c.id === id ? updatedCoach : c)));
    await syncSaveCoachUser(updatedCoach);

    addActivityLog({
      category: 'SECURITY',
      action: 'Staff Actualizado',
      description: `El Administrador modificó los datos de ${updatedCoach.name} (@${updatedCoach.username}, rol: ${updatedCoach.role}).`,
      actor: 'Administrador',
      target: updatedCoach.username,
    });

    return {
      success: true,
      message: `Datos del usuario ${updatedCoach.name} actualizados exitosamente.`,
    };
  };

  const deleteCoach = async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    if (role !== 'admin') {
      return { success: false, message: 'Solo el Administrador puede eliminar entrenadores.' };
    }

    const target = coaches.find((c) => c.id === id);
    setCoaches((prev) => prev.filter((c) => c.id !== id));
    await syncDeleteCoachUser(id);

    addActivityLog({
      category: 'SECURITY',
      action: 'Coach Eliminado',
      description: `El Administrador eliminó al coach ${target?.name || id}.`,
      actor: 'Administrador',
      target: target?.username,
    });

    return {
      success: true,
      message: `Entrenador eliminado exitosamente.`,
    };
  };

  const updateCoachPin = (currentPin: string, newPin: string): { success: boolean; message: string } => {
    if (currentPin.trim() !== coachPin.trim()) {
      return { success: false, message: 'El PIN de seguridad actual no coincide.' };
    }
    const cleanNew = newPin.trim();
    if (!/^\d{4}$/.test(cleanNew)) {
      return { success: false, message: 'El nuevo PIN debe contener exactamente 4 números (ej: 5678).' };
    }
    if (cleanNew === coachPin.trim()) {
      return { success: false, message: 'El nuevo PIN debe ser diferente al PIN actual.' };
    }
    setCoachPin(cleanNew);
    syncSaveCoachPin(cleanNew).catch(() => {});
    addActivityLog({
      category: 'SECURITY',
      action: 'PIN Maestro Modificado',
      description: 'El PIN maestro de acceso del Coach fue actualizado exitosamente en todos los dispositivos.',
      actor: 'Coach',
    });
    return { success: true, message: `El PIN de seguridad del Coach se ha actualizado correctamente a ${cleanNew}.` };
  };

  const registerAthlete = (data: {
    documentId: string;
    name: string;
    pin: string;
    email: string;
    phone?: string;
    planName?: string;
    discipline?: AthleteDiscipline;
    avatar?: string;
    gender?: 'masculino' | 'femenino' | 'otro';
    birthDate?: string;
    address?: string;
    eps?: string;
    emergencyContact?: { name: string; phone: string; relationship?: string };
    acceptedTerms?: boolean;
  }) => {
    const cleanDoc = data.documentId.trim();
    const cleanPin = (data.pin || '').trim();
    const cleanEmail = (data.email || '').trim().toLowerCase();

    if (!cleanDoc) {
      return { success: false, message: 'El número de documento es obligatorio.' };
    }
    if (!data.name.trim()) {
      return { success: false, message: 'El nombre completo es obligatorio.' };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Debes ingresar un correo electrónico válido (ej: atleta@correo.com).' };
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      return { success: false, message: 'El PIN de acceso debe contener exactamente 4 dígitos numéricos (ej: 1234).' };
    }

    const alreadyExists = athletes.some(
      (a) => a.documentId.trim().toLowerCase() === cleanDoc.toLowerCase()
    );
    if (alreadyExists) {
      return {
        success: false,
        message: `Ya existe un atleta registrado con la identificación ${cleanDoc}. Puedes ingresar directamente con tu documento y PIN.`,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const resolvedDiscipline: AthleteDiscipline = data.discipline || 
      ((data.planName || '').toLowerCase().includes('personalizad') ? 'personalizado' : 
       (data.planName || '').toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');

    const created = addAthlete({
      documentId: cleanDoc,
      pin: cleanPin,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone?.trim() || '',
      avatar: data.avatar || undefined,
      gender: data.gender,
      birthDate: data.birthDate,
      address: data.address?.trim(),
      eps: data.eps?.trim(),
      emergencyContact: data.emergencyContact,
      acceptedTerms: data.acceptedTerms ?? true,
      termsAcceptedAt: new Date().toISOString(),
      discipline: resolvedDiscipline,
      membership: {
        planName: data.planName || 'Pendiente de Asignación / Pago',
        startDate: todayStr,
        endDate: todayStr,
        isActive: false,
        isPendingApproval: true,
        discipline: resolvedDiscipline,
      },
    });

    setCurrentAthleteId(created.id);
    setRole('athlete');
    setIsAuthenticated(true);

    // Registrar en el historial de auditoría
    addActivityLog({
      category: 'ATHLETE',
      action: 'Nuevo Registro de Atleta',
      description: `Atleta ${created.name} registrado con CC ${created.documentId}. Plan solicitado: ${created.membership.planName} (${resolvedDiscipline}).`,
      actor: created.name,
      target: created.documentId,
    });

    // Enviar correo de confirmación y bienvenida
    sendWelcomeRegistrationEmail({
      name: created.name,
      email: created.email,
      documentId: created.documentId,
      pin: created.pin || cleanPin,
    }).catch((err) => {
      console.warn('Error al despachar correo de bienvenida:', err);
    });

    return {
      success: true,
      message: `¡Registro exitoso! Bienvenido a INDOMABLE, ${created.name}. Se ha enviado notificación a ${created.email}. Tu membresía está pendiente de activación tras registrar tu pago.`,
      athlete: created,
    };
  };

  const logout = () => {
    if (role === 'admin' && adminActiveUsername && adminSessionId) {
      releaseAdminSessionLock(adminActiveUsername, adminSessionId).catch(() => {});
    }
    setAdminActiveUsername(null);
    setAdminSessionId(null);
    setIsAuthenticated(false);
    setCurrentCoachId(null);
    logoutOneSignal();
  };

  const forceReleaseAdminSession = async (
    username: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const cleanUser = username.trim().toLowerCase();
      await releaseAdminSessionLock(cleanUser);
      addActivityLog({
        category: 'SECURITY',
        action: 'Liberación de Sesión Administrador',
        description: `Se liberó manualmente la sesión de @${cleanUser}.`,
        actor: role === 'admin' ? 'Administrador' : 'Sistema',
        target: cleanUser,
      });
      return { success: true, message: `Sesión de @${cleanUser} liberada exitosamente.` };
    } catch {
      return { success: false, message: 'No se pudo liberar la sesión.' };
    }
  };

  // Flyers operations
  const saveFlyer = async (flyer: GymFlyer) => {
    const isNewFlyer = !flyers.some((f) => f.id === flyer.id);
    setFlyers((prev) => {
      const exists = prev.some((f) => f.id === flyer.id);
      if (exists) {
        return prev.map((f) => (f.id === flyer.id ? flyer : f));
      }
      return [flyer, ...prev];
    });
    try {
      await syncSaveFlyer(flyer);
    } catch (e) {
      console.warn('Error syncing flyer to Firestore:', e);
    }
    // ÚNICAMENTE disparar notificación si es un anuncio NUEVO y está ACTIVO.
    // NUNCA disparar cuando se ocultan/pausan anuncios (isActive === false) ni cuando se editan existentes.
    if (isNewFlyer && flyer.isActive !== false) {
      // 1. Alerta visual y auditiva inmediata en la app para el usuario que está navegando
      dispatchInAppAlert({
        id: flyer.id,
        title: flyer.title,
        body: flyer.description || 'Nuevo anuncio publicado en INDOMABLE',
        date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      playNotificationSound();

      // 2. Despachar UN SOLO Push de sistema a través de OneSignal para todos los celulares
      sendOneSignalPushNotification({
        title: flyer.title,
        body: flyer.description || 'Nuevo anuncio disponible en INDOMABLE.',
        restApiKey: gymSettings?.oneSignalRestApiKey,
      }).catch((pushErr) => {
        console.warn('[OneSignal] Error despachando Push:', pushErr);
      });
    }
  };

  const deleteFlyer = async (id: string) => {
    setFlyers((prev) => prev.filter((f) => f.id !== id));
    try {
      await syncDeleteFlyer(id);
    } catch (e) {
      console.warn('Error deleting flyer from Firestore:', e);
    }
  };

  // Gym Settings operations
  const updateGymSettings = async (newSettings: Partial<GymSettings>) => {
    setGymSettings((prev) => ({ ...prev, ...newSettings }));
    try {
      await syncSaveGymSettings(newSettings);
    } catch (e) {
      console.warn('Error syncing gym settings to Firestore:', e);
    }
  };

  // Anthropometry operations
  const saveAnthropometry = async (record: AnthropometricMeasurement) => {
    setAnthropometricRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id);
      if (exists) {
        return prev.map((r) => (r.id === record.id ? record : r));
      }
      return [record, ...prev];
    });
    try {
      await syncSaveAnthropometry(record);
    } catch (e) {
      console.warn('Error syncing anthropometry to Firestore:', e);
    }
  };

  const deleteAnthropometry = async (id: string) => {
    setAnthropometricRecords((prev) => prev.filter((r) => r.id !== id));
    try {
      await syncDeleteAnthropometry(id);
    } catch (e) {
      console.warn('Error deleting anthropometry from Firestore:', e);
    }
  };

  // Progress Photos operations
  const saveProgressPhoto = async (photo: ProgressPhoto) => {
    setProgressPhotos((prev) => {
      const exists = prev.some((p) => p.id === photo.id);
      if (exists) {
        return prev.map((p) => (p.id === photo.id ? photo : p));
      }
      return [photo, ...prev];
    });
    try {
      await syncSaveProgressPhoto(photo);
    } catch (e) {
      console.warn('Error syncing progress photo to Firestore:', e);
    }
  };

  const deleteProgressPhoto = async (id: string) => {
    setProgressPhotos((prev) => prev.filter((p) => p.id !== id));
    try {
      await syncDeleteProgressPhoto(id);
    } catch (e) {
      console.warn('Error deleting progress photo from Firestore:', e);
    }
  };

  // Custom Exercises operations
  const addCustomExercise = async (name: string, category: 'olympic' | 'powerlifting' | 'gymnastic' | 'bodybuilding' | 'other' = 'bodybuilding') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const newEx: CustomExercise = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      category,
      createdAt: new Date().toISOString(),
    };
    setCustomExercises((prev) => {
      if (prev.some((e) => e.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, newEx];
    });
    try {
      await syncSaveCustomExercise(newEx);
    } catch (e) {
      console.warn('Error syncing custom exercise to Firestore:', e);
    }
  };

  // Membership Plans operations
  const addPlan = async (planData: Omit<MembershipPlan, 'id'>) => {
    const newPlan: MembershipPlan = {
      ...planData,
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setPlans((prev) => [newPlan, ...prev]);
    try {
      await syncSaveMembershipPlan(newPlan);
    } catch (e) {
      console.warn('Error syncing new plan to Firestore:', e);
    }
    return { success: true, message: `Plan "${newPlan.name}" creado con éxito.`, plan: newPlan };
  };

  const updatePlan = async (id: string, updates: Partial<MembershipPlan>) => {
    const target = plans.find((p) => p.id === id);
    if (!target) return { success: false, message: 'Plan no encontrado.' };
    const updatedPlan: MembershipPlan = { ...target, ...updates };
    setPlans((prev) => prev.map((p) => (p.id === id ? updatedPlan : p)));
    try {
      await syncSaveMembershipPlan(updatedPlan);
    } catch (e) {
      console.warn('Error syncing updated plan to Firestore:', e);
    }
    return { success: true, message: `Plan "${updatedPlan.name}" actualizado correctamente.` };
  };

  const deletePlan = async (id: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await syncDeleteMembershipPlan(id);
    } catch (e) {
      console.warn('Error deleting plan from Firestore:', e);
    }
    return { success: true, message: 'Plan eliminado.' };
  };

  // Accounting Transactions operations
  const addTransaction = async (tx: AccountingTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    try {
      await saveTransactionInFirestore(tx);
      if (gymSettings?.googleSheetsAccountingWebhookUrl) {
        sendTransactionToGoogleSheets(tx, gymSettings.googleSheetsAccountingWebhookUrl).catch(() => {});
      }
    } catch (e) {
      console.warn('Error saving transaction to Firestore:', e);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransactionInFirestore(id);
    } catch (e) {
      console.warn('Error deleting transaction from Firestore:', e);
    }
  };

  // Maintenance mode operations
  const isMaintenanceMode = Boolean(gymSettings?.isMaintenanceMode);
  const setMaintenanceMode = async (enabled: boolean, message?: string) => {
    await updateGymSettings({
      isMaintenanceMode: enabled,
      maintenanceMessage: message || 'Estamos realizando labores de mantenimiento y optimización en el box. Volveremos pronto.',
    });
  };

  const resetToDefaultData = () => {
    localStorage.removeItem(`${STORAGE_KEY}_athletes`);
    localStorage.removeItem(`${STORAGE_KEY}_wods`);
    localStorage.removeItem(`${STORAGE_KEY}_slots`);
    localStorage.removeItem(`${STORAGE_KEY}_rms`);
    localStorage.removeItem(`${STORAGE_KEY}_wodlogs`);
    localStorage.removeItem(`${STORAGE_KEY}_coach_pin`);
    localStorage.removeItem(`${STORAGE_KEY}_flyers`);
    localStorage.removeItem(`${STORAGE_KEY}_anthropometry`);
    localStorage.removeItem(`${STORAGE_KEY}_custom_exercises`);
    localStorage.removeItem(`${STORAGE_KEY}_membership_plans`);

    setCoachPin('1234');
    setAthletes(INITIAL_ATHLETES);
    setWods(INITIAL_WODS);
    setRms(INITIAL_RMS);
    setWodLogs(INITIAL_WOD_LOGS);
    setFlyers(INITIAL_FLYERS);
    setAnthropometricRecords([]);
    setCustomExercises([]);
    setPlans(DEFAULT_MEMBERSHIP_PLANS);

    const allInitialSlots: ClassSlot[] = [];
    for (let i = -2; i <= 6; i++) {
      const d = getFormattedDate(i);
      allInitialSlots.push(...generateDefaultSlotsForDate(d));
    }
    setSlots(deduplicateSlots(allInitialSlots));
  };

  return (
    <GymContext.Provider
      value={{
        role,
        setRole,
        currentAthleteId,
        setCurrentAthleteId,
        currentAthlete,
        athletes,
        isAuthenticated,
        coachPin,
        updateCoachPin,
        refreshCurrentAthlete,
        loginWithDocumentId,
        loginAsCoachWithPin,
        currentCoachId,
        currentCoach,
        coaches,
        adminCredentials,
        loginAsCoach,
        loginAsAdmin,
        loginAsTestUser,
        isPaymentModalOpen,
        openPaymentModal,
        closePaymentModal,
        updateAdminPassword,
        adminActiveUsername,
        forceReleaseAdminSession,
        addCoach,
        updateCoach,
        deleteCoach,
        registerAthlete,
        resetAthletePin,
        logout,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        renewAthleteMembership,
        approveAthleteMembership,
        selectedDate,
        setSelectedDate,
        wods,
        currentWod,
        saveWod,
        slots,
        slotsForSelectedDate,
        bookSlot,
        cancelBooking,
        toggleSlotEnabled,
        updateSlotCapacity,
        markAttendance,
        generateWeekSchedule,
        addNewSlot,
        rms,
        activeUnit,
        setActiveUnit,
        saveRM,
        deleteRM,
        wodLogs,
        saveWodLog,
        deleteWodLog,
        activityLogs,
        addActivityLog,
        clearActivityLogs,
        purgeActivityLogs,
        athleteDiscipline,
        isCrossFitAthlete,
        isMusculacionAthlete,
        isPersonalizadoAthlete,
        flyers,
        saveFlyer,
        deleteFlyer,
        anthropometricRecords,
        athleteAnthropometry,
        saveAnthropometry,
        deleteAnthropometry,
        progressPhotos,
        athleteProgressPhotos,
        saveProgressPhoto,
        deleteProgressPhoto,
        customExercises,
        addCustomExercise,
        gymSettings,
        updateGymSettings,
        plans,
        addPlan,
        updatePlan,
        deletePlan,
        transactions,
        addTransaction,
        deleteTransaction,
        isMaintenanceMode,
        setMaintenanceMode,
        resetToDefaultData,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
