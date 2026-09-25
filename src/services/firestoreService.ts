import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  where,
  Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';
import {
  AthleteProfile,
  ClassSlot,
  PersonalRecord,
  WODResultLog,
  WODSchedule,
  ActivityLogRecord,
  CoachUser,
  AdminCredentials,
  AdminSessionLock,
  GymFlyer,
  AnthropometricMeasurement,
  ProgressPhoto,
  CustomExercise,
  GymSettings,
  MembershipPlan,
} from '../types';

// Colecciones principales de Firestore
const ATHLETES_COL = 'athletes';
const SLOTS_COL = 'slots';
const WODS_COL = 'wods';
const RMS_COL = 'rms';
const WOD_LOGS_COL = 'wodLogs';
const COACHES_COL = 'coaches';
const CONFIG_COL = 'config';
const COACH_CONFIG_DOC = 'coach_settings';
const ADMIN_CONFIG_DOC = 'admin_settings';
const GYM_SETTINGS_DOC = 'gym_settings';
const ACTIVITY_LOGS_COL = 'activityLogs';
const FLYERS_COL = 'flyers';
const ANTHROPOMETRY_COL = 'anthropometry';
const PROGRESS_PHOTOS_COL = 'progress_photos';
const CUSTOM_EXERCISES_COL = 'customExercises';
const ADMIN_SESSIONS_COL = 'adminSessions';
const MEMBERSHIP_PLANS_COL = 'membershipPlans';

/**
 * Limpia recursivamente objetos para Firestore eliminando propiedades `undefined`
 * o convirtiéndolas en `null` para prevenir excepciones de serialización.
 */
export const cleanForFirestore = <T>(obj: T): T => {
  if (obj === undefined || obj === null) return obj;
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
};

// ==========================================
// 1. SUSCRIPCIONES EN TIEMPO REAL (onSnapshot)
// ==========================================

export const subscribeAthletesLive = (
  callback: (athletes: AthleteProfile[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, ATHLETES_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const athletes: AthleteProfile[] = [];
        snapshot.forEach((docSnap) => {
          athletes.push({ id: docSnap.id, ...(docSnap.data() as Omit<AthleteProfile, 'id'>) });
        });
        callback(athletes);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a Atletas:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a Atletas:', err);
    return null;
  }
};

export const subscribeSlotsLive = (
  callback: (slots: ClassSlot[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, SLOTS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const slots: ClassSlot[] = [];
        snapshot.forEach((docSnap) => {
          slots.push({ id: docSnap.id, ...(docSnap.data() as Omit<ClassSlot, 'id'>) });
        });
        callback(slots);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a Slots:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a Slots:', err);
    return null;
  }
};

export const subscribeWodsLive = (
  callback: (wods: WODSchedule[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, WODS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const wods: WODSchedule[] = [];
        snapshot.forEach((docSnap) => {
          wods.push({ id: docSnap.id, ...(docSnap.data() as Omit<WODSchedule, 'id'>) });
        });
        callback(wods);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a WODs:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a WODs:', err);
    return null;
  }
};

export const subscribeRMsLive = (
  callback: (rms: PersonalRecord[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, RMS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const rms: PersonalRecord[] = [];
        snapshot.forEach((docSnap) => {
          rms.push({ id: docSnap.id, ...(docSnap.data() as Omit<PersonalRecord, 'id'>) });
        });
        callback(rms);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a RMs:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a RMs:', err);
    return null;
  }
};

export const subscribeWodLogsLive = (
  callback: (logs: WODResultLog[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, WOD_LOGS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const logs: WODResultLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<WODResultLog, 'id'>) });
        });
        callback(logs);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a WOD Logs:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a WOD Logs:', err);
    return null;
  }
};

export const subscribeCoachPinLive = (
  callback: (pin: string) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, CONFIG_COL, COACH_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && typeof data.coachPin === 'string') {
            callback(data.coachPin);
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Error leyendo configuración del coach:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a PIN del coach:', err);
    return null;
  }
};

// ==========================================
// 2. OPERACIONES DE ESCRITURA Y ACTUALIZACIÓN
// ==========================================

export const syncSaveAthlete = async (athlete: AthleteProfile): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, ATHLETES_COL, athlete.id);
  await setDoc(docRef, cleanForFirestore(athlete), { merge: true });
};

