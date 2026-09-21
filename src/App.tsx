import React, { useState, useEffect } from 'react';
import { GymProvider, useGym } from './context/GymContext';
import { Header } from './components/common/Header';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { NotificationToast } from './components/common/NotificationToast';
import { WelcomeFeedView } from './components/athlete/WelcomeFeedView';
import { UnifiedWODBookingView } from './components/athlete/UnifiedWODBookingView';
import { AnthropometryView } from './components/athlete/AnthropometryView';
import { RMCalculatorView } from './components/athlete/RMCalculatorView';
import { WODResultsLogView } from './components/athlete/WODResultsLogView';
import { WODTimerView } from './components/athlete/WODTimerView';
import { CoachDashboard } from './components/coach/CoachDashboard';
import { LoginView } from './components/auth/LoginView';
import { MaintenanceView } from './components/common/MaintenanceView';
import { AthleteCheckInModal } from './components/athlete/AthleteCheckInModal';
import { PaymentModal } from './components/athlete/PaymentModal';
import { initOneSignal, identifyUserInOneSignal, logoutOneSignal } from './services/oneSignalService';
import {
  Calendar,
  Flame,
  Percent,
  Timer,
  Clock,
  Trophy,
  Shield,
  Lock,
  Sparkles,
  Activity,
  Dumbbell,
  UserCheck,
  Award,
  CreditCard,
  Home,
  DoorOpen,
} from 'lucide-react';

type AthleteTab = 'feed' | 'wod-booking' | 'rms' | 'logs' | 'anthropometry' | 'timer';

