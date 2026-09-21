import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useGym } from '../../context/GymContext';
import { AthleteAvatar } from '../common/AthleteAvatar';
import {
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  User,
  Zap,
  Lock,
  Flame,
  Dumbbell,
  Sparkles,
  ArrowRight,
  X,
  Volume2,
} from 'lucide-react';
import { playNotificationSound } from '../../utils/notificationUtils';

interface AthleteCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminManual?: boolean;
}

export const AthleteCheckInModal: React.FC<AthleteCheckInModalProps> = ({
  isOpen,
  onClose,
  isAdminManual = false,
}) => {
  const {
    currentAthlete,
    role,
    updateAthlete,
    addActivityLog,
    gymSettings,
  } = useGym();

  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setStatus('idle');
      setCountdown(5);
      return;
    }

    if (isAdminManual) {
      // Activar el torniquete inmediatamente sin preguntar información!
      setStatus('granted');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
      playNotificationSound();
      addActivityLog({
        category: 'ADMIN',
        action: 'Apertura Manual de Torniquete',
        description: 'Torniquete activado inmediatamente por el Administrador (Pase libre de invitado).',
        actor: 'Administrador',
      });
      return;
    }

    // Athlete self check-in flow
    if (!currentAthlete) {
      setStatus('denied');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const membership = currentAthlete.membership;
    const isDateExpired = Boolean(membership?.endDate && membership.endDate < todayStr);
    const remCls = typeof membership?.remainingClasses === 'number' ? membership.remainingClasses : null;
    const hasPunch = remCls !== null;
    const isExpired = !membership?.isActive || isDateExpired || (hasPunch && remCls <= 0);

    if (isExpired) {
      setStatus('denied');
      playNotificationSound();
      addActivityLog({
        category: 'SECURITY',
        action: 'Acceso Denegado Torniquete',
        description: `Ingreso denegado al atleta ${currentAthlete.name} (CC ${currentAthlete.documentId}). Membresía vencida o sin clases.`,
        actor: currentAthlete.name,
        target: currentAthlete.documentId,
      });
    } else {
      // Access Granted!
      setStatus('granted');
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      // If Punch Card, deduct 1 class
      if (hasPunch && remCls > 0) {
        const newRemaining = remCls - 1;
        updateAthlete(currentAthlete.id, {
          membership: {
            ...membership,
            remainingClasses: newRemaining,
            isActive: newRemaining > 0,
          },
        });
      }

      addActivityLog({
        category: 'SECURITY',
        action: 'Ingreso Autorizado Torniquete',
        description: `Check-in exitoso en torniquete: ${currentAthlete.name} (${membership?.planName || 'Plan Box'}).${hasPunch ? ` Clases restantes: ${remCls - 1}` : ''}`,
        actor: currentAthlete.name,
        target: currentAthlete.documentId,
      });
    }
  }, [isOpen, currentAthlete, isAdminManual]);

  // Countdown timer for granted screen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === 'granted' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (status === 'granted' && countdown === 0) {
      onClose();
    }
    return () => clearTimeout(timer);
  }, [status, countdown, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg animate-in fade-in select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-center space-y-5 overflow-hidden">
        {/* Glow Accent */}
        <div
          className={`absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            status === 'granted'
              ? 'bg-emerald-600/20'
              : status === 'denied'
              ? 'bg-red-600/20'
              : 'bg-amber-600/15'
          }`}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-900 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Access Granted View (Both for Athlete & Instant Admin Guest) */}
        {status === 'granted' && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/80 animate-bounce">
              {isAdminManual ? <DoorOpen className="w-12 h-12" /> : <CheckCircle2 className="w-12 h-12" />}
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-[11px] uppercase tracking-widest">
                {isAdminManual ? 'TORNIQUETE ACTIVADO 🟢' : 'ACCESO AUTORIZADO 🟢'}
              </span>
              <h3 className="text-2xl font-black font-['Teko'] uppercase text-white mt-2 tracking-wide">
                {isAdminManual ? 'TORNIQUETE LIBERADO' : '¡BIENVENIDO A INDOMABLE!'}
              </h3>
              <p className="text-xs text-zinc-400">
                {isAdminManual
                  ? `Pase libre de invitado concedido. El torniquete estará activo por ${countdown} segundos.`
                  : `Pase por el torniquete. Tienes ${countdown} segundos.`}
              </p>
            </div>

            {!isAdminManual && currentAthlete && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3 text-left">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700">
                  <AthleteAvatar avatar={currentAthlete.avatar} name={currentAthlete.name} size="md" className="w-full h-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentAthlete.name}</p>
                  <p className="text-[10px] text-emerald-400 font-semibold truncate">
                    {currentAthlete.membership?.planName || 'Plan Activo'}
                  </p>
                  {typeof currentAthlete.membership?.remainingClasses === 'number' && (
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                      Clases restantes: {currentAthlete.membership.remainingClasses}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isAdminManual && (
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-center gap-2">
                <DoorOpen className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Pase manual de invitado activado por Administración</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition"
            >
              Listo ({countdown}s)
            </button>
          </div>
        )}

        {/* 3. Access Denied View */}
        {status === 'denied' && (
          <div className="space-y-4 animate-in shake duration-200">
            <div className="w-20 h-20 mx-auto rounded-full bg-red-600/20 border-2 border-red-600 flex items-center justify-center text-red-500 shadow-xl shadow-red-950/80">
              <AlertCircle className="w-12 h-12" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-600/40 text-red-400 font-black text-[11px] uppercase tracking-widest">
                ACCESO DENEGADO 🔴
              </span>
              <h3 className="text-2xl font-black font-['Teko'] uppercase text-white mt-2 tracking-wide">
                MEMBRESÍA NO DISPONIBLE
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Tu plan actual se encuentra vencido, agotado o pendiente de activación por parte de la administración.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-900/50 text-left text-xs text-red-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>¿Cómo habilitar tu acceso?</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                1. Acércate a la recepción del box o contacta al coach/admin.<br />
                2. Realiza el pago o renovación de tu mensualidad.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