export const syncUpdateAthlete = async (id: string, updates: Partial<AthleteProfile>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('[Firestore] Base de datos no disponible para actualizar atleta:', id);
    return;
  }
  const docRef = doc(db, ATHLETES_COL, id);
  const cleaned = cleanForFirestore(updates);
  await setDoc(docRef, cleaned, { merge: true });
  console.log('[Firestore] Atleta actualizado en la nube exitosamente:', id, cleaned);
};

export const syncDeleteAthlete = async (id: string, documentId?: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) {
    console.warn('[Firestore] Base de datos no disponible para eliminar atleta:', id);
    return;
  }
  try {
    const docRef = doc(db, ATHLETES_COL, id);
    await deleteDoc(docRef);

    // Si tiene documentId (cédula), buscar y borrar cualquier registro duplicado o residual con esa cédula
    if (documentId && documentId.trim()) {
      const cleanDoc = documentId.trim();
      const colRef = collection(db, ATHLETES_COL);
      const q = query(colRef, where('documentId', '==', cleanDoc));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if (d.id !== id) {
          await deleteDoc(doc(db, ATHLETES_COL, d.id));
        }
      }
    }
    console.log('[Firestore] Atleta eliminado de forma definitiva de Firestore:', id, documentId);
  } catch (err) {
    console.error('[Firestore] Error eliminando atleta de Firestore:', err);
    throw err;
  }
};

/**
 * Consulta directa a Firestore por número de identificación/cédula.
 * Esencial para permitir inicio de sesión inmediato en dispositivos secundarios
 * antes de que la suscripción en tiempo real termine de poblar el estado local.
 */
export const findAthleteByDocumentIdInFirestore = async (documentId: string): Promise<AthleteProfile | null> => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const cleanDoc = documentId.trim().toLowerCase();
    const colRef = collection(db, ATHLETES_COL);

    // Consulta exacta
    const q = query(colRef, where('documentId', '==', documentId.trim()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...(d.data() as Omit<AthleteProfile, 'id'>) };
    }

    // Consulta de respaldo insensible a mayúsculas/minúsculas
    const allSnap = await getDocs(colRef);
    for (const d of allSnap.docs) {
      const data = d.data() as Omit<AthleteProfile, 'id'>;
      if (data.documentId && data.documentId.trim().toLowerCase() === cleanDoc) {
        return { id: d.id, ...data };
      }
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Error buscando atleta en la nube por cédula:', err);
    return null;
  }
};

export const syncSaveSlot = async (slot: ClassSlot): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, SLOTS_COL, slot.id);
  await setDoc(docRef, cleanForFirestore(slot), { merge: true });
};

export const syncBookSlot = async (slotId: string, athleteId: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, SLOTS_COL, slotId);
  await updateDoc(docRef, {
    attendeeIds: arrayUnion(athleteId),
  });
};

export const syncCancelBooking = async (slotId: string, athleteId: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, SLOTS_COL, slotId);
  await updateDoc(docRef, {
    attendeeIds: arrayRemove(athleteId),
  });
};

export const syncUpdateSlot = async (slotId: string, updates: Partial<ClassSlot>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, SLOTS_COL, slotId);
  await updateDoc(docRef, cleanForFirestore(updates));
};

export const syncDeleteSlot = async (slotId: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, SLOTS_COL, slotId);
  await deleteDoc(docRef);
};

export const syncSaveWod = async (wod: WODSchedule): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, WODS_COL, wod.id);
  await setDoc(docRef, cleanForFirestore(wod), { merge: true });
};

export const syncSaveRM = async (rm: PersonalRecord): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, RMS_COL, rm.id);
  await setDoc(docRef, cleanForFirestore(rm), { merge: true });
};

export const syncDeleteRM = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, RMS_COL, id);
  await deleteDoc(docRef);
};

export const syncSaveWodLog = async (log: WODResultLog): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, WOD_LOGS_COL, log.id);
  await setDoc(docRef, cleanForFirestore(log), { merge: true });
};

export const syncDeleteWodLog = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, WOD_LOGS_COL, id);
  await deleteDoc(docRef);
};

export const syncSaveCoachPin = async (newPin: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, CONFIG_COL, COACH_CONFIG_DOC);
  await setDoc(docRef, { coachPin: newPin, updatedAt: new Date().toISOString() }, { merge: true });
};

