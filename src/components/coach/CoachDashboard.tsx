import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { ClassSlot, WODSchedule, WODType } from '../../types';
import { AthleteManagementView } from './AthleteManagementView';
import { CoachActivityLogView } from './CoachActivityLogView';
import { CoachUserManagementView } from './CoachUserManagementView';
import { AdminFlyersManagementView } from './AdminFlyersManagementView';
import { AdminAccountingView } from './AdminAccountingView';
import {
  Shield,
  Calendar,
  Clock,
  Plus,
  Edit3,
  Users,
  Flame,
  DollarSign,
  Wrench,
  UserCheck,
  UserX,
  X,
  Check,
  Sun,
  Moon,
  ChevronRight,
  KeyRound,
  Mail,
  Send,
  Lock,
  AlertCircle,
  CheckCircle2,
  Settings,
  Trash2,
  History,
  Megaphone,
  Sparkles,
  MessageCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  getSentEmailsHistory,
  clearSentEmailsHistory,
  purgeSentEmailsHistory,
  PurgeEmailTimeRange,
  getEmailConfig,
  saveEmailConfig,
  SentEmailRecord,
  EmailServiceConfig,
} from '../../services/emailService';
import {
  subscribeEmailConfigLive,
  subscribeSentEmailsLive,
} from '../../services/firestoreService';

