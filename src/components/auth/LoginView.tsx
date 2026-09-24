import React, { useState, useRef, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { AthleteDiscipline } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import { AthleteAvatar } from '../common/AthleteAvatar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { TermsModal } from '../common/TermsModal';
import {
  isBiometricsSupported,
  getBiometricEnrollment,
  authenticateWithBiometrics,
  BiometricEnrollment,
} from '../../utils/biometrics';
import {
  Flame,
  User,
  Shield,
  CreditCard,
  KeyRound,
  ArrowRight,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
  Dumbbell,
  Sparkles,
  Camera,
  Upload,
  RefreshCw,
  X,
  Fingerprint,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const {
    loginWithDocumentId,
    loginAsCoach,
    loginAsAdmin,
    registerAthlete,
  } = useGym();

  // Athlete Login State
  const [documentInput, setDocumentInput] = useState('');
  const [athletePinInput, setAthletePinInput] = useState('');
  const [showAthletePin, setShowAthletePin] = useState(false);

  // Biometrics State
  const [biometricsSupported, setBiometricsSupported] = useState(false);
  const [enrolledInfo, setEnrolledInfo] = useState<BiometricEnrollment>({ enrolled: false });

  useEffect(() => {
    isBiometricsSupported().then((supported) => {
      setBiometricsSupported(supported);
      if (supported) {
        setEnrolledInfo(getBiometricEnrollment());
      }
    });
  }, []);

  const handleBiometricLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);
    try {
      const authRes = await authenticateWithBiometrics();
      if (!authRes.success || !authRes.documentId || !authRes.pin) {
        setErrorMessage(authRes.message || 'No fue posible validar la biometría.');
        return;
      }

      const res = await loginWithDocumentId(authRes.documentId, authRes.pin);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error en autenticación biométrica.');
    } finally {
      setIsLoading(false);
    }
  };

  // Staff Dropdown & State
  const [showStaffAccess, setShowStaffAccess] = useState(false);
  const [staffRole, setStaffRole] = useState<'coach' | 'admin'>('coach');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);

  // Global Messages & Loaders
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Self-register state
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDoc, setRegDoc] = useState('');
  const [regPin, setRegPin] = useState('');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regGender, setRegGender] = useState<'masculino' | 'femenino' | 'otro'>('masculino');
  const [regBirthDate, setRegBirthDate] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regEps, setRegEps] = useState('');
  const [regEmergName, setRegEmergName] = useState('');
  const [regEmergPhone, setRegEmergPhone] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [regAvatar, setRegAvatar] = useState<string>('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const regAvatarInputRef = useRef<HTMLInputElement>(null);

  const handleRegAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingAvatar(true);
    try {
      const compressed = await compressImageFile(file, 350, 350, 0.82);
      setRegAvatar(compressed);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar la foto de perfil.');
    } finally {
      setIsCompressingAvatar(false);
      if (regAvatarInputRef.current) {
        regAvatarInputRef.current.value = '';
      }
    }
  };

  const handleAthleteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!documentInput.trim()) {
      setErrorMessage('Por favor ingresa tu número de cédula o documento.');
      return;
    }

    if (!athletePinInput.trim()) {
      setErrorMessage('Por favor ingresa tu PIN de acceso de 4 dígitos.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithDocumentId(documentInput.trim(), athletePinInput.trim());
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Error de conexión al verificar credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!staffUsername.trim() || !staffPassword.trim()) {
      setErrorMessage('Por favor ingresa tu usuario/correo y contraseña.');
      return;
    }

    setIsLoading(true);
    try {
      if (staffRole === 'coach') {
        const res = await loginAsCoach(staffUsername.trim(), staffPassword.trim());
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        const res = await loginAsAdmin(staffUsername.trim(), staffPassword.trim());
        if (res.success) {
          setSuccessMessage(res.message);
        } else {
          setErrorMessage(res.message);
        }
      }
    } catch {
      setErrorMessage('Error al procesar el inicio de sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regDoc.trim() || !regName.trim()) {
      setErrorMessage('Nombre completo y Cédula son obligatorios.');
      return;
    }

    if (!regEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) {
      setErrorMessage(
        'Debes ingresar un correo electrónico válido (ej: atleta@correo.com) para recibir tus notificaciones de acceso y activación.'
      );
      return;
    }

    if (!/^\d{4}$/.test(regPin.trim())) {
      setErrorMessage('Debes crear un PIN de acceso de exactamente 4 números (ej: 1234).');
      return;
    }

    if (!acceptedTerms) {
      setErrorMessage('Debes aceptar los Términos y Condiciones y la Exoneración de Responsabilidad para crear tu cuenta.');
      return;
    }

    const res = registerAthlete({
      documentId: regDoc.trim(),
      name: regName.trim(),
      pin: regPin.trim(),
      phone: regPhone.trim(),
      email: regEmail.trim(),
      avatar: regAvatar || undefined,
      gender: regGender,
      birthDate: regBirthDate || undefined,
      address: regAddress.trim() || undefined,
      eps: regEps.trim() || undefined,
      emergencyContact: regEmergName.trim()
        ? { name: regEmergName.trim(), phone: regEmergPhone.trim() }
        : undefined,
      acceptedTerms: true,
      planName: 'Pendiente de Asignación / Pago',
    });

    if (res.success) {
      setSuccessMessage(res.message);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-5 shadow-2xl relative text-zinc-100 flex flex-col justify-center max-h-[96dvh] overflow-y-auto">
        {/* Glowing Red Background Accent */}
        <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 p-1 shadow-lg shadow-black/80 shrink-0 overflow-hidden">
              <img src="/logo.png" alt="INDOMABLE" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl sm:text-2xl font-black font-['Teko'] tracking-wider text-white uppercase leading-none">
                  INDOMABLE
                </h2>
                <span className="rounded bg-red-600/20 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-red-400 border border-red-600/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Control de Acceso & Comunidad</p>
            </div>
          </div>

          <PWAInstallButton />
        </div>

        {/* Banner para Instalar PWA si no está instalada */}
        <PWAInstallButton variant="banner" />

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-2.5 text-xs text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* 1. Atleta Login Form (Hero View) - Visible cuando no está en staff access */}
        {!isRegistering && !showStaffAccess && (
          <div className="space-y-3 animate-in fade-in">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <User className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white">Ingreso de Atleta</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Digita tu número de cédula y PIN para acceder a tu box.
              </p>
            </div>

            {/* Acceso Biométrico Prioritario en la Parte Superior */}
            {enrolledInfo.enrolled && (
              <div className="space-y-2 pb-1">
                <button
                  type="button"
                  id="btn-biometric-login"
                  onClick={handleBiometricLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-red-600 hover:from-red-500 hover:to-red-600 py-3 px-4 text-xs font-black uppercase tracking-wider text-white border border-red-500/60 shadow-lg shadow-red-950/60 transition active:scale-95 disabled:opacity-50 group"
                >
                  <Fingerprint className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span>Ingresar con Huella / Face ID ({enrolledInfo.userName || 'Atleta'})</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-zinc-800 w-full" />
                  <span className="bg-zinc-950 px-2.5 text-[10px] text-zinc-500 uppercase font-bold tracking-wider shrink-0">
                    O con Cédula y PIN
                  </span>
                  <div className="border-t border-zinc-800 w-full" />
                </div>
              </div>
            )}

            <form onSubmit={handleAthleteLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Número de Cédula / Documento
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    id="input-document-id"
                    value={documentInput}
                    onChange={(e) => setDocumentInput(e.target.value)}
                    placeholder="Ej: 1020304050"
                    autoFocus={!enrolledInfo.enrolled}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-3.5 py-2 text-sm text-white font-medium placeholder-zinc-500 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-300">
                    PIN de Acceso (4 dígitos)
                  </label>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type={showAthletePin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    id="input-athlete-pin"
                    value={athletePinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setAthletePinInput(val);
                    }}
                    placeholder="••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-10 py-2 text-sm text-white font-mono tracking-widest placeholder-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAthletePin(!showAthletePin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    tabIndex={-1}
                    aria-label={showAthletePin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showAthletePin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Verificando acceso...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a mi Box</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {biometricsSupported && !enrolledInfo.enrolled && (
                <p className="text-[10px] text-zinc-500 text-center flex items-center justify-center gap-1 pt-0.5">
                  <Fingerprint className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Tu dispositivo admite Huella / Face ID. Podrás activarlo al ingresar.</span>
                </p>
              )}
            </form>

            {/* Switch to Self-register */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs text-zinc-400 hover:text-red-400 font-medium transition"
              >
                ¿No estás registrado aún en INDOMABLE?{' '}
                <strong className="text-red-500 underline underline-offset-2">Registrarme</strong>
              </button>
            </div>

            {/* Collapsible Staff / Admin Access Button */}
            <div className="pt-3 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setShowStaffAccess(true);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Otras opciones de acceso</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span>Coach / Admin</span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 2. Staff Access View (Coach / Admin) - Atleta contraído para no saturar información */}
        {!isRegistering && showStaffAccess && (
          <div className="space-y-3 animate-in fade-in">
            {/* Barra contraída de Ingreso de Atleta */}
            <button
              type="button"
              onClick={() => {
                setShowStaffAccess(false);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800 text-xs transition group"
              title="Toca para expandir el formulario de ingreso de atleta"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-red-500" />
                <span className="font-bold text-zinc-300">Ingreso de Atleta</span>
                <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-850">
                  Contraído
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-red-400 group-hover:text-red-300">
                <span>Expandir</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </div>
            </button>

            {/* Formulario Staff / Coach / Admin */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3.5 shadow-lg">
              {/* Selector Coach vs Admin */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStaffRole('coach');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold uppercase tracking-wider text-[11px] transition ${
                    staffRole === 'coach'
                      ? 'bg-red-800 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  <span>Coach</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStaffRole('admin');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md font-bold uppercase tracking-wider text-[11px] transition ${
                    staffRole === 'admin'
                      ? 'bg-amber-700 text-white shadow'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Administrador</span>
                </button>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    {staffRole === 'admin' ? 'Usuario o Correo de Administrador' : 'Usuario o Correo del Coach'}
                  </label>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    placeholder={staffRole === 'admin' ? 'admin o correo' : 'coach o correo'}
                    autoFocus
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                    Contraseña Robusta
                  </label>
                  <div className="relative">
                    <input
                      type={showStaffPassword ? 'text' : 'password'}
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 pl-3 pr-9 py-2 text-xs text-white placeholder-zinc-600 focus:border-red-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                      tabIndex={-1}
                      aria-label={showStaffPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showStaffPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold uppercase tracking-wider text-white transition disabled:opacity-50 ${
                    staffRole === 'admin'
                      ? 'bg-amber-700 hover:bg-amber-600 shadow-md shadow-amber-950/50'
                      : 'bg-red-800 hover:bg-red-700 shadow-md shadow-red-950/50'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <span>
                      Ingresar como {staffRole === 'admin' ? 'Administrador' : 'Coach'}
                    </span>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowStaffAccess(false);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="text-xs text-zinc-400 hover:text-white transition inline-flex items-center gap-1"
              >
                <span>← Volver al ingreso de Atleta</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Self-Register New Athlete */}
        {isRegistering && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Registro de Nuevo Atleta</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Crea tu perfil. La administración activará tu mensualidad al verificar tu pago.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Volver
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[62dvh] overflow-y-auto overflow-x-hidden pr-1">
              {/* Avatar Upload Field */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <input
                  ref={regAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleRegAvatarChange}
                  className="hidden"
                  id="reg-avatar-upload"
                />

                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-full overflow-hidden bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center">
                    {isCompressingAvatar ? (
                      <RefreshCw className="w-5 h-5 text-red-500 animate-spin" />
                    ) : regAvatar ? (
                      <img src={regAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AthleteAvatar name={regName || 'Atleta'} size="lg" className="w-full h-full rounded-full border-0" />
                    )}
                  </div>

                  <label
                    htmlFor="reg-avatar-upload"
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow transition"
                    title="Seleccionar foto desde tu dispositivo"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <label htmlFor="reg-avatar-upload" className="cursor-pointer block">
                    <p className="text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-500" />
                      <span>{regAvatar ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {regAvatar ? '✓ Foto lista para tu perfil' : 'Opcional • Desde tu galería o cámara'}
                    </p>
                  </label>

                  {regAvatar && (
                    <button
                      type="button"
                      onClick={() => setRegAvatar('')}
                      className="text-[10px] text-zinc-500 hover:text-red-400 mt-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Quitar foto</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Número de Cédula / Identificación *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={regDoc}
                  onChange={(e) => setRegDoc(e.target.value)}
                  placeholder="Ej: 1020304050"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Crea tu PIN de Acceso (4 dígitos) *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <input
                    type={showRegPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    required
                    value={regPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setRegPin(val);
                    }}
                    placeholder="4 dígitos numéricos (ej: 1234)"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-8 p-2.5 text-xs text-white font-mono tracking-wider focus:border-red-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPin(!showRegPin)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                    tabIndex={-1}
                    aria-label={showRegPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                  >
                    {showRegPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  🔒 Este código de 4 números te servirá para ingresar a tu cuenta junto con tu cédula.
                </span>
              </div>

              {/* Género y Fecha de Nacimiento */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Género *
                  </label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                  >
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro / Prefiero no decir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    required
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dirección y EPS */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Dirección de Residencia
                  </label>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="Calle / Carrera / Barrio"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    EPS / Seguro Médico
                  </label>
                  <input
                    type="text"
                    value={regEps}
                    onChange={(e) => setRegEps(e.target.value)}
                    placeholder="Ej: Sura, Sanitas, Compensar..."
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 block">
                  Contacto de Emergencia
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Nombre Contacto</label>
                    <input
                      type="text"
                      value={regEmergName}
                      onChange={(e) => setRegEmergName(e.target.value)}
                      placeholder="Nombre y parentesco"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Teléfono Contacto</label>
                    <input
                      type="tel"
                      value={regEmergPhone}
                      onChange={(e) => setRegEmergPhone(e.target.value)}
                      placeholder="Número de celular"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="atleta@correo.com"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox de Términos y Condiciones */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <input
                  type="checkbox"
                  id="accept-terms-checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-red-600 focus:ring-red-600 cursor-pointer"
                />
                <label htmlFor="accept-terms-checkbox" className="text-[11px] text-zinc-300 leading-relaxed cursor-pointer select-none">
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermsModal(true);
                    }}
                    className="text-red-400 font-bold underline hover:text-red-300"
                  >
                    Términos, Condiciones y Exoneración de Responsabilidad
                  </button>{' '}
                  para actividad física y la Política de Protección de Datos (Ley 1581 de Habeas Data).
                </label>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/50 text-[11px] text-amber-200/90 leading-relaxed">
                ✉️ <strong>Activación:</strong> Tu cuenta quedará creada de inmediato y recibirás tu correo de bienvenida. Tu membresía se activará en recepción o al confirmar tu comprobante de pago.
              </div>

              <button
                type="submit"
                disabled={!acceptedTerms}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg shadow-red-950/60 transition active:scale-95 border border-red-700/50 mt-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear Cuenta de Atleta</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-850 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancelar y regresar
              </button>
            </form>

            <TermsModal
              isOpen={showTermsModal}
              onClose={() => setShowTermsModal(false)}
              onAccept={() => setAcceptedTerms(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