// ==========================================
// 3. HISTORIAL & AUDITORÍA DE ACCIONES COACH
// ==========================================

export const subscribeActivityLogsLive = (
  callback: (logs: ActivityLogRecord[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, ACTIVITY_LOGS_COL);
    const q = query(colRef, orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: ActivityLogRecord[] = [];
        snapshot.forEach((docSnap) => {
          logs.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityLogRecord, 'id'>) });
        });
        callback(logs);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a logs de actividad:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a logs de actividad:', err);
    return null;
  }
};

export const syncSaveActivityLog = async (log: ActivityLogRecord): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, ACTIVITY_LOGS_COL, log.id);
    await setDoc(docRef, cleanForFirestore(log), { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error guardando registro de actividad:', err);
  }
};

export const syncClearActivityLogs = async (): Promise<void> => {
  return syncPurgeActivityLogs(null);
};

export const syncPurgeActivityLogs = async (cutoffIso: string | null): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const colRef = collection(db, ACTIVITY_LOGS_COL);
    const snap = await getDocs(colRef);
    const cutoffMs = cutoffIso ? new Date(cutoffIso).getTime() : null;
    for (const docSnap of snap.docs) {
      if (!cutoffMs) {
        await deleteDoc(docSnap.ref);
      } else {
        const data = docSnap.data();
        const ts = data.timestamp;
        if (!ts || new Date(ts).getTime() < cutoffMs) {
          await deleteDoc(docSnap.ref);
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error purgando logs de actividad:', err);
  }
};

// ==========================================
// 4. GESTIÓN DE COACHES Y ADMINISTRADOR
// ==========================================

export const subscribeCoachesLive = (
  callback: (coaches: CoachUser[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, COACHES_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const coaches: CoachUser[] = [];
        snapshot.forEach((docSnap) => {
          coaches.push({ id: docSnap.id, ...(docSnap.data() as Omit<CoachUser, 'id'>) });
        });
        callback(coaches);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a Coaches:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a Coaches:', err);
    return null;
  }
};

export const syncSaveCoachUser = async (coach: CoachUser): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, COACHES_COL, coach.id);
  await setDoc(docRef, cleanForFirestore(coach), { merge: true });
};

export const syncDeleteCoachUser = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, COACHES_COL, id);
  await deleteDoc(docRef);
};

export const subscribeAdminCredentialsLive = (
  callback: (creds: AdminCredentials) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, CONFIG_COL, ADMIN_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as AdminCredentials;
          if (data) {
            callback(data);
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Error leyendo credenciales de admin:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a credenciales de admin:', err);
    return null;
  }
};

export const syncSaveAdminCredentials = async (creds: AdminCredentials): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, CONFIG_COL, ADMIN_CONFIG_DOC);
  await setDoc(docRef, cleanForFirestore(creds), { merge: true });
};

export const seedFirestoreIfEmpty = async (initialData: {
  slots: ClassSlot[];
  wods: WODSchedule[];
  coachPin: string;
}): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    // Check if slots exist
    const slotsSnap = await getDocs(collection(db, SLOTS_COL));
    if (slotsSnap.empty && initialData.slots.length > 0) {
      for (const slot of initialData.slots) {
        await setDoc(doc(db, SLOTS_COL, slot.id), slot);
      }
    }

    // Los atletas NUNCA se siembran automáticamente desde la app cliente.
    // Solo existen mediante registros explícitos de usuarios o gestión desde el panel de control.

    // Check if wods exist
    const wodsSnap = await getDocs(collection(db, WODS_COL));
    if (wodsSnap.empty && initialData.wods.length > 0) {
      for (const wod of initialData.wods) {
        await setDoc(doc(db, WODS_COL, wod.id), wod);
      }
    }

    // Check coach pin (legacy backup)
    const coachDoc = await getDoc(doc(db, CONFIG_COL, COACH_CONFIG_DOC));
    if (!coachDoc.exists()) {
      await setDoc(doc(db, CONFIG_COL, COACH_CONFIG_DOC), {
        coachPin: initialData.coachPin || '1234',
        updatedAt: new Date().toISOString(),
      });
    }

    // Check Admin Master Credentials
    const adminDoc = await getDoc(doc(db, CONFIG_COL, ADMIN_CONFIG_DOC));
    if (!adminDoc.exists()) {
      await setDoc(doc(db, CONFIG_COL, ADMIN_CONFIG_DOC), {
        username: 'admin',
        email: 'alejandroescaev@gmail.com',
        password: 'AdminIndomable2026!*',
        updatedAt: new Date().toISOString(),
      });
    }

    // Check Coaches collection
    const coachesSnap = await getDocs(collection(db, COACHES_COL));
    if (coachesSnap.empty) {
      const defaultCoach: CoachUser = {
        id: 'coach-default-1',
        name: 'Coach Principal',
        username: 'coach',
        email: 'coach@indomable.com',
        password: 'CoachIndomable2026!*',
        phone: '3001234567',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, COACHES_COL, defaultCoach.id), defaultCoach);
    }
  } catch (err) {
    console.warn('[Firestore] Error al inicializar/sincronizar datos iniciales:', err);
  }
};