export const CoachDashboard: React.FC = () => {
  const {
    role,
    coaches,
    selectedDate,
    setSelectedDate,
    slotsForSelectedDate,
    toggleSlotEnabled,
    updateSlotCapacity,
    addNewSlot,
    cancelBooking,
    currentWod,
    saveWod,
    athletes,
    gymSettings,
    updateGymSettings,
    activityLogs,
    isMaintenanceMode,
    setMaintenanceMode,
  } = useGym();

  // Active Tab for Coach/Admin: Athletes vs Schedule vs Accounting vs Coaches vs Info
  const [activeCoachTab, setActiveCoachTab] = useState<
    'athletes' | 'schedule' | 'accounting' | 'coaches' | 'info'
  >('athletes');

  // Sub-tab for unified INFORMACIÓN menu (Admin only)
  const [activeInfoSubTab, setActiveInfoSubTab] = useState<'flyers' | 'history' | 'communication' | 'maintenance'>('flyers');
  const [maintenanceMsgInput, setMaintenanceMsgInput] = useState(gymSettings?.maintenanceMessage || '');
  const [isSavingMaintenanceMsg, setIsSavingMaintenanceMsg] = useState(false);
  const [maintenanceSavedNotice, setMaintenanceSavedNotice] = useState(false);

  useEffect(() => {
    if (gymSettings?.maintenanceMessage !== undefined) {
      setMaintenanceMsgInput(gymSettings.maintenanceMessage);
    }
  }, [gymSettings?.maintenanceMessage]);

  useEffect(() => {
    if (role === 'coach' && (activeCoachTab === 'coaches' || activeCoachTab === 'info' || activeCoachTab === 'accounting')) {
      setActiveCoachTab('athletes');
    }
  }, [role, activeCoachTab]);

  // WhatsApp Community link state (Admin only)
  const [whatsappUrlInput, setWhatsappUrlInput] = useState(gymSettings?.whatsappGroupUrl || '');
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [whatsappStatusMsg, setWhatsappStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (gymSettings?.whatsappGroupUrl !== undefined) {
      setWhatsappUrlInput(gymSettings.whatsappGroupUrl);
    }
  }, [gymSettings?.whatsappGroupUrl]);

  // Email notifications state
  const [sentEmails, setSentEmails] = useState<SentEmailRecord[]>(() => getSentEmailsHistory());
  const [showPurgeEmailModal, setShowPurgeEmailModal] = useState(false);
  const [purgeEmailFeedback, setPurgeEmailFeedback] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [emailConfig, setEmailConfig] = useState<EmailServiceConfig>(() => getEmailConfig());
  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  useEffect(() => {
    // 1. Suscribirse a la configuración de Email en la nube de Firestore
    const unsubEmail = subscribeEmailConfigLive((cloudConfig) => {
      if (cloudConfig && typeof cloudConfig === 'object') {
        setEmailConfig((prev) => ({
          ...prev,
          ...cloudConfig,
        }));
      }
    });

    // 2. Suscribirse al historial de correos enviados en Firestore
    const unsubHistory = subscribeSentEmailsLive((cloudEmails) => {
      if (cloudEmails && Array.isArray(cloudEmails)) {
        setSentEmails(cloudEmails);
      }
    });

    // 3. Respaldo por eventos locales
    const handleEmailEvent = () => {
      setSentEmails(getSentEmailsHistory());
    };
    window.addEventListener('indomable:email-sent', handleEmailEvent);

    return () => {
      unsubEmail?.();
      unsubHistory?.();
      window.removeEventListener('indomable:email-sent', handleEmailEvent);
    };
  }, []);


  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappStatusMsg(null);
    const cleanUrl = whatsappUrlInput.trim();

    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      setWhatsappStatusMsg({
        type: 'error',
        text: 'El enlace debe comenzar con https:// (por ejemplo: https://chat.whatsapp.com/...)',
      });
      return;
    }

    setIsSavingWhatsApp(true);
    try {
      await updateGymSettings({ whatsappGroupUrl: cleanUrl });
      setWhatsappStatusMsg({
        type: 'success',
        text: cleanUrl ? '¡Enlace de WhatsApp actualizado con éxito!' : 'Enlace de WhatsApp desvinculado.',
      });
      setTimeout(() => {
        setWhatsappStatusMsg(null);
      }, 4000);
    } catch (err: any) {
      setWhatsappStatusMsg({
        type: 'error',
        text: err?.message || 'Error al guardar el enlace de WhatsApp.',
      });
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleTestWhatsAppLink = () => {
    const cleanUrl = whatsappUrlInput.trim() || gymSettings?.whatsappGroupUrl?.trim();
    if (!cleanUrl) {
      alert('Ingresa primero un enlace de WhatsApp para probarlo.');
      return;
    }
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  // Purge sent email history by time range
  const handlePurgeEmailHistory = (range: PurgeEmailTimeRange) => {
    const updated = purgeSentEmailsHistory(range);
    setSentEmails(updated);
    setShowPurgeEmailModal(false);
    const msg =
      range === 'all'
        ? 'Historial de correos vaciado completamente.'
        : range === 'day'
        ? 'Se han depurado los correos de más de 24 horas.'
        : range === 'week'
        ? 'Se han depurado los correos de más de 7 días.'
        : 'Se han depurado los correos de más de 30 días.';
    setPurgeEmailFeedback(msg);
    setTimeout(() => setPurgeEmailFeedback(null), 4000);
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveEmailConfig(emailConfig);
    setConfigSavedNotice(true);
    setTimeout(() => {
      setConfigSavedNotice(false);
      setShowConfigModal(false);
    }, 1500);
  };

  // Modals state
  const [isWodModalOpen, setIsWodModalOpen] = useState(false);
  const [selectedSlotForAttendees, setSelectedSlotForAttendees] = useState<ClassSlot | null>(null);
  const [isNewSlotModalOpen, setIsNewSlotModalOpen] = useState(false);

  // WOD Form state
  const [wodTitle, setWodTitle] = useState(currentWod?.title || '');
  const [wodType, setWodType] = useState<WODType>(currentWod?.wodType || 'FOR_TIME');
  const [timeCap, setTimeCap] = useState(currentWod?.timeCapMinutes?.toString() || '18');
  const [warmup, setWarmup] = useState(currentWod?.warmup || '');
  const [strengthSkill, setStrengthSkill] = useState(currentWod?.strengthSkill || '');
  const [metcon, setMetcon] = useState(currentWod?.metcon || '');
  const [scalingNotes, setScalingNotes] = useState(currentWod?.scalingNotes || '');
  const [coachNotes, setCoachNotes] = useState(currentWod?.coachNotes || '');
  const [specialConsiderations, setSpecialConsiderations] = useState(currentWod?.specialConsiderations || '');

  // New Slot Form state
  const [newSlotTime, setNewSlotTime] = useState('10:00');
  const [newSlotLabel, setNewSlotLabel] = useState('10:00 AM');
  const [newSlotCapacity, setNewSlotCapacity] = useState('15');
  const [newSlotCoach, setNewSlotCoach] = useState('Coach Camilo');

  const openWodEditor = () => {
    setWodTitle(currentWod?.title || '');
    setWodType(currentWod?.wodType || 'FOR_TIME');
    setTimeCap(currentWod?.timeCapMinutes?.toString() || '18');
    setWarmup(currentWod?.warmup || '');
    setStrengthSkill(currentWod?.strengthSkill || '');
    setMetcon(currentWod?.metcon || '');
    setScalingNotes(currentWod?.scalingNotes || '');
    setCoachNotes(currentWod?.coachNotes || '');
    setSpecialConsiderations(currentWod?.specialConsiderations || '');
    setIsWodModalOpen(true);
  };

  const handleSaveWod = (e: React.FormEvent) => {
    e.preventDefault();
    const newWod: WODSchedule = {
      id: currentWod?.id || `wod-${selectedDate}`,
      date: selectedDate,
      title: wodTitle.trim() || 'WOD INDOMABLE',
      wodType,
      timeCapMinutes: timeCap ? parseInt(timeCap, 10) : undefined,
      warmup: warmup.trim(),
      strengthSkill: strengthSkill.trim(),
      metcon: metcon.trim(),
      scalingNotes: scalingNotes.trim(),
      coachNotes: coachNotes.trim(),
      specialConsiderations: specialConsiderations.trim(),
      createdByCoachId: 'coach-1',
      createdAt: new Date().toISOString(),
    };
    saveWod(newWod);
    setIsWodModalOpen(false);
  };

  const handleAddCustomSlot = (e: React.FormEvent) => {
    e.preventDefault();
    addNewSlot(
      selectedDate,
      newSlotTime,
      newSlotLabel,
      parseInt(newSlotCapacity, 10) || 15,
      newSlotCoach
    );
    setIsNewSlotModalOpen(false);
  };

  // Group slots
  const morningSlots = slotsForSelectedDate.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = slotsForSelectedDate.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12;
  });

  const totalAttendeesToday = slotsForSelectedDate.reduce(
    (acc, slot) => acc + slot.attendeeIds.length,
    0
  );

  const totalCapacityToday = slotsForSelectedDate.reduce(
    (acc, slot) => acc + (slot.isEnabled ? slot.capacity : 0),
    0
  );

  return (
    <div id="section-coach-dashboard" className="space-y-6">
      {/* Top Sub-Navigation Tabs */}
      <div
        className={`grid gap-1.5 sm:gap-2 border-b border-zinc-800 pb-3 ${
          role === 'admin' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2'
        }`}
      >
        {/* 1. Atletas (Primer menú) */}
        <button
          type="button"
          id="tab-coach-athletes"
          onClick={() => setActiveCoachTab('athletes')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition text-center ${
            activeCoachTab === 'athletes'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 border border-red-500/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">
            {role === 'admin' ? (
              <>
                <span className="sm:hidden">Atletas ({athletes.length})</span>
                <span className="hidden sm:inline">Atletas & Membresías ({athletes.length})</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Atletas ({athletes.length})</span>
                <span className="hidden sm:inline">Consulta Atletas ({athletes.length})</span>
              </>
            )}
          </span>
        </button>

        {/* 2. Programación & Clases */}
        <button
          type="button"
          id="tab-coach-schedule"
          onClick={() => setActiveCoachTab('schedule')}
          className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition text-center ${
            activeCoachTab === 'schedule'
              ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 border border-red-500/40'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="truncate">
            <span className="sm:hidden">Clases</span>
            <span className="hidden sm:inline">Programación & Clases</span>
          </span>
        </button>

        {/* 3. Contabilidad & Sheets (Admin only) */}
        {role === 'admin' && (
          <button
            type="button"
            id="tab-admin-accounting"
            onClick={() => setActiveCoachTab('accounting')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition text-center ${
              activeCoachTab === 'accounting'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 border border-emerald-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-400" />
            <span className="truncate">
              <span className="sm:hidden">Contabilidad</span>
              <span className="hidden sm:inline">Contabilidad & Sheets</span>
            </span>
          </button>
        )}

        {/* 4. Staff Coaches (Admin only) */}
        {role === 'admin' && (
          <button
            type="button"
            id="tab-admin-coaches"
            onClick={() => setActiveCoachTab('coaches')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition text-center ${
              activeCoachTab === 'coaches'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60 border border-amber-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-400" />
            <span className="truncate">
              <span className="sm:hidden">Staff ({coaches.length})</span>
              <span className="hidden sm:inline">Gestión Staff ({coaches.length})</span>
            </span>
          </button>
        )}

        {/* 5. INFORMACIÓN (Unifica Avisos, Historial y WhatsApp/Correos) */}
        {role === 'admin' && (
          <button
            type="button"
            id="tab-admin-info"
            onClick={() => setActiveCoachTab('info')}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-wider transition text-center ${
              activeCoachTab === 'info'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/60 border border-red-500/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-red-400" />
            <span className="truncate">
              <span>INFORMACIÓN</span>
            </span>
          </button>
        )}
      </div>

      {/* Render Athlete Management if active */}
      {activeCoachTab === 'athletes' && <AthleteManagementView />}

      {/* Render Accounting Management if active (Admin only) */}
      {activeCoachTab === 'accounting' && role === 'admin' && <AdminAccountingView />}

      {/* Render Coach User Management if active (Admin only) */}
      {activeCoachTab === 'coaches' && role === 'admin' && <CoachUserManagementView />}

      {/* Render Unified INFORMACIÓN Tab (Admin only: Avisos + Historial + WhatsApp & Correos) */}
      {activeCoachTab === 'info' && role === 'admin' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Sub-tab navigation bar for INFORMACIÓN */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl">
            <button
              type="button"
              id="subtab-info-flyers"
              onClick={() => setActiveInfoSubTab('flyers')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeInfoSubTab === 'flyers'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50 border border-red-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              <span>Avisos & Cartelera</span>
            </button>

            <button
              type="button"
              id="subtab-info-history"
              onClick={() => setActiveInfoSubTab('history')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeInfoSubTab === 'history'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50 border border-red-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-300" />
              <span>Historial ({activityLogs.length})</span>
            </button>

            <button
              type="button"
              id="subtab-info-communication"
              onClick={() => setActiveInfoSubTab('communication')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeInfoSubTab === 'communication'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50 border border-emerald-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span>WhatsApp & Correo</span>
            </button>

            <button
              type="button"
              id="subtab-info-maintenance"
              onClick={() => setActiveInfoSubTab('maintenance')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                activeInfoSubTab === 'maintenance'
                  ? 'bg-red-600 text-white shadow-md shadow-red-950/50 border border-red-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
              <span>Mantenimiento {isMaintenanceMode ? '⚠️' : ''}</span>
            </button>
          </div>

          {/* Subtab 1: Avisos & Cartelera */}
          {activeInfoSubTab === 'flyers' && <AdminFlyersManagementView />}

          {/* Subtab 2: Historial de Actividad */}
          {activeInfoSubTab === 'history' && <CoachActivityLogView />}

          {/* Subtab 3: WhatsApp & Correo */}
          {activeInfoSubTab === 'communication' && (
            <div className="space-y-6">
          {/* Top Banner */}
          <div className="rounded-2xl border border-emerald-900/40 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                    CANALES DE COMUNICACIÓN & MENSAJERÍA
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
                  GRUPO OFICIAL DE WHATSAPP & AUDITORÍA DE CORREOS
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Configura el enlace de invitación al grupo de WhatsApp de la comunidad de atletas y audita el historial de correos de activación y bienvenida enviados.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna 1: Enlace al Grupo Oficial de WhatsApp (Solo Admin) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-zinc-850">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-950/40">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Grupo Oficial de WhatsApp</h3>
                    <p className="text-[11px] text-zinc-400">Comunidad de atletas & coaches</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Estado Actual</span>
                    {gymSettings?.whatsappGroupUrl ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Enlace Activo & Vinculado
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                        Sin Configurar
                      </span>
                    )}
                  </div>
                  {gymSettings?.whatsappGroupUrl && (
                    <button
                      type="button"
                      onClick={handleTestWhatsAppLink}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80 text-[11px] font-bold flex items-center gap-1 transition"
                      title="Abrir enlace actual en WhatsApp"
                    >
                      <span>Abrir Grupo</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {whatsappStatusMsg && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-xl text-xs border animate-in fade-in ${
                      whatsappStatusMsg.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                        : 'bg-red-950/60 border-red-800/80 text-red-300'
                    }`}
                  >
                    {whatsappStatusMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{whatsappStatusMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveWhatsApp} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">
                      URL de Invitación de WhatsApp
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={whatsappUrlInput}
                        onChange={(e) => setWhatsappUrlInput(e.target.value)}
                        placeholder="https://chat.whatsapp.com/..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 pl-9 text-white text-xs focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
                      />
                      <MessageCircle className="w-4 h-4 text-zinc-500 absolute left-3 top-3 pointer-events-none" />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Copia el enlace desde WhatsApp: <span className="text-zinc-400 font-mono">Info del Grupo → Enlace de invitación</span>.
                    </p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isSavingWhatsApp}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-950/60 transition active:scale-95 border border-emerald-500/50 disabled:opacity-50"
                    >
                      {isSavingWhatsApp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Guardar Enlace WhatsApp</span>
                        </>
                      )}
                    </button>

                    {whatsappUrlInput.trim() && (
                      <button
                        type="button"
                        onClick={handleTestWhatsAppLink}
                        className="px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white transition flex items-center justify-center"
                        title="Probar enlace en nueva pestaña"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </form>

                <p className="text-[11px] text-zinc-500 leading-relaxed pt-2 border-t border-zinc-850">
                  📲 Este enlace se muestra a los atletas en la pantalla principal (Bienvenida & Novedades) para que con un solo toque se unan al grupo oficial de la comunidad.
                </p>
              </div>
            </div>

            {/* Columna 2: Historial y Configuración de Notificaciones por Correo */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-850">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">Notificaciones por Correo Electrónico</h3>
                      <p className="text-[11px] text-zinc-400">
                        {sentEmails.length} {sentEmails.length === 1 ? 'correo registrado' : 'correos registrados'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1.5 text-xs text-zinc-300 font-bold transition"
                      title="Configuración de servicio de correo (Google Apps Script / EmailJS)"
                    >
                      <Settings className="w-3.5 h-3.5 text-red-400" />
                      <span>Servicio de Correo</span>
                    </button>

                    {sentEmails.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPurgeEmailModal(true)}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800/60 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-red-300 transition cursor-pointer font-medium"
                        title="Depurar historial de correos por período"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Depurar</span>
                      </button>
                    )}
                  </div>
                </div>

                {purgeEmailFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{purgeEmailFeedback}</span>
                  </div>
                )}

                {/* Listado de correos enviados */}
                <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                  {sentEmails.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-zinc-900/40 border border-dashed border-zinc-800 text-zinc-500 text-xs">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-red-500" />
                      <p className="font-semibold text-zinc-400">Bandeja de notificaciones vacía</p>
                      <p className="text-[11px] mt-1 max-w-sm mx-auto">
                        Los correos se generarán de forma automática cuando un atleta se registre en la app o cuando apruebes su membresía.
                      </p>
                    </div>
                  ) : (
                    sentEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`rounded-xl border p-3 text-xs space-y-2 transition ${
                          email.status === 'error'
                            ? 'bg-red-950/20 border-red-900/50 hover:border-red-800'
                            : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                email.type === 'welcome'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                                  : email.type === 'activation'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                              }`}
                            >
                              {email.type === 'welcome'
                                ? 'Bienvenida'
                                : email.type === 'activation'
                                ? 'Activación'
                                : 'Prueba'}
                            </span>
                            <span className="font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                              {email.toName}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="truncate">{email.toEmail}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              email.status === 'sent'
                                ? 'text-emerald-400'
                                : email.status === 'simulated'
                                ? 'text-zinc-400'
                                : 'text-red-400'
                            }`}
                          >
                            {email.status === 'sent'
                              ? '✓ Enviado'
                              : email.status === 'simulated'
                              ? '• Registrado local'
                              : '✕ Error'}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-300 bg-black/40 p-2 rounded-lg border border-zinc-850 font-mono line-clamp-2">
                          {email.bodySnippet}
                        </p>

                        {email.status === 'error' && email.errorMessage && (
                          <div className="text-[11px] text-red-300 bg-red-950/60 p-2 rounded-lg border border-red-900/60 font-mono break-words leading-relaxed">
                            <strong className="text-red-200">Motivo:</strong> {email.errorMessage}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Modal de Configuración EmailJS */}
          {showConfigModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative text-zinc-100 space-y-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Configuración de Envío EmailJS</h3>
                    <p className="text-xs text-zinc-400">Envíos de correo automáticos sin servidor backend</p>
                  </div>
                </div>

                {configSavedNotice && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Configuración guardada exitosamente.</span>
                  </div>
                )}

                <form onSubmit={handleSaveEmailConfig} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-zinc-300 mb-1">Proveedor de Correo</label>
                    <select
                      value={emailConfig.provider}
                      onChange={(e) => setEmailConfig({ ...emailConfig, provider: e.target.value as any })}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-semibold"
                    >
                      <option value="apps_script">Google Apps Script (Recomendado - 100% Gratis, Sin Límites)</option>
                      <option value="emailjs">EmailJS (Envío por API externa, máx 200/mes)</option>
                      <option value="simulation">Simulación Local (Gratis, auditada en historial de la app)</option>
                    </select>
                  </div>

                  {/* Configuración de Google Apps Script Webhook */}
                  {emailConfig.provider === 'apps_script' && (
                    <div className="space-y-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 animate-fadeIn">
                      <div className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-white text-xs">Google Apps Script Webhook (Recomendado)</h4>
                          <p className="text-[11px] text-zinc-300 mt-0.5 leading-relaxed">
                            Envía correos utilizando la cuota oficial gratuita de tu cuenta de Google/Gmail sin los límites restrictivos de EmailJS.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">URL de la Aplicación Web (Webhook) *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://script.google.com/macros/s/.../exec"
                          value={emailConfig.appsScriptWebhookUrl || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, appsScriptWebhookUrl: e.target.value })}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-emerald-500 focus:outline-none font-mono text-xs"
                        />
                        <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">
                          📌 Despliega el script <code className="text-emerald-400 font-mono">scripts/google-apps-script-email.gs</code> en <a href="https://script.google.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">script.google.com</a> y pega aquí la URL generada (debe terminar en <span className="font-mono text-white">/exec</span>).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Configuración de EmailJS */}
                  {emailConfig.provider === 'emailjs' && (
                    <div className="space-y-3 animate-fadeIn">
                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Service ID (EmailJS)</label>
                        <input
                          type="text"
                          placeholder="service_xxxxx"
                          value={emailConfig.emailjsServiceId}
                          onChange={(e) => setEmailConfig({ ...emailConfig, emailjsServiceId: e.target.value })}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Template ID Bienvenida</label>
                          <input
                            type="text"
                            placeholder="template_xxxxx"
                            value={emailConfig.emailjsTemplateWelcome}
                            onChange={(e) => setEmailConfig({ ...emailConfig, emailjsTemplateWelcome: e.target.value })}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-zinc-300 mb-1">Template ID Activación</label>
                          <input
                            type="text"
                            placeholder="template_xxxxx"
                            value={emailConfig.emailjsTemplateActivation}
                            onChange={(e) => setEmailConfig({ ...emailConfig, emailjsTemplateActivation: e.target.value })}
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-zinc-300 mb-1">Public Key / User ID</label>
                        <input
                          type="password"
                          placeholder="Public Key de EmailJS"
                          value={emailConfig.emailjsPublicKey}
                          onChange={(e) => setEmailConfig({ ...emailConfig, emailjsPublicKey: e.target.value })}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block font-bold text-zinc-300">Private Key / Access Token</label>
                          <span className="text-[10px] text-zinc-500 font-normal">Opcional</span>
                        </div>
                        <input
                          type="password"
                          placeholder="Solo si activaste 'Strict API Security' en EmailJS"
                          value={emailConfig.emailjsPrivateKey || ''}
                          onChange={(e) => setEmailConfig({ ...emailConfig, emailjsPrivateKey: e.target.value })}
                          className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                        />
                      </div>

                      {/* Guía rápida de configuración EmailJS */}
                      <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3 space-y-2 text-[11px] text-zinc-300">
                        <div className="flex items-center gap-1.5 font-bold text-red-400">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Avisos de EmailJS:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] leading-relaxed">
                          <li>
                            En tu plantilla de EmailJS el destinatario debe ser <code className="text-red-400 bg-black/50 px-1 py-0.5 rounded font-mono">{"{{to_email}}"}</code>.
                          </li>
                          <li>
                            El plan gratuito de EmailJS está limitado a 200 envíos mensuales.
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Simulación Local */}
                  {emailConfig.provider === 'simulation' && (
                    <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 leading-relaxed animate-fadeIn">
                      💡 En modo simulación, todos los correos de bienvenida y activación se auditan y visualizan de inmediato en la bandeja de historial sin realizar llamadas de red externas.
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white shadow-lg transition"
                    >
                      Guardar Configuración
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal de Depuración de Historial de Correos */}
          {showPurgeEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl relative text-zinc-100 space-y-4">
                <button
                  type="button"
                  onClick={() => setShowPurgeEmailModal(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">Depurar Historial de Correos</h3>
                    <p className="text-xs text-zinc-400">Elimina registros antiguos manteniendo tu historial al día</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
                  Total de notificaciones por correo en historial: <strong className="text-white">{sentEmails.length}</strong>. Los correos dentro del período seleccionado se eliminarán de Firestore y de este dispositivo.
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handlePurgeEmailHistory('day')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                        Más de 24 horas (1 día)
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Elimina correos anteriores a las últimas 24 horas y conserva los de hoy
                      </p>
                    </div>
                    <Clock className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurgeEmailHistory('week')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                        Más de 7 días (1 semana)
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Elimina registros emitidos hace más de una semana
                      </p>
                    </div>
                    <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurgeEmailHistory('month')}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                        Más de 30 días (1 mes)
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Elimina notificaciones con más de 30 días de antigüedad
                      </p>
                    </div>
                    <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Estás seguro de vaciar TODO el historial de correos? Esta acción no se puede deshacer.')) {
                        handlePurgeEmailHistory('all');
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-left transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-red-300 group-hover:text-red-200 transition">
                        Vaciar todo el historial
                      </p>
                      <p className="text-[11px] text-red-400/80">
                        Elimina el 100% de los correos registrados
                      </p>
                    </div>
                    <Trash2 className="w-4 h-4 text-red-400 shrink-0 ml-2" />
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setShowPurgeEmailModal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
            </div>
          )}

          {/* Subtab 4: Modo Mantenimiento & Ajustes */}
          {activeInfoSubTab === 'maintenance' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-zinc-850">
                  <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-['Teko'] uppercase tracking-wide text-white">
                      CONTROL DE MANTENIMIENTO DEL BOX
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Gestiona el bloqueo preventivo para atletas y personaliza el mensaje de los servidores
                    </p>
                  </div>
                </div>

                {/* State card */}
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isMaintenanceMode ? 'bg-red-950/40 border-red-700' : 'bg-zinc-900/60 border-zinc-800'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Estado Actual del Sitio
                    </span>
                    <span className={`text-sm font-black uppercase tracking-wide flex items-center gap-2 ${
                      isMaintenanceMode ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${isMaintenanceMode ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      {isMaintenanceMode ? 'SITIO EN MANTENIMIENTO (Atletas Bloqueados)' : 'SITIO EN LÍNEA (Acceso Abierto a Todos)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isMaintenanceMode) {
                        const confirmed = window.confirm(
                          '⚠️ ¿Estás seguro de que deseas ACTIVAR el Modo Mantenimiento?\n\nEl acceso quedará bloqueado para los atletas regulares. Solo el Administrador y el Usuario de Prueba podrán acceder.'
                        );
                        if (confirmed) {
                          setMaintenanceMode(true);
                        }
                      } else {
                        const confirmed = window.confirm(
                          '🟢 ¿Estás seguro de que deseas DESACTIVAR el Modo Mantenimiento?\n\nEl acceso quedará abierto normalmente para todos los atletas del Box.'
                        );
                        if (confirmed) {
                          setMaintenanceMode(false);
                        }
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg cursor-pointer ${
                      isMaintenanceMode
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-red-950/60'
                    }`}
                  >
                    {isMaintenanceMode ? 'Desactivar Mantenimiento' : 'Activar Modo Mantenimiento'}
                  </button>
                </div>

                {/* Message Customization Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingMaintenanceMsg(true);
                    try {
                      await updateGymSettings({ maintenanceMessage: maintenanceMsgInput.trim() });
                      setMaintenanceSavedNotice(true);
                      setTimeout(() => setMaintenanceSavedNotice(false), 3000);
                    } catch (err) {
                      console.error('Error guardando mensaje de mantenimiento:', err);
                    } finally {
                      setIsSavingMaintenanceMsg(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <label className="block text-xs font-bold text-zinc-300">
                    Mensaje informativo para los atletas (opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={maintenanceMsgInput}
                    onChange={(e) => setMaintenanceMsgInput(e.target.value)}
                    placeholder="Estamos realizando actualizaciones en los servidores del box. Volvemos en unos momentos..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-xs text-white focus:border-red-600 focus:outline-none leading-relaxed"
                  />

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingMaintenanceMsg}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg cursor-pointer disabled:opacity-50"
                    >
                      {isSavingMaintenanceMsg ? 'Guardando...' : 'Guardar Mensaje'}
                    </button>

                    {maintenanceSavedNotice && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ¡Mensaje actualizado con éxito!
                      </span>
                    )}
                  </div>
                </form>

                {/* Info about Test User access */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-300">
                    <span>🧪</span>
                    <span>Acceso de Usuario de Prueba en Mantenimiento</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Cuando el sitio está en mantenimiento, la pantalla bloquea a atletas regulares pero ofrece un botón directo para ingresar como <strong>Usuario de Prueba (Demo)</strong>. Esto permite que coaches, socios o testers puedan recorrer y validar todas las funciones del box sin necesidad de credenciales de atleta real.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Schedule & Classes if active */}
      {activeCoachTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Banner: Coach Overview in Red & Black */}
          <div className="rounded-2xl border border-red-900/40 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
                    <Shield className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-red-500">
                    PANEL DEL ENTRENADOR • INDOMABLE
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
                  PROGRAMACIÓN & CONTROL DE CLASES
                </h2>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Habilita franjas de clase, ajusta cupos máximos, revisa asistentes inscritos y configura el WOD del día.
                </p>
              </div>

              {/* Quick Metrics Bar in Red and Carbon */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <div className="rounded-xl bg-black/80 p-3 border border-zinc-800 text-center min-w-[85px]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Inscritos Hoy</span>
                  <div className="text-2xl font-black font-['Teko'] text-red-500 leading-none mt-0.5">
                    {totalAttendeesToday}
                  </div>
                </div>

                <div className="rounded-xl bg-black/80 p-3 border border-zinc-800 text-center min-w-[85px]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Cupos Totales</span>
                  <div className="text-2xl font-black font-['Teko'] text-zinc-200 leading-none mt-0.5">
                    {totalCapacityToday}
                  </div>
                </div>

                <div className="rounded-xl bg-black/80 p-3 border border-zinc-800 text-center min-w-[85px]">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Franjas Activas</span>
                  <div className="text-2xl font-black font-['Teko'] text-emerald-400 leading-none mt-0.5">
                    {slotsForSelectedDate.filter((s) => s.isEnabled).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Date Selector & Action Tools (Confusing button removed!) */}
            <div className="mt-5 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-300">Fecha a gestionar:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-xl border border-zinc-800 bg-black px-3 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 px-3.5 py-1.5 text-xs font-bold text-zinc-200 transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-red-500" />
                  <span>+ Franja Horaria Especial</span>
                </button>

                <button
                  type="button"
                  onClick={openWodEditor}
                  id="btn-coach-edit-wod"
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 text-xs font-extrabold shadow-lg shadow-red-950/60 transition active:scale-95 border border-red-500/40"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{currentWod ? 'Editar WOD del Día' : 'Crear WOD del Día'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Daily WOD Preview & Status for Coach */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <h3 className="font-extrabold text-base text-white">
                  WOD Programado para {selectedDate}
                </h3>
              </div>
              <button
                onClick={openWodEditor}
                className="text-xs font-bold text-red-400 hover:text-red-300 underline underline-offset-2"
              >
                Modificar WOD
              </button>
            </div>

            {currentWod ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/80 p-4 rounded-xl border border-zinc-800">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Título y Modalidad</span>
                    <p className="font-black text-xl text-white font-['Teko']">{currentWod.title}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-600/20 text-red-400 border border-red-600/30">
                      {currentWod.wodType.replace('_', ' ')} {currentWod.timeCapMinutes ? `(${currentWod.timeCapMinutes}')` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Fuerza / Técnica</span>
                    <p className="text-xs text-zinc-300 line-clamp-3 mt-1 leading-relaxed">
                      {currentWod.strengthSkill || 'No definida'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">MetCon</span>
                    <p className="text-xs text-zinc-300 line-clamp-3 mt-1 leading-relaxed">
                      {currentWod.metcon || 'No definido'}
                    </p>
                  </div>
                </div>

                {currentWod.specialConsiderations && (
                  <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-xs">
                    <span className="text-[10px] font-bold uppercase text-red-400 block mb-0.5">
                      Consideraciones Especiales & Implementos (Visible aunque el WOD esté bloqueado):
                    </span>
                    <p className="text-zinc-300">{currentWod.specialConsiderations}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80 text-center">
                <p className="text-xs text-zinc-400">No hay WOD configurado para esta fecha.</p>
                <button
                  onClick={openWodEditor}
                  className="mt-2 text-xs font-bold text-red-500 hover:underline"
                >
                  + Redactar WOD ahora
                </button>
              </div>
            )}
          </div>

          {/* Slot Management: Morning */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-400 px-1">
              <div className="flex items-center gap-1.5">
                <Sun className="h-4 w-4" />
                <span>Horarios Mañana (5:00 AM – 9:00 AM)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium lowercase">
                toca para habilitar/deshabilitar o ajustar cupos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {morningSlots.map((slot, idx) => (
                <CoachSlotCard
                  key={slot.id || `coach-m-${slot.time}-${idx}`}
                  slot={slot}
                  onToggle={() => toggleSlotEnabled(slot.id)}
                  onCapacityChange={(cap) => updateSlotCapacity(slot.id, cap)}
                  onViewAttendees={() => setSelectedSlotForAttendees(slot)}
                />
              ))}
            </div>
          </div>

          {/* Slot Management: Afternoon */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-500 px-1">
              <div className="flex items-center gap-1.5">
                <Moon className="h-4 w-4" />
                <span>Horarios Tarde / Noche (4:00 PM – 7:00 PM)</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium lowercase">
                toca para habilitar/deshabilitar o ajustar cupos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {afternoonSlots.map((slot, idx) => (
                <CoachSlotCard
                  key={slot.id || `coach-a-${slot.time}-${idx}`}
                  slot={slot}
                  onToggle={() => toggleSlotEnabled(slot.id)}
                  onCapacityChange={(cap) => updateSlotCapacity(slot.id, cap)}
                  onViewAttendees={() => setSelectedSlotForAttendees(slot)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: WOD Editor in Red & Black */}
      {isWodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setIsWodModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-5 h-5 text-red-500" />
              <h3 className="font-black text-xl text-white font-['Teko'] tracking-wide">
                PROGRAMACIÓN DE WOD • {selectedDate}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Define los ejercicios, esquemas de carga y notas para los atletas de INDOMABLE.
            </p>

            <form onSubmit={handleSaveWod} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Título del WOD
                  </label>
                  <input
                    type="text"
                    required
                    value={wodTitle}
                    onChange={(e) => setWodTitle(e.target.value)}
                    placeholder="Ej: THE BULL CHIPPER, FRAN, SQUAT CYCLE..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Modalidad
                  </label>
                  <select
                    value={wodType}
                    onChange={(e) => setWodType(e.target.value as WODType)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="FOR_TIME">For Time</option>
                    <option value="AMRAP">AMRAP</option>
                    <option value="EMOM">EMOM</option>
                    <option value="CHIPPER">Chipper</option>
                    <option value="TABATA">Tabata</option>
                    <option value="STRENGTH">Strength Only</option>
                    <option value="HERO_WOD">Hero WOD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Time Cap (Minutos opcional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={timeCap}
                    onChange={(e) => setTimeCap(e.target.value)}
                    placeholder="Ej: 18"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-red-500 mb-1">
                    Calentamiento / Movilidad
                  </label>
                  <textarea
                    rows={2}
                    value={warmup}
                    onChange={(e) => setWarmup(e.target.value)}
                    placeholder="Ej: 3 Rondas: 200m Run, 10 Cossack Squats, 10 Pass Throughs..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none font-sans resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Bloque de Fuerza o Técnica (Strength / Skill)
                </label>
                <textarea
                  rows={2}
                  value={strengthSkill}
                  onChange={(e) => setStrengthSkill(e.target.value)}
                  placeholder="Ej: Back Squat 5x3 @ 80-85% 1RM. Descanso de 2:30 min entre series..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-red-500 mb-1">
                  Acondicionamiento Metabólico (MetCon / WOD Principal) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={metcon}
                  onChange={(e) => setMetcon(e.target.value)}
                  placeholder={`Ejemplo:\n21-15-9:\n- Thrusters (95/65 lbs)\n- Pull-ups\nTime Cap: 10 Min`}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Escalados & Adaptaciones (Scalings)
                  </label>
                  <textarea
                    rows={2}
                    value={scalingNotes}
                    onChange={(e) => setScalingNotes(e.target.value)}
                    placeholder="Ej: Principiantes usar barra vacía y jumping pull-ups..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Notas del Coach / Estrategia
                  </label>
                  <textarea
                    rows={2}
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    placeholder="Ej: Mantener ritmo constante en los thrusters, partir pull-ups en series cortas..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-950/25 border border-red-800/40">
                <label className="block text-xs font-bold text-red-400 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span>Consideraciones Especiales e Implementos (Visible con WOD Bloqueado)</span>
                </label>
                <textarea
                  rows={2}
                  value={specialConsiderations}
                  onChange={(e) => setSpecialConsiderations(e.target.value)}
                  placeholder="Ej: Traer medias largas para rope climb, calleras o cinturón para levantamientos pesados..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none resize-none"
                />
                <span className="text-[10px] text-zinc-400 mt-1 block">
                  💡 Este texto será lo único visible para los atletas antes de que se desbloquee la programación completa.
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-950/60 transition active:scale-95"
                >
                  Publicar WOD para Atletas
                </button>
                <button
                  type="button"
                  onClick={() => setIsWodModalOpen(false)}
                  className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Manage Attendees */}
      {selectedSlotForAttendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setSelectedSlotForAttendees(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-red-500" />
              <h3 className="font-black text-xl text-white font-['Teko'] tracking-wide">
                ATLETAS INSCRITOS • {selectedSlotForAttendees.label}
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Fecha: {selectedSlotForAttendees.date} • {selectedSlotForAttendees.attendeeIds.length} de {selectedSlotForAttendees.capacity} cupos ocupados.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {selectedSlotForAttendees.attendeeIds.map((athId, athIdx) => {
                const athlete = athletes.find((a) => a.id === athId);
                return (
                  <div
                    key={`${selectedSlotForAttendees.id}_${athId}_${athIdx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg overflow-hidden bg-zinc-800 text-xs font-bold flex items-center justify-center text-red-500 border border-zinc-700">
                        {athlete?.avatar ? (
                          <img src={athlete.avatar} alt={athlete.name} className="h-full w-full object-cover" />
                        ) : (
                          athlete?.name.charAt(0) || 'A'
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{athlete?.name || athId}</p>
                        <p className="text-[10px] text-zinc-400">{athlete?.membership.planName || 'Plan Box'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const mem = athlete?.membership;
                        const isDateExp = Boolean(mem?.endDate && mem.endDate < todayStr);
                        const remCls = typeof mem?.remainingClasses === 'number' ? mem.remainingClasses : null;
                        const hasPunch = remCls !== null;
                        const isExp = !mem?.isActive || isDateExp || (hasPunch && remCls <= 0);

                        if (mem?.isPendingApproval) {
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Pendiente Pago
                            </span>
                          );
                        }
                        if (isExp) {
                          return (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              Membresía Vencida
                            </span>
                          );
                        }
                        return (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                            {hasPunch ? `${remCls} Clases` : `Vigente (${mem?.endDate})`}
                          </span>
                        );
                      })()}
                      <button
                        onClick={() => {
                          cancelBooking(selectedSlotForAttendees.id, athId);
                          setSelectedSlotForAttendees((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  attendeeIds: prev.attendeeIds.filter((id) => id !== athId),
                                }
                              : null
                          );
                        }}
                        className="text-zinc-500 hover:text-red-400 p-1 text-xs"
                        title="Liberar cupo de este atleta"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {selectedSlotForAttendees.attendeeIds.length === 0 && (
                <div className="p-8 text-center text-zinc-500 text-xs">
                  No hay atletas inscritos en esta franja horaria todavía.
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedSlotForAttendees(null)}
                className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Custom Slot */}
      {isNewSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <h3 className="font-black text-xl text-white font-['Teko'] tracking-wide mb-1">
              AGREGAR FRANJA HORARIA ESPECIAL
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Crea un horario adicional para {selectedDate} (ej: Open Box o clase de sábado).
            </p>

            <form onSubmit={handleAddCustomSlot} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Hora (24h)</label>
                <input
                  type="time"
                  required
                  value={newSlotTime}
                  onChange={(e) => setNewSlotTime(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Etiqueta Visual</label>
                <input
                  type="text"
                  required
                  value={newSlotLabel}
                  onChange={(e) => setNewSlotLabel(e.target.value)}
                  placeholder="Ej: 10:00 AM o Open Box"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Cupos Máximos</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newSlotCapacity}
                  onChange={(e) => setNewSlotCapacity(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Coach Encargado</label>
                <input
                  type="text"
                  required
                  value={newSlotCoach}
                  onChange={(e) => setNewSlotCoach(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-950/60 transition active:scale-95"
                >
                  Crear Franja
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewSlotModalOpen(false)}
                  className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface CoachSlotCardProps {
  slot: ClassSlot;
  onToggle: () => void;
  onCapacityChange: (cap: number) => void;
  onViewAttendees: () => void;
}

const CoachSlotCard: React.FC<CoachSlotCardProps> = ({
  slot,
  onToggle,
  onCapacityChange,
  onViewAttendees,
}) => {
  const [isEditingCap, setIsEditingCap] = useState(false);
  const [tempCap, setTempCap] = useState(slot.capacity.toString());

  const handleSaveCap = () => {
    const num = parseInt(tempCap, 10);
    if (!isNaN(num) && num > 0) {
      onCapacityChange(num);
    }
    setIsEditingCap(false);
  };

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        slot.isEnabled
          ? 'bg-zinc-950 border-zinc-800 shadow-md hover:border-zinc-700'
          : 'bg-zinc-950/40 border-zinc-900 opacity-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-['Teko'] text-white tracking-wide">
            {slot.label}
          </span>
          <span className="text-[10px] text-zinc-400 font-semibold bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            {slot.coachName}
          </span>
        </div>

        {/* Enable / Disable toggle */}
        <button
          type="button"
          onClick={onToggle}
          className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg transition ${
            slot.isEnabled
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
          }`}
        >
          {slot.isEnabled ? 'Habilitada' : 'Deshabilitada'}
        </button>
      </div>

      {/* Capacity & Enrolled */}
      <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
        <div>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase block">Inscritos</span>
          <span className="text-lg font-black font-['Teko'] text-red-500">
            {slot.attendeeIds.length} <span className="text-zinc-500 text-xs font-sans">/ {slot.capacity}</span>
          </span>
        </div>

        {/* Capacity adjust */}
        <div className="flex items-center gap-1.5">
          {isEditingCap ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="50"
                value={tempCap}
                onChange={(e) => setTempCap(e.target.value)}
                className="w-12 rounded bg-black border border-red-500 text-center text-xs py-0.5 text-white"
              />
              <button
                onClick={handleSaveCap}
                className="p-1 rounded bg-red-600 hover:bg-red-500 text-white"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditingCap(true)}
              className="text-[11px] text-zinc-400 hover:text-red-400 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              <span>Ajustar cupos</span>
            </button>
          )}
        </div>
      </div>

      {/* Button to view enrolled athletes */}
      <div className="mt-3 pt-2.5 border-t border-zinc-800">
        <button
          onClick={onViewAttendees}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 text-xs font-bold transition border border-zinc-800"
        >
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-red-500" />
            <span>Ver Asistentes ({slot.attendeeIds.length})</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
        </button>
      </div>
    </div>
  );
};
