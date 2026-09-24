import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGym } from '../../context/GymContext';
import { PWAInstallButton } from './PWAInstallButton';
import { compressImageFile } from '../../utils/imageUtils';
import { AthleteAvatar } from './AthleteAvatar';
import {
  isBiometricsSupported,
  getBiometricEnrollment,
  registerBiometrics,
  removeBiometrics,
  BiometricEnrollment,
} from '../../utils/biometrics';
import {
  calculateMembershipDaysRemaining,
  formatMembershipDaysRemaining,
} from '../../utils/notificationUtils';
import {
  Flame,
  Shield,
  ChevronDown,
  Sparkles,
  LogOut,
  Lock,
  X,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  UserCheck,
  Camera,
  Upload,
  RefreshCw,
  Fingerprint,
  MessageCircle,
  Check,
  CreditCard,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    role,
    currentAthlete,
    currentCoach,
    athleteDiscipline,
    logout,
    updateAthlete,
    openPaymentModal,
  } = useGym();

  const [showAthleteMenu, setShowAthleteMenu] = useState(false);
  const [showStaffMenu, setShowStaffMenu] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccessMsg, setAvatarSuccessMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Biometrics State
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState<BiometricEnrollment>({ enrolled: false });
  const [isEnrollingBiometrics, setIsEnrollingBiometrics] = useState(false);
  const [biometricPinModalOpen, setBiometricPinModalOpen] = useState(false);
  const [biometricPinInput, setBiometricPinInput] = useState('');
  const [biometricError, setBiometricError] = useState('');
  const [biometricSuccess, setBiometricSuccess] = useState('');

  useEffect(() => {
    isBiometricsSupported().then((supported) => {
      setBiometricsSupported(supported);
      if (supported) {
        setBiometricsEnrolled(getBiometricEnrollment());
      }
    });
  }, [showAthleteMenu]);

  const handleEnrollBiometrics = async (e: React.FormEvent) => {
    e.preventDefault();
    setBiometricError('');
    setBiometricSuccess('');

    if (!currentAthlete) return;
    if (!biometricPinInput.trim()) {
      setBiometricError('Ingresa tu PIN de 4 dígitos para verificar tu identidad.');
      return;
    }

    if (currentAthlete.pin && biometricPinInput.trim() !== currentAthlete.pin) {
      setBiometricError('El PIN ingresado no coincide con el de tu cuenta.');
      return;
    }

    setIsEnrollingBiometrics(true);
    try {
      const res = await registerBiometrics(
        currentAthlete.documentId,
        biometricPinInput.trim(),
        currentAthlete.name
      );

      if (res.success) {
        setBiometricsEnrolled(getBiometricEnrollment());
        setBiometricSuccess(res.message);
        setTimeout(() => {
          setBiometricPinModalOpen(false);
          setBiometricSuccess('');
          setBiometricPinInput('');
        }, 1500);
      } else {
        setBiometricError(res.message);
      }
    } catch (err: any) {
      setBiometricError(err?.message || 'Error al configurar el sensor biométrico.');
    } finally {
      setIsEnrollingBiometrics(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentAthlete) return;

    setIsUploadingAvatar(true);
    setAvatarSuccessMsg('');
    try {
      const compressedAvatar = await compressImageFile(file, 350, 350, 0.82);
      updateAthlete(currentAthlete.id, { avatar: compressedAvatar });
      setAvatarSuccessMsg('¡Foto de perfil actualizada!');
      setTimeout(() => setAvatarSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error al actualizar avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };



  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/90 bg-black/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 p-0.5 shadow-md shadow-black/80 shrink-0 overflow-hidden">
              <img src="/logo.png" alt="INDOMABLE" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col justify-center">
              <img
                src="/logo-indomable-text.png"
                alt="INDOMABLE"
                className="h-5 sm:h-7 w-auto object-contain filter invert brightness-200"
              />
              <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold uppercase tracking-widest hidden sm:block leading-none mt-0.5">
                CrossFit & Performance Box
              </p>
            </div>
          </div>

          {/* Right Action Bar: PWA + Role Status / Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* 1. Admin Mode */}
            {role === 'admin' ? (
              <div className="relative">
                <button
                  type="button"
                  id="btn-admin-dropdown"
                  onClick={() => setShowStaffMenu(!showStaffMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-amber-600/60 bg-amber-950/40 px-2 sm:px-2.5 py-1 hover:bg-amber-950/60 hover:border-amber-500 transition shadow-md shadow-amber-950/50"
                >
                  <div className="h-7 w-7 rounded-lg bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-white leading-tight font-['Teko'] tracking-wide">
                      ADMINISTRADOR
                    </div>
                    <div className="text-[9px] text-amber-400 font-bold leading-tight uppercase tracking-wider">
                      Control Total
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                </button>

                {showStaffMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-amber-900/60 bg-zinc-950 p-3 shadow-2xl z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-2 border-b border-zinc-800/90 mb-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500 inline-block animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                          Panel Administrador
                        </span>
                      </div>
                      <p className="text-base font-black text-white font-['Teko'] tracking-wider leading-none">
                        ADMINISTRACIÓN GENERAL
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Aprobación de membresías, gestión de coaches y auditoría.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        id="btn-admin-logout"
                        onClick={() => {
                          setShowStaffMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-200 text-xs font-bold transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Cerrar Sesión Administrador</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : role === 'coach' ? (
              /* 2. Coach Mode */
              <div className="relative">
                <button
                  type="button"
                  id="btn-coach-dropdown"
                  onClick={() => setShowStaffMenu(!showStaffMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-red-800/70 bg-red-950/50 px-2 sm:px-2.5 py-1 hover:bg-red-950/70 hover:border-red-700 transition shadow-md shadow-red-950/50"
                >
                  <div className="h-7 w-7 rounded-lg bg-red-600/25 border border-red-600/40 flex items-center justify-center text-red-400 shrink-0">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-black text-white leading-tight font-['Teko'] tracking-wide">
                      {currentCoach?.name || 'ENTRENADOR'}
                    </div>
                    <div className="text-[9px] text-red-400 font-bold leading-tight uppercase tracking-wider">
                      Coach / Staff
                    </div>
                  </div>
                  <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                </button>

                {showStaffMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-red-900/60 bg-zinc-950 p-3 shadow-2xl z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2">
                    <div className="px-2 py-2 border-b border-zinc-800/90 mb-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-red-400">
                          Sesión Activa
                        </span>
                      </div>
                      <p className="text-base font-black text-white font-['Teko'] tracking-wider leading-none">
                        COACH {currentCoach?.name?.toUpperCase() || ''}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Control de WODs, clases, asistencia y consulta de atletas.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        id="btn-coach-logout"
                        onClick={() => {
                          setShowStaffMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/50 hover:bg-red-900/60 border border-red-800/60 text-red-200 text-xs font-bold transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Cerrar Sesión Coach</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* 3. Athlete Mode */
              <div className="relative">
                <button
                  type="button"
                  id="btn-athlete-dropdown"
                  onClick={() => setShowAthleteMenu(!showAthleteMenu)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-2 py-1 hover:bg-zinc-850 hover:border-zinc-700 transition"
                >
                  <div className="relative shrink-0">
                    <AthleteAvatar
                      avatar={currentAthlete?.avatar}
                      name={currentAthlete?.name}
                      size="sm"
                      className="rounded-lg"
                    />
                    {currentAthlete?.membership?.isActive ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-black" />
                    ) : currentAthlete?.membership?.isPendingApproval ? (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-black animate-pulse" />
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-700 ring-2 ring-black" />
                    )}
                  </div>

                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-zinc-200 leading-tight truncate max-w-[110px]">
                      {currentAthlete?.name?.split(' ')[0] || 'Atleta'}
                    </div>
                    <div className="text-[9px] font-bold leading-tight uppercase tracking-wider">
                      {athleteDiscipline === 'personalizado' ? (
                        <span className="text-purple-400">Personalizado</span>
                      ) : athleteDiscipline === 'musculacion' ? (
                        <span className="text-amber-400">Musculación</span>
                      ) : (
                        <span className="text-red-400">CrossFit</span>
                      )}
                    </div>
                  </div>

                  <ChevronDown className="h-3 w-3 text-zinc-400 shrink-0" />
                </button>

                {/* Athlete Dropdown Menu */}
                {showAthleteMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-zinc-800 bg-zinc-950 p-2.5 shadow-2xl z-50 text-zinc-200 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-2.5 border-b border-zinc-850">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                          Mi Perfil
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            athleteDiscipline === 'personalizado'
                              ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                              : athleteDiscipline === 'musculacion'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              : 'bg-red-950/80 text-red-300 border-red-800/60'
                          }`}
                        >
                          {athleteDiscipline === 'personalizado'
                            ? 'Personalizado'
                            : athleteDiscipline === 'musculacion'
                            ? 'Musculación'
                            : 'CrossFit'}
                        </span>
                      </div>

                      {/* Avatar with Camera Upload Button */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="relative group shrink-0">
                          <AthleteAvatar
                            avatar={currentAthlete?.avatar}
                            name={currentAthlete?.name}
                            size="lg"
                            className="w-12 h-12 rounded-xl"
                          />

                          <label
                            htmlFor="header-athlete-avatar-upload"
                            className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-red-800 hover:bg-red-700 text-white cursor-pointer shadow-md transition active:scale-95 border border-red-700/50"
                            title="Cambiar foto de perfil desde tu dispositivo"
                          >
                            {isUploadingAvatar ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Camera className="w-3 h-3" />
                            )}
                          </label>

                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            id="header-athlete-avatar-upload"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-zinc-100 font-bold truncate">
                            {currentAthlete?.name}
                          </p>
                          <label
                            htmlFor="header-athlete-avatar-upload"
                            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer font-semibold flex items-center gap-1 mt-0.5"
                          >
                            <Camera className="w-3 h-3" />
                            <span>{isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}</span>
                          </label>
                          {avatarSuccessMsg && (
                            <span className="text-[9px] text-emerald-400 font-bold block animate-fade-in mt-0.5">
                              ✓ {avatarSuccessMsg}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-400 font-mono">
                          CC: {currentAthlete?.documentId}
                        </span>
                        {currentAthlete?.membership?.isPendingApproval ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Pendiente Pago
                          </span>
                        ) : currentAthlete?.membership?.isActive ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Activa
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600/15 text-red-400 border border-red-600/30">
                            Vencida
                          </span>
                        )}
                      </div>

                      {/* Membership Details */}
                      <div className="mt-2.5 pt-2 border-t border-zinc-850/80 bg-zinc-900/60 p-2 rounded-xl text-[11px] space-y-1">
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Plan actual:</span>
                          <span className="font-bold text-white truncate max-w-[130px]">
                            {currentAthlete?.membership?.planName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-400">
                          <span>Vigencia:</span>
                          <span className="text-zinc-300">
                            {currentAthlete?.membership?.isPendingApproval
                              ? 'Pendiente de activación'
                              : `Hasta ${currentAthlete?.membership?.endDate}`}
                          </span>
                        </div>
                        {currentAthlete?.membership?.endDate && !currentAthlete?.membership?.isPendingApproval && (() => {
                          const daysRemaining = calculateMembershipDaysRemaining(currentAthlete.membership.endDate);
                          const daysInfo = formatMembershipDaysRemaining(daysRemaining);
                          return (
                            <div className="flex justify-between items-center text-zinc-400">
                              <span>Días restantes:</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${daysInfo.badgeClass}`}>
                                {daysInfo.text}
                              </span>
                            </div>
                          );
                        })()}
                        {typeof currentAthlete?.membership?.remainingClasses === 'number' && currentAthlete?.membership?.remainingClasses !== null && !currentAthlete?.membership?.isPendingApproval && (
                          <div className="flex justify-between items-center text-zinc-400">
                            <span>Clases disponibles:</span>
                            <span className="font-bold text-red-400">
                              {currentAthlete?.membership?.remainingClasses} de {currentAthlete?.membership?.totalClasses || 12}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón Renovar / Pagar Plan (Exclusivo Menú de Usuario) */}
                    <div className="py-2 border-b border-zinc-850">
                      <button
                        type="button"
                        id="btn-header-pay-plan"
                        onClick={() => {
                          setShowAthleteMenu(false);
                          openPaymentModal();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-red-950/40 active:scale-95 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-white" />
                          <span>Renovar / Pagar Plan</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-mono text-zinc-200">
                          Transferencia
                        </span>
                      </button>
                    </div>

                    {/* Acceso Biométrico */}
                    {biometricsSupported && (
                      <div className="py-2 border-b border-zinc-850 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                            <Fingerprint className="w-3.5 h-3.5 text-red-500" />
                            <span>Acceso Biométrico</span>
                          </div>
                          {biometricsEnrolled.enrolled && biometricsEnrolled.documentId === currentAthlete?.documentId && (
                            <button
                              type="button"
                              onClick={() => {
                                removeBiometrics();
                                setBiometricsEnrolled({ enrolled: false });
                              }}
                              className="text-[10px] text-zinc-400 hover:text-red-400 underline font-semibold transition"
                            >
                              Desvincular
                            </button>
                          )}
                        </div>

                        {biometricsEnrolled.enrolled && biometricsEnrolled.documentId === currentAthlete?.documentId ? (
                          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[10px] text-emerald-300 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                            <span>Huella / Face ID vinculado a este dispositivo</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setBiometricPinInput('');
                              setBiometricError('');
                              setBiometricSuccess('');
                              setBiometricPinModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-zinc-200 transition"
                          >
                            <span className="text-zinc-400">Sensor disponible</span>
                            <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 font-bold text-[10px] border border-red-600/30">
                              Vincular Huella
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Actions: Cerrar Sesión */}
                    <div className="py-2 border-b border-zinc-850 space-y-1">
                      <button
                        type="button"
                        id="btn-header-logout"
                        onClick={() => {
                          setShowAthleteMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-900/40 text-red-300 text-xs font-semibold transition text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400 shrink-0" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>

                    {/* Footer: PWA Offline Indicator */}
                    <div className="pt-2 mt-1 flex justify-end items-center px-1">
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-red-500" />
                        PWA Offline
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Modal para Vincular Autenticación Biométrica montado vía Portal */}
      {biometricPinModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setBiometricPinModalOpen(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                  <Fingerprint className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Vincular Sensor Biométrico</h3>
                  <p className="text-xs text-zinc-400">Huella digital o Face ID</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                Ingresa el PIN de 4 dígitos de tu cuenta para autorizar la vinculación con el sensor de este dispositivo.
              </p>

              {biometricError && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{biometricError}</span>
                </div>
              )}

              {biometricSuccess && (
                <div className="mb-3 flex items-start gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{biometricSuccess}</span>
                </div>
              )}

              <form onSubmit={handleEnrollBiometrics} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">PIN de Acceso (4 dígitos)</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      autoFocus
                      value={biometricPinInput}
                      onChange={(e) => setBiometricPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-3.5 py-2.5 text-white text-sm font-mono tracking-widest focus:border-red-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isEnrollingBiometrics}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50 disabled:opacity-50"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>{isEnrollingBiometrics ? 'Verificando sensor...' : 'Activar Biometría'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBiometricPinModalOpen(false)}
                    className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
};