const EMAIL_CONFIG_DOC = 'email_settings';
const SENT_EMAILS_COL = 'sentEmails';

export const subscribeEmailConfigLive = (
  callback: (config: any) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, CONFIG_COL, EMAIL_CONFIG_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            callback(data);
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Error leyendo configuración de email:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a configuración de email:', err);
    return null;
  }
};

export const syncSaveEmailConfig = async (config: any): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, CONFIG_COL, EMAIL_CONFIG_DOC);
  await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
};

export const subscribeSentEmailsLive = (
  callback: (emails: any[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, SENT_EMAILS_COL);
    const q = query(colRef, orderBy('sentAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const emails: any[] = [];
        snapshot.forEach((docSnap) => {
          emails.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(emails);
      },
      (error) => {
        console.warn('[Firestore] Error leyendo historial de correos:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a historial de correos:', err);
    return null;
  }
};

export const syncSaveSentEmail = async (record: any): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const docRef = doc(db, SENT_EMAILS_COL, record.id);
    await setDoc(docRef, record, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error guardando registro de correo enviado:', err);
  }
};

export const syncClearSentEmails = async (): Promise<void> => {
  return syncPurgeSentEmails(null);
};

export const syncPurgeSentEmails = async (cutoffIso: string | null): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  try {
    const colRef = collection(db, SENT_EMAILS_COL);
    const snap = await getDocs(colRef);
    const cutoffMs = cutoffIso ? new Date(cutoffIso).getTime() : null;
    for (const docSnap of snap.docs) {
      if (!cutoffMs) {
        await deleteDoc(docSnap.ref);
      } else {
        const data = docSnap.data();
        const sentAt = data.sentAt;
        if (!sentAt || new Date(sentAt).getTime() < cutoffMs) {
          await deleteDoc(docSnap.ref);
        }
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error purgando historial de correos enviados:', err);
  }
};

// ==========================================
// 6. FLYERS & COMUNICADOS INFORMATIVOS
// ==========================================

export const subscribeFlyersLive = (
  callback: (flyers: GymFlyer[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, FLYERS_COL);
    const q = query(colRef, orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: GymFlyer[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<GymFlyer, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('[Firestore] Error suscribiendo a flyers:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a flyers:', err);
    return null;
  }
};

export const syncSaveFlyer = async (flyer: GymFlyer): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, FLYERS_COL, flyer.id);
  await setDoc(docRef, cleanForFirestore(flyer), { merge: true });
};

export const syncDeleteFlyer = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, FLYERS_COL, id);
  await deleteDoc(docRef);
};

// ==========================================
// 7. MEDIDAS ANTROPOMÉTRICAS
// ==========================================

export const subscribeAnthropometryLive = (
  callback: (records: AnthropometricMeasurement[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, ANTHROPOMETRY_COL);
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: AnthropometricMeasurement[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<AnthropometricMeasurement, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('[Firestore] Error suscribiendo a medidas antropométricas:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a medidas antropométricas:', err);
    return null;
  }
};

export const syncSaveAnthropometry = async (record: AnthropometricMeasurement): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, ANTHROPOMETRY_COL, record.id);
  await setDoc(docRef, cleanForFirestore(record), { merge: true });
};

export const syncDeleteAnthropometry = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, ANTHROPOMETRY_COL, id);
  await deleteDoc(docRef);
};

// ==========================================
// 7.1 FOTOS DE PROGRESO FÍSICO (ANTES / DESPUÉS)
// ==========================================

