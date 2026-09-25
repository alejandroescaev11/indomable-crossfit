import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { getFormattedDate } from '../../data/seedData';
import { AthleteAvatar } from '../common/AthleteAvatar';
import {
  Calendar,
  Clock,
  Flame,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Dumbbell,
  Target,
  Info,
  Lock,
  Unlock,
  Timer
} from 'lucide-react';

interface UnifiedWODBookingViewProps {
  onOpenRMCalculator?: (exerciseHint?: string) => void;
  onOpenScoreLogger?: () => void;
}

export const UnifiedWODBookingView: React.FC<UnifiedWODBookingViewProps> = ({
  onOpenRMCalculator,
  onOpenScoreLogger,
}) => {
  const {
    selectedDate,
    setSelectedDate,
    currentWod,
    slotsForSelectedDate,
    bookSlot,
    cancelBooking,
    currentAthleteId,
    currentAthlete,
    role,
    athletes,
  } = useGym();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [slotToCancel, setSlotToCancel] = useState<{ id: string; label: string } | null>(null);
  const [selectedSlotForAttendees, setSelectedSlotForAttendees] = useState<any | null>(null);
  const [isWodExpanded, setIsWodExpanded] = useState(true);
  const [activeWodTab, setActiveWodTab] = useState<'all' | 'strength' | 'metcon' | 'notes'>('all');

  // Helper to check if a class slot has already occurred
  const checkIsPast = (slotDate: string, slotTime: string): boolean => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (slotDate < todayStr) return true;
    if (slotDate > todayStr) return false;
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const [slotHour, slotMin] = slotTime.split(':').map((n) => parseInt(n, 10));
    return slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMin);
  };

  // Generate 7 days strip around selected date
  const dayTabs = [-2, -1, 0, 1, 2, 3, 4].map((offset) => {
    const dStr = getFormattedDate(offset);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() + offset);
    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
    const dayNum = dateObj.getDate();
    return {
      dateStr: dStr,
      dayName: dayName.toUpperCase(),
      dayNum,
      isToday: offset === 0,
    };
  });

  const handleBook = (slotId: string) => {
    const res = bookSlot(slotId);
    setFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handlePromptCancel = (slotId: string, slotLabel: string) => {
    setSlotToCancel({ id: slotId, label: slotLabel });
  };

  const handleConfirmCancel = () => {
    if (!slotToCancel) return;
    const res = cancelBooking(slotToCancel.id);
    setFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message,
    });
    setSlotToCancel(null);
    setTimeout(() => setFeedback(null), 5000);
  };

  // Group slots into morning (before 12:00) and afternoon/evening (after 12:00)
  const morningSlots = slotsForSelectedDate.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = slotsForSelectedDate.filter((s) => {
    const hour = parseInt(s.time.split(':')[0], 10);
    return hour >= 12;
  });

  // Find if current athlete already has a booking today
  const existingBookingToday = slotsForSelectedDate.find((s) =>
    s.attendeeIds.includes(currentAthleteId)
  );

  // Determinar si el WOD está bloqueado para el atleta:
  // - Coaches y Administradores siempre tienen acceso irrestricto.
  // - Para atletas:
  //   1) Si no tienen reserva confirmada para la fecha seleccionada -> BLOQUEADO ("Debes confirmar tu clase").
  //   2) Si tienen reserva:
  //      - Si la fecha ya pasó -> DESBLOQUEADO (histórico).
  //      - Si la fecha es hoy -> DESBLOQUEADO SOLO si falta 1 hora o menos para el inicio de la clase (o si ya inició).
  //      - Si la fecha es futura -> BLOQUEADO hasta 1 hora antes de la clase en ese día.
  const getWODLockStatus = () => {
    if (role === 'admin' || role === 'coach') {
      return { isLocked: false, reason: 'staff' as const };
    }

    if (!existingBookingToday) {
      return {
        isLocked: true,
        reason: 'no_booking' as const,
        message: 'Debes confirmar tu reserva en una clase para desbloquear el WOD.',
      };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Si la fecha seleccionada es anterior a hoy, el WOD ya se puede ver
    if (selectedDate < todayStr) {
      return { isLocked: false, reason: 'past_date' as const };
    }

    // Calcular el timestamp de inicio de la clase
    const [slotHour, slotMin] = existingBookingToday.time.split(':').map((n) => parseInt(n, 10));
    const [year, month, day] = selectedDate.split('-').map((n) => parseInt(n, 10));
    const slotStartTime = new Date(year, month - 1, day, slotHour, slotMin, 0);
    const unlockTime = new Date(slotStartTime.getTime() - 60 * 60 * 1000); // 1 hora antes

    if (now >= unlockTime) {
      return { isLocked: false, reason: 'unlocked' as const };
    }

    // Aún no es la hora de desbloqueo
    const diffMs = unlockTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.max(1, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

    const unlockTimeFormatted = unlockTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    const countdownText =
      diffHours > 0
        ? `Faltan ${diffHours}h ${diffMinutes}m`
        : `Faltan ${diffMinutes} min`;

    return {
      isLocked: true,
      reason: 'time_lock' as const,
      unlockTimeFormatted,
      classTimeFormatted: existingBookingToday.label,
      countdownText,
      message: `Clase confirmada para las ${existingBookingToday.label}. El WOD se revelará a las ${unlockTimeFormatted} (1 hora antes de la sesión).`,
    };
  };

  const wodLock = getWODLockStatus();

  const getWODBadgeColor = (type: string) => {
    switch (type) {
      case 'FOR_TIME':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'AMRAP':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'EMOM':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
      case 'STRENGTH':
        return 'bg-zinc-850 text-red-400 border-red-800/40';
      default:
        return 'bg-red-600/20 text-red-400 border-red-600/30';
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. Selector de Días Compacto */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 sm:p-4 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Día de Entrenamiento:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-black px-2.5 py-1 text-xs text-white focus:border-red-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Fila compacta de botones por día (estilo pastillas) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {dayTabs.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            return (
              <button
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-b from-red-600 to-red-900 text-white font-bold shadow-lg shadow-red-950/60 ring-1 ring-red-500 scale-102 border border-red-500/50'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80'
                }`}
              >
                <span className="text-[10px] font-extrabold tracking-wider">{day.dayName}</span>
                <span className="text-sm sm:text-base font-black font-teko leading-tight">
                  {day.dayNum}
                </span>
                {day.isToday && (
                  <span
                    className={`text-[8px] font-extrabold uppercase px-1 rounded ${
                      isSelected ? 'bg-black/50 text-red-200' : 'text-red-400'
                    }`}
                  >
                    Hoy
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Feedback si aplica */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/60 border-red-800/60 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Sección del WOD del Día (Lo primero que ve el usuario) */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-4 sm:p-5 border-b border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
                <Flame className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                1. WOD DEL DÍA • {selectedDate}
              </span>
            </div>

            {currentWod && wodLock.isLocked ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Lock className="w-3 h-3" />
                  WOD Bloqueado
                </span>
              </div>
            ) : currentWod ? (
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide border ${getWODBadgeColor(
                    currentWod.wodType
                  )}`}
                >
                  {currentWod.wodType.replace('_', ' ')}
                </span>

                {currentWod.timeCapMinutes && (
                  <span className="flex items-center gap-1 rounded-md bg-black px-2 py-0.5 text-[11px] font-semibold text-zinc-300 border border-zinc-800">
                    <Clock className="h-3 w-3 text-red-500" />
                    <span>Cap: {currentWod.timeCapMinutes} min</span>
                  </span>
                )}

                {role === 'athlete' && (
                  <span className="hidden sm:flex items-center gap-1 rounded-md bg-emerald-950/80 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-800">
                    <Unlock className="w-3 h-3" /> Desbloqueado
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {currentWod && wodLock.isLocked ? (
            <div className="mt-2 flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-zinc-300 font-teko tracking-wide flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <span>PROGRAMACIÓN DEL DÍA CONFIDENCIAL</span>
              </h2>
            </div>
          ) : currentWod ? (
            <div className="mt-2 flex items-baseline justify-between">
              <h2 className="text-2xl sm:text-3xl font-black text-white font-teko tracking-wide">
                {currentWod.title}
              </h2>
              <button
                type="button"
                onClick={() => setIsWodExpanded(!isWodExpanded)}
                className="text-zinc-400 hover:text-white p-1"
                title={isWodExpanded ? 'Contraer' : 'Expandir'}
              >
                {isWodExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <div className="mt-2 text-xs text-zinc-400">
              No hay WOD publicado para esta fecha. ¡Consulta más tarde o revisa las reservas!
            </div>
          )}
        </div>

        {/* Banner Bloqueado si el WOD está bloqueado para el atleta */}
        {currentWod && wodLock.isLocked && (
          <div className="p-6 sm:p-8 text-center space-y-4 bg-zinc-950/60">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-950/40">
              <Lock className="w-7 h-7 animate-pulse" />
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-xl font-black uppercase text-white font-teko tracking-wide">
                {wodLock.reason === 'no_booking'
                  ? 'Reserva tu clase para desbloquear el WOD'
                  : 'Contenido reservado para tu sesión'}
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {wodLock.message}
              </p>
            </div>

            {/* Frase Motivacional */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-red-950/40 border border-red-800/40 text-center shadow-lg">
              <p className="text-sm sm:text-base font-bold text-white italic font-serif">
                “No importa qué ejercicios sean hoy, lo importante es que te cumplas.”
              </p>
              <span className="text-[10px] text-red-400 font-black uppercase tracking-widest block mt-1">
                — FILOSOFÍA INDOMABLE —
              </span>
            </div>

            {/* Consideraciones Especiales (LO ÚNICO QUE SE VE DEL WOD CUANDO ESTÁ BLOQUEADO) */}
            {currentWod.specialConsiderations && (
              <div className="max-w-md mx-auto text-left p-3.5 rounded-xl bg-zinc-900/90 border border-red-800/40 shadow-md">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Sparkles className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Implementos & Consideraciones del WOD</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed">
                  {currentWod.specialConsiderations}
                </p>
              </div>
            )}

            {wodLock.reason === 'time_lock' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs font-bold shadow-inner">
                <Timer className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{wodLock.countdownText} para revelar</span>
              </div>
            )}

            {wodLock.reason === 'no_booking' && (
              <div>
                <a
                  href="#booking-section"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-950/60"
                >
                  <span>Ver Horarios de Clase Disponibles Abajo</span>
                  <ChevronDown className="w-4 h-4" />
                </a>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 italic max-w-sm mx-auto">
              * El entrenamiento se revela únicamente a los atletas confirmados en la clase faltando 1 hora para el inicio.
            </p>
          </div>
        )}

        {/* Contenido Desplegable del WOD si está Desbloqueado */}
        {currentWod && !wodLock.isLocked && isWodExpanded && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Consideraciones Especiales del WOD si existen */}
            {currentWod.specialConsiderations && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/50 p-3.5 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-0.5">
                    Consideraciones Especiales & Implementos Recomendados
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    {currentWod.specialConsiderations}
                  </p>
                </div>
              </div>
            )}

            {/* Tabs de Filtro de Secciones */}
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-3">
              {[
                { id: 'all', label: 'Todo el WOD' },
                { id: 'strength', label: 'Fuerza / Técnica' },
                { id: 'metcon', label: 'MetCon / Acond.' },
                { id: 'notes', label: 'Instrucciones' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveWodTab(tab.id as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    activeWodTab === tab.id
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Calentamiento */}
            {(activeWodTab === 'all' || activeWodTab === 'strength') && currentWod.warmup && (
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800/80 p-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-red-400 block mb-1">
                  Calentamiento (Warm-Up)
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                  {currentWod.warmup}
                </p>
              </div>
            )}

            {/* Fuerza / Habilidad */}
            {(activeWodTab === 'all' || activeWodTab === 'strength') && currentWod.strengthSkill && (
              <div className="rounded-xl bg-zinc-900/80 border border-zinc-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Dumbbell className="h-4 w-4 text-red-500" />
                    <span>Fuerza & Habilidad (Strength & Skill)</span>
                  </div>
                  {onOpenRMCalculator && (
                    <button
                      type="button"
                      onClick={() => onOpenRMCalculator(currentWod.strengthSkill)}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 underline"
                    >
                      Calcular Cargas (1RM)
                    </button>
                  )}
                </div>
                <div className="text-xs text-zinc-200 whitespace-pre-line font-mono bg-black/40 p-3 rounded-lg border border-zinc-800/60 leading-relaxed">
                  {currentWod.strengthSkill}
                </div>
              </div>
            )}

            {/* MetCon / Acondicionamiento */}
            {(activeWodTab === 'all' || activeWodTab === 'metcon') && currentWod.metcon && (
              <div className="rounded-xl bg-gradient-to-b from-zinc-900 to-black border border-red-900/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                    <Target className="h-4 w-4 text-red-500" />
                    <span>MetCon Principal: {currentWod.title}</span>
                  </div>
                  {onOpenScoreLogger && (
                    <button
                      type="button"
                      onClick={onOpenScoreLogger}
                      className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition-colors"
                    >
                      Registrar Score
                    </button>
                  )}
                </div>
                <div className="text-xs text-zinc-100 whitespace-pre-line font-mono bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-800 leading-relaxed">
                  {currentWod.metcon}
                </div>
              </div>
            )}

            {/* Notas del Coach */}
            {(activeWodTab === 'all' || activeWodTab === 'notes') && currentWod.coachNotes && (
              <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/60 p-3 text-xs text-zinc-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{currentWod.coachNotes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Sección de Reserva de Clases (Compacta en forma de botones pastilla) */}
      <div id="booking-section" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white font-teko uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-500" />
              2. RESERVAR CUPO EN CLASE • {selectedDate}
            </h3>
            <p className="text-xs text-zinc-400">
              Selecciona tu horario preferido. Visualización compacta en un solo toque.
            </p>
          </div>

          {/* Banner de Reserva Actual si ya reservó hoy */}
          {existingBookingToday && (
            <div className="bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-300">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Reservado: <strong>{existingBookingToday.label}</strong>
              </span>
              <button
                type="button"
                onClick={() => handlePromptCancel(existingBookingToday.id, existingBookingToday.label)}
                className="text-[11px] font-bold text-red-400 hover:text-red-300 underline"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Subsección: Turno Mañana */}
        {morningSlots.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
              <Sun className="w-3.5 h-3.5" />
              <span>Turno Mañana</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {morningSlots.map((slot) => {
                const isPast = checkIsPast(slot.date, slot.time);
                const isUserBooked = slot.attendeeIds.includes(currentAthleteId);
                const isFull = slot.attendeeIds.length >= slot.capacity;
                const spotsLeft = Math.max(0, slot.capacity - slot.attendeeIds.length);

                return (
                  <div
                    key={slot.id}
                    className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isUserBooked
                        ? 'bg-gradient-to-b from-red-950/80 to-zinc-950 border-red-500 shadow-md shadow-red-950/40'
                        : isPast || !slot.isEnabled
                        ? 'bg-zinc-900/40 border-zinc-800/40 opacity-50'
                        : isFull
                        ? 'bg-zinc-900/60 border-zinc-800 opacity-70'
                        : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-red-500/40 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white font-teko tracking-wide">
                          {slot.label}
                        </span>
                        {isUserBooked && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                        <span className="text-[9px] uppercase font-bold text-red-500/80">CrossFit</span>
                      </div>

                      {/* Botón para ver atletas inscritos (accesible para todos, aun sin reserva) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlotForAttendees(slot);
                        }}
                        className="mt-1.5 w-full flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 hover:bg-zinc-800/80 border border-zinc-800 text-[10px] text-zinc-300 transition group cursor-pointer"
                        title="Ver atletas inscritos en este horario"
                      >
                        <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white">
                          <Users className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="font-semibold text-[9px]">Atletas:</span>
                        </span>
                        <span className="font-bold font-mono text-zinc-200 group-hover:text-red-400">
                          {slot.attendeeIds.length} / {slot.capacity}
                        </span>
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold ${
                          isFull ? 'text-red-400' : 'text-zinc-300'
                        }`}
                      >
                        {isFull ? 'Agotado' : `${spotsLeft} libres`}
                      </span>

                      {isUserBooked ? (
                        <button
                          type="button"
                          onClick={() => handlePromptCancel(slot.id, slot.label)}
                          className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-[10px] font-extrabold text-red-400 hover:bg-red-900"
                        >
                          Cancelar
                        </button>
                      ) : isPast ? (
                        <span className="text-[10px] text-zinc-500 font-semibold">Finalizada</span>
                      ) : isFull ? (
                        <span className="text-[10px] text-zinc-500 font-semibold">Lleno</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBook(slot.id)}
                          className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-[10px] font-extrabold text-white transition-colors"
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Subsección: Turno Tarde / Noche */}
        {afternoonSlots.length > 0 && (
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400 mb-2.5">
              <Moon className="w-3.5 h-3.5" />
              <span>Turno Tarde / Noche</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {afternoonSlots.map((slot) => {
                const isPast = checkIsPast(slot.date, slot.time);
                const isUserBooked = slot.attendeeIds.includes(currentAthleteId);
                const isFull = slot.attendeeIds.length >= slot.capacity;
                const spotsLeft = Math.max(0, slot.capacity - slot.attendeeIds.length);

                return (
                  <div
                    key={slot.id}
                    className={`relative p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isUserBooked
                        ? 'bg-gradient-to-b from-red-950/80 to-zinc-950 border-red-500 shadow-md shadow-red-950/40'
                        : isPast || !slot.isEnabled
                        ? 'bg-zinc-900/40 border-zinc-800/40 opacity-50'
                        : isFull
                        ? 'bg-zinc-900/60 border-zinc-800 opacity-70'
                        : 'bg-zinc-900 hover:bg-zinc-850 border-zinc-800 hover:border-red-500/40 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white font-teko tracking-wide">
                          {slot.label}
                        </span>
                        {isUserBooked && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                        <span className="text-[9px] uppercase font-bold text-red-500/80">CrossFit</span>
                      </div>

                      {/* Botón para ver atletas inscritos (accesible para todos, aun sin reserva) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlotForAttendees(slot);
                        }}
                        className="mt-1.5 w-full flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 hover:bg-zinc-800/80 border border-zinc-800 text-[10px] text-zinc-300 transition group cursor-pointer"
                        title="Ver atletas inscritos en este horario"
                      >
                        <span className="flex items-center gap-1 text-zinc-400 group-hover:text-white">
                          <Users className="w-3 h-3 text-red-400 shrink-0" />
                          <span className="font-semibold text-[9px]">Atletas:</span>
                        </span>
                        <span className="font-bold font-mono text-zinc-200 group-hover:text-red-400">
                          {slot.attendeeIds.length} / {slot.capacity}
                        </span>
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold ${
                          isFull ? 'text-red-400' : 'text-zinc-300'
                        }`}
                      >
                        {isFull ? 'Agotado' : `${spotsLeft} libres`}
                      </span>

                      {isUserBooked ? (
                        <button
                          type="button"
                          onClick={() => handlePromptCancel(slot.id, slot.label)}
                          className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-[10px] font-extrabold text-red-400 hover:bg-red-900"
                        >
                          Cancelar
                        </button>
                      ) : isPast ? (
                        <span className="text-[10px] text-zinc-500 font-semibold">Finalizada</span>
                      ) : isFull ? (
                        <span className="text-[10px] text-zinc-500 font-semibold">Lleno</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBook(slot.id)}
                          className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-[10px] font-extrabold text-white transition-colors"
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal Confirmación de Cancelación */}
      {slotToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">
              ¿Cancelar Reserva?
            </h3>
            <p className="text-xs text-zinc-400 mb-5">
              Estás a punto de liberar tu cupo para la clase de las{' '}
              <strong className="text-white">{slotToCancel.label}</strong>. Otro atleta podrá tomar este espacio.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSlotToCancel(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
              >
                Mantener Cupo
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 border border-red-700/50 text-white text-xs font-bold transition-colors shadow-lg shadow-red-950/50"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Participantes / Atletas Inscritos */}
      {selectedSlotForAttendees && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-zinc-100 flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase font-teko tracking-wide leading-none">
                    Atletas Inscritos • {selectedSlotForAttendees.label}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Fecha: <span className="text-zinc-300 font-bold">{selectedSlotForAttendees.date}</span> • {selectedSlotForAttendees.attendeeIds.length} de {selectedSlotForAttendees.capacity} cupos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedSlotForAttendees(null)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content / Attendees List */}
            <div className="py-3 overflow-y-auto flex-1 space-y-2">
              {selectedSlotForAttendees.attendeeIds.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-white">Aún no hay atletas inscritos</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    ¡Sé el primero en reservar tu cupo para esta franja!
                  </p>
                </div>
              ) : (
                selectedSlotForAttendees.attendeeIds.map((athId: string, idx: number) => {
                  const ath = athletes.find((a) => a.id === athId);
                  const isMe = athId === currentAthleteId;
                  const discipline = ath?.discipline || ath?.membership?.discipline || 'crossfit';

                  return (
                    <div
                      key={athId || idx}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                        isMe
                          ? 'bg-emerald-950/30 border-emerald-600/50 ring-1 ring-emerald-500/30'
                          : 'bg-zinc-900/60 border-zinc-800/80 hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-zinc-700 bg-zinc-800">
                          <AthleteAvatar
                            avatar={ath?.avatar}
                            name={ath?.name || 'Atleta'}
                            size="sm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white truncate">
                              {ath?.name || 'Atleta Indomable'}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-black">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-400 capitalize">
                            {discipline}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-zinc-500 font-bold">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedSlotForAttendees(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-300 transition"
              >
                Cerrar
              </button>

              {!selectedSlotForAttendees.attendeeIds.includes(currentAthleteId) &&
                selectedSlotForAttendees.attendeeIds.length < selectedSlotForAttendees.capacity &&
                !checkIsPast(selectedSlotForAttendees.date, selectedSlotForAttendees.time) && (
                  <button
                    type="button"
                    onClick={() => {
                      handleBook(selectedSlotForAttendees.id);
                      setSelectedSlotForAttendees(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 border border-red-700/50 text-xs font-extrabold text-white transition shadow-lg shadow-red-950/50"
                  >
                    Reservar este Cupo
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