const MainContent: React.FC = () => {
  const {
    role,
    isAuthenticated,
    currentAthleteId,
    currentAthlete,
    athleteDiscipline,
    isCrossFitAthlete,
    isMusculacionAthlete,
    isPersonalizadoAthlete,
    isMaintenanceMode,
    gymSettings,
    logout,
    isPaymentModalOpen,
    closePaymentModal,
  } = useGym();

  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isAdminTurnstileModalOpen, setIsAdminTurnstileModalOpen] = useState(false);

  const [athleteTab, setAthleteTab] = useState<AthleteTab>('feed');
  const [rmExercisePreset, setRmExercisePreset] = useState<string | undefined>(undefined);

  // Inicializar OneSignal Push Web en el cliente
  useEffect(() => {
    initOneSignal();
  }, []);

  // Asegurar que siempre que se inicie sesión o se cambie de usuario, la app comience en 'feed' (Inicio)
  useEffect(() => {
    if (isAuthenticated) {
      setAthleteTab('feed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      identifyUserInOneSignal(currentAthleteId || role, role);
    } else {
      logoutOneSignal();
    }
  }, [isAuthenticated, currentAthleteId, role]);

  // Sanitizar tab si el atleta no tiene permisos para esa sección (por ejemplo si un usuario de musculación intenta ir a WOD)
  useEffect(() => {
    if (role === 'athlete') {
      if ((isMusculacionAthlete || isPersonalizadoAthlete) && (athleteTab === 'wod-booking' || athleteTab === 'logs')) {
        setAthleteTab('feed');
      }
    }
  }, [athleteDiscipline, isMusculacionAthlete, isPersonalizadoAthlete, athleteTab, role]);

  const isTestUser = currentAthlete?.documentId === 'TEST-001';

  // Si el sitio está en mantenimiento: solo puede acceder el Admin y el Usuario de Prueba (Demo)
  if (isMaintenanceMode && role !== 'admin' && !isTestUser) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <OfflineIndicator />
        <NotificationToast />
        <MaintenanceView customMessage={gymSettings?.maintenanceMessage} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-[100dvh] w-full overflow-hidden bg-black text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
        <OfflineIndicator />
        <NotificationToast />
        <LoginView />
      </div>
    );
  }

  const handleNavigateToRM = (exerciseHint?: string) => {
    setRmExercisePreset(exerciseHint || 'Clean & Jerk');
    setAthleteTab('rms');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToScoreLog = () => {
    setAthleteTab('logs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTab = (tab: string) => {
    if (tab === 'wod-booking' || tab === 'booking' || tab === 'wod') {
      setAthleteTab('wod-booking');
    } else if (tab === 'rms') {
      setAthleteTab('rms');
    } else if (tab === 'logs' || tab === 'wod-results') {
      setAthleteTab('logs');
    } else if (tab === 'timer' || tab === 'reloj' || tab === 'tabata') {
      setAthleteTab('timer');
    } else if (tab === 'anthropometry') {
      setAthleteTab('anthropometry');
    } else {
      setAthleteTab('feed');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans pb-[calc(env(safe-area-inset-bottom)+5rem)] sm:pb-12 selection:bg-red-800 selection:text-white">
      {/* Offline Status Bar */}
      <OfflineIndicator />
      {/* Real-time In-App Notification Toast */}
      <NotificationToast />

      {/* App Header */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3.5 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Test User Banner during maintenance */}
        {isTestUser && isMaintenanceMode && (
          <div className="p-3.5 rounded-2xl bg-purple-950/80 border border-purple-500/50 shadow-xl flex items-center justify-between gap-3 text-xs text-purple-200 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-600/30 text-purple-300 font-bold shrink-0">
                🧪
              </span>
              <div>
                <strong className="text-white block uppercase tracking-wider text-[11px]">
                  Modo de Prueba Activo (Sitio en Mantenimiento)
                </strong>
                <span className="text-[10px] text-purple-300">
                  Has ingresado como Usuario de Prueba para recorrer y validar todas las funciones del Box.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white font-bold text-[10px] uppercase tracking-wider transition shrink-0"
            >
              Salir
            </button>
          </div>
        )}

        {role === 'coach' || role === 'admin' ? (
          /* Staff / Coach / Admin Control View */
          <CoachDashboard />
        ) : (
          /* Athlete View */
          <div className="space-y-6">
            {/* Content per active Tab */}
            {athleteTab === 'feed' && (
              <WelcomeFeedView onNavigateTab={handleNavigateTab} />
            )}

            {athleteTab === 'wod-booking' && isCrossFitAthlete && (
              <UnifiedWODBookingView
                onOpenRMCalculator={handleNavigateToRM}
                onOpenScoreLogger={handleNavigateToScoreLog}
              />
            )}

            {athleteTab === 'anthropometry' && isPersonalizadoAthlete && (
              <AnthropometryView />
            )}

            {athleteTab === 'rms' && (
              <RMCalculatorView initialExercise={rmExercisePreset} />
            )}

            {athleteTab === 'logs' && isCrossFitAthlete && (
              <WODResultsLogView />
            )}

            {athleteTab === 'timer' && (
              <WODTimerView />
            )}
          </div>
        )}
      </main>

      {/* Universal Bottom Navigation Bar in Dark Crimson & Black */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-black/95 backdrop-blur-lg px-2 sm:px-6 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] flex justify-center items-center shadow-2xl">
        <div
          className={`w-full max-w-md flex items-center ${
            isPersonalizadoAthlete || isMusculacionAthlete
              ? 'justify-center gap-8 sm:gap-14'
              : 'justify-around'
          }`}
        >
          {role === 'athlete' ? (
            <>
              {/* Tab 1: Inicio (Feed de Novedades & Flyers) - Todos los atletas */}
              <button
                type="button"
                id="tab-nav-feed"
                onClick={() => {
                  setAthleteTab('feed');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                  athleteTab === 'feed'
                    ? 'text-red-400 font-black scale-105'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Home className={`w-5 h-5 mb-0.5 ${athleteTab === 'feed' ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Inicio</span>
              </button>

              {/* Atletas CrossFit: WOD & Reservas, RMs, Reloj y Pizarra */}
              {isCrossFitAthlete && (
                <>
                  <button
                    type="button"
                    id="tab-nav-wod-booking"
                    onClick={() => {
                      setAthleteTab('wod-booking');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                      athleteTab === 'wod-booking'
                        ? 'text-red-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Flame className={`w-5 h-5 mb-0.5 ${athleteTab === 'wod-booking' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">WOD</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-rms"
                    onClick={() => {
                      setAthleteTab('rms');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                      athleteTab === 'rms'
                        ? 'text-red-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Percent className={`w-5 h-5 mb-0.5 ${athleteTab === 'rms' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">RMs</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-timer"
                    onClick={() => {
                      setAthleteTab('timer');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                      athleteTab === 'timer'
                        ? 'text-amber-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Timer className={`w-5 h-5 mb-0.5 ${athleteTab === 'timer' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reloj</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-logs"
                    onClick={() => {
                      setAthleteTab('logs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
                      athleteTab === 'logs'
                        ? 'text-red-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Trophy className={`w-5 h-5 mb-0.5 ${athleteTab === 'logs' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Pizarra</span>
                  </button>
                </>
              )}

              {/* Atletas de Solo Musculación: RMs & Cargas + Reloj */}
              {isMusculacionAthlete && (
                <>
                  <button
                    type="button"
                    id="tab-nav-rms"
                    onClick={() => {
                      setAthleteTab('rms');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      athleteTab === 'rms'
                        ? 'text-amber-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Dumbbell className={`w-5 h-5 mb-0.5 ${athleteTab === 'rms' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">RMs & Cargas</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-timer"
                    onClick={() => {
                      setAthleteTab('timer');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      athleteTab === 'timer'
                        ? 'text-amber-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Timer className={`w-5 h-5 mb-0.5 ${athleteTab === 'timer' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reloj WOD</span>
                  </button>
                </>
              )}

              {/* Atletas de Entrenamiento Personalizado: RMs, Reloj y Medición */}
              {isPersonalizadoAthlete && (
                <>
                  <button
                    type="button"
                    id="tab-nav-rms"
                    onClick={() => {
                      setAthleteTab('rms');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      athleteTab === 'rms'
                        ? 'text-purple-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Percent className={`w-5 h-5 mb-0.5 ${athleteTab === 'rms' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">RMs & Cargas</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-timer"
                    onClick={() => {
                      setAthleteTab('timer');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      athleteTab === 'timer'
                        ? 'text-amber-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Timer className={`w-5 h-5 mb-0.5 ${athleteTab === 'timer' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reloj WOD</span>
                  </button>

                  <button
                    type="button"
                    id="tab-nav-anthropometry"
                    onClick={() => {
                      setAthleteTab('anthropometry');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
                      athleteTab === 'anthropometry'
                        ? 'text-purple-400 font-black scale-105'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Activity className={`w-5 h-5 mb-0.5 ${athleteTab === 'anthropometry' ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Medición</span>
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full text-center py-1 text-xs font-bold flex items-center justify-center gap-2">
              {role === 'admin' ? (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400">Panel de Administración General Activo</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Panel de Coach Activo • Sesión Staff</span>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Floating Check-in / Torniquete Button for Athlete (Solo en Menú Inicio) */}
      {role === 'athlete' && athleteTab === 'feed' && (
        <button
          type="button"
          id="btn-floating-checkin"
          onClick={() => setIsCheckInModalOpen(true)}
          title="Marcar ingreso al Box (Torniquete)"
          className="fixed bottom-[4.25rem] sm:bottom-6 right-3.5 sm:right-6 z-40 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-2xl shadow-red-950/80 border border-red-500/50 active:scale-95 transition-all"
        >
          <div className="relative">
            <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-black" />
          </div>
          <span className="hidden sm:inline">Ingreso al Box</span>
          <span className="sm:hidden">Ingreso</span>
        </button>
      )}

      {/* Floating Manual Turnstile Button for Admin */}
      {role === 'admin' && (
        <button
          type="button"
          id="btn-floating-turnstile-admin"
          onClick={() => setIsAdminTurnstileModalOpen(true)}
          title="Apertura manual de torniquete para invitados"
          className="fixed bottom-[4.25rem] sm:bottom-6 right-3.5 sm:right-6 z-40 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-2xl shadow-amber-950/80 border border-amber-500/50 active:scale-95 transition-all"
        >
          <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          <span className="hidden sm:inline">Torniquete / Invitados</span>
          <span className="sm:hidden">Torniquete</span>
        </button>
      )}

      {/* Athlete Self Check-In / Turnstile Modal */}
      <AthleteCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        isAdminManual={false}
      />

      {/* Admin Manual Turnstile Modal */}
      <AthleteCheckInModal
        isOpen={isAdminTurnstileModalOpen}
        onClose={() => setIsAdminTurnstileModalOpen(false)}
        isAdminManual={true}
      />

      {/* Payment & Renewal Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
      />
    </div>
  );
};

export default function App() {
  return (
    <GymProvider>
      <MainContent />
    </GymProvider>
  );
}