export const subscribeProgressPhotosLive = (
  callback: (photos: ProgressPhoto[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, PROGRESS_PHOTOS_COL);
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: ProgressPhoto[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<ProgressPhoto, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('[Firestore] Error suscribiendo a fotos de progreso:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a fotos de progreso:', err);
    return null;
  }
};

export const syncSaveProgressPhoto = async (photo: ProgressPhoto): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, PROGRESS_PHOTOS_COL, photo.id);
  await setDoc(docRef, cleanForFirestore(photo), { merge: true });
};

export const syncDeleteProgressPhoto = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, PROGRESS_PHOTOS_COL, id);
  await deleteDoc(docRef);
};

// ==========================================
// 8. EJERCICIOS PERSONALIZADOS
// ==========================================

export const subscribeCustomExercisesLive = (
  callback: (exercises: CustomExercise[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, CUSTOM_EXERCISES_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: CustomExercise[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<CustomExercise, 'id'>) });
        });
        callback(list);
      },
      (error) => {
        console.warn('[Firestore] Error suscribiendo a ejercicios personalizados:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a ejercicios personalizados:', err);
    return null;
  }
};

export const syncSaveCustomExercise = async (ex: CustomExercise): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, CUSTOM_EXERCISES_COL, ex.id);
  await setDoc(docRef, cleanForFirestore(ex), { merge: true });
};

export const subscribeGymSettingsLive = (
  callback: (settings: GymSettings) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const docRef = doc(db, CONFIG_COL, GYM_SETTINGS_DOC);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as GymSettings;
          if (data) {
            callback(data);
          }
        }
      },
      (error) => {
        console.warn('[Firestore] Error leyendo configuración de gimnasio:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a configuración de gimnasio:', err);
    return null;
  }
};

export const syncSaveGymSettings = async (settings: Partial<GymSettings>): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, CONFIG_COL, GYM_SETTINGS_DOC);
  await setDoc(docRef, cleanForFirestore({ ...settings, updatedAt: new Date().toISOString() }), { merge: true });
};

// ============================================================================
// CONTROL DE CONCURRENCIA DE SESIÓN ÚNICA DE ADMINISTRADOR
// ============================================================================

const ADMIN_SESSION_HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos de tolerancia de latido

/**
 * Verifica si existe una sesión activa para un usuario administrador.
 * Si la sesión existente tiene un sessionId diferente y el latido está dentro de los 3 minutos,
 * se considera bloqueada (activa en otro dispositivo).
 */
export const checkAdminSessionLock = async (
  username: string,
  mySessionId?: string
): Promise<{ isLocked: boolean; lock?: AdminSessionLock; message?: string }> => {
  const db = getFirebaseDb();
  if (!db) return { isLocked: false };

  try {
    const cleanUser = username.trim().toLowerCase();
    const docRef = doc(db, ADMIN_SESSIONS_COL, cleanUser);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { isLocked: false };
    }

    const lock = snap.data() as AdminSessionLock;
    if (!lock || !lock.activeSessionId) {
      return { isLocked: false, lock };
    }

    // Si es la misma sesión de este dispositivo, no está bloqueada
    if (mySessionId && lock.activeSessionId === mySessionId) {
      return { isLocked: false, lock };
    }

    // Comprobar si el latido sigue vigente (menos de 3 minutos)
    const lastHbTime = new Date(lock.lastHeartbeat || 0).getTime();
    const now = Date.now();
    const isStillActive = now - lastHbTime < ADMIN_SESSION_HEARTBEAT_TIMEOUT_MS;

    if (isStillActive) {
      return {
        isLocked: true,
        lock,
        message: 'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
      };
    }

    // Si pasaron más de 3 minutos sin latido, la sesión previa se considera inactiva/expirada
    return { isLocked: false, lock };
  } catch (err) {
    console.warn('[Firestore] Error al verificar bloqueo de sesión de administrador:', err);
    return { isLocked: false };
  }
};

/**
 * Adquiere el bloqueo de sesión única para un administrador en este dispositivo.
 * Si otro dispositivo ya tiene el bloqueo activo y reciente, rechaza la operación
 * SIN interrumpir la sesión original.
 */
export const acquireAdminSessionLock = async (
  username: string,
  sessionId: string,
  userAgent?: string
): Promise<{ success: boolean; message?: string }> => {
  const db = getFirebaseDb();
  if (!db) return { success: true };

  try {
    const cleanUser = username.trim().toLowerCase();
    const status = await checkAdminSessionLock(cleanUser, sessionId);

    if (status.isLocked) {
      return {
        success: false,
        message:
          status.message ||
          'El usuario administrador se encuentra activo en otra sesión. Por favor solicitar liberación de la cuenta.',
      };
    }

    const docRef = doc(db, ADMIN_SESSIONS_COL, cleanUser);
    const lockData: AdminSessionLock = {
      username: cleanUser,
      activeSessionId: sessionId,
      lastHeartbeat: new Date().toISOString(),
      userAgent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Desconocido'),
    };

    await setDoc(docRef, cleanForFirestore(lockData), { merge: true });
    return { success: true };
  } catch (err) {
    console.error('[Firestore] Error al adquirir bloqueo de sesión de administrador:', err);
    return { success: false, message: 'Error al verificar concurrencia de sesión en la nube.' };
  }
};

/**
 * Actualiza el latido (heartbeat) de la sesión activa para evitar expiración.
 */
export const heartbeatAdminSessionLock = async (
  username: string,
  sessionId: string
): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const cleanUser = username.trim().toLowerCase();
    const docRef = doc(db, ADMIN_SESSIONS_COL, cleanUser);
    // Verificar que el documento siga perteneciendo a esta sesión antes de actualizar
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdminSessionLock;
      if (data && data.activeSessionId === sessionId) {
        await updateDoc(docRef, {
          lastHeartbeat: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error en latido de sesión de administrador:', err);
  }
};

/**
 * Libera el bloqueo de sesión cuando el administrador cierra sesión voluntariamente.
 */
export const releaseAdminSessionLock = async (
  username: string,
  sessionId?: string
): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const cleanUser = username.trim().toLowerCase();
    const docRef = doc(db, ADMIN_SESSIONS_COL, cleanUser);

    if (sessionId) {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as AdminSessionLock;
        if (data && data.activeSessionId === sessionId) {
          await updateDoc(docRef, {
            activeSessionId: '',
            lastHeartbeat: new Date(0).toISOString(),
          });
        }
      }
    } else {
      // Liberación forzada
      await updateDoc(docRef, {
        activeSessionId: '',
        lastHeartbeat: new Date(0).toISOString(),
      });
    }
  } catch (err) {
    console.warn('[Firestore] Error al liberar sesión de administrador:', err);
  }
};

// ==========================================
// 12. GESTIÓN DE PLANES Y CATEGORÍAS (MEMBERSHIP PLANS)
// ==========================================

export const subscribeMembershipPlansLive = (
  callback: (plans: MembershipPlan[]) => void
): Unsubscribe | null => {
  const db = getFirebaseDb();
  if (!db) return null;

  try {
    const colRef = collection(db, MEMBERSHIP_PLANS_COL);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const plans: MembershipPlan[] = [];
        snapshot.forEach((docSnap) => {
          plans.push({ id: docSnap.id, ...(docSnap.data() as Omit<MembershipPlan, 'id'>) });
        });
        callback(plans);
      },
      (error) => {
        console.warn('[Firestore] Error en suscripción a Planes:', error);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir a Planes:', err);
    return null;
  }
};

export const syncSaveMembershipPlan = async (plan: MembershipPlan): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, MEMBERSHIP_PLANS_COL, plan.id);
  await setDoc(docRef, cleanForFirestore(plan), { merge: true });
};

export const syncDeleteMembershipPlan = async (id: string): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;
  const docRef = doc(db, MEMBERSHIP_PLANS_COL, id);
  await deleteDoc(docRef);
};

export const seedMembershipPlansIfEmpty = async (
  defaultPlans: MembershipPlan[]
): Promise<void> => {
  const db = getFirebaseDb();
  if (!db) return;

  try {
    const plansSnap = await getDocs(collection(db, MEMBERSHIP_PLANS_COL));
    if (plansSnap.empty) {
      console.log('[Firestore] Inicializando planes de membresía por defecto...');
      for (const p of defaultPlans) {
        await setDoc(doc(db, MEMBERSHIP_PLANS_COL, p.id), cleanForFirestore(p));
      }
    }
  } catch (err) {
    console.warn('[Firestore] Excepción al verificar inicialización de planes:', err);
  }
};
