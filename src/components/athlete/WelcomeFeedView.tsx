import React, { useState, useRef, useEffect } from 'react';
import {
  Flame,
  Dumbbell,
  Sparkles,
  Megaphone,
  Calendar,
  ChevronRight,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Award,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  Timer,
  UserCheck,
  Upload,
  RefreshCw,
  Bell,
  BellRing,
  MessageCircle,
  Settings,
  Link,
  ZoomIn,
  Smartphone,
  Share2,
  CreditCard,
} from 'lucide-react';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { useGym } from '../../context/GymContext';
import { GymFlyer, AthleteDiscipline } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  calculateMembershipDaysRemaining,
  formatMembershipDaysRemaining,
} from '../../utils/notificationUtils';
import {
  ONESIGNAL_APP_ID,
  promptOneSignalPushPermission,
} from '../../services/oneSignalService';

interface WelcomeFeedViewProps {
  onNavigateTab?: (tab: string) => void;
  onOpenPayment?: () => void;
}

export const WelcomeFeedView: React.FC<WelcomeFeedViewProps> = ({ onNavigateTab, onOpenPayment }) => {
  const {
    currentAthlete,
    role,
    athleteDiscipline,
    isCrossFitAthlete,
    isMusculacionAthlete,
    isPersonalizadoAthlete,
    flyers,
    saveFlyer,
    deleteFlyer,
    gymSettings,
    updateGymSettings,
  } = useGym();

  const [selectedFlyer, setSelectedFlyer] = useState<GymFlyer | null>(null);
  const [isZoomViewerOpen, setIsZoomViewerOpen] = useState(false);
  const [isCreatingFlyer, setIsCreatingFlyer] = useState(false);
  const [newFlyerTitle, setNewFlyerTitle] = useState('');
  const [newFlyerImage, setNewFlyerImage] = useState('');
  const [newFlyerTag, setNewFlyerTag] = useState<GymFlyer['tag']>('AVISO');
  const [newFlyerDesc, setNewFlyerDesc] = useState('');
  const [newFlyerDate, setNewFlyerDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const flyerFileInputRef = useRef<HTMLInputElement>(null);

  // Configuración del enlace al grupo de WhatsApp
  const [isEditingWhatsApp, setIsEditingWhatsApp] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [isSavingWhatsApp, setIsSavingWhatsApp] = useState(false);
  const [whatsappSuccessMsg, setWhatsappSuccessMsg] = useState('');

  const handleOpenWhatsAppModal = () => {
    if (role !== 'admin') return;
    setWhatsappInput(gymSettings?.whatsappGroupUrl || '');
    setWhatsappSuccessMsg('');
    setIsEditingWhatsApp(true);
  };

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;
    setIsSavingWhatsApp(true);
    try {
      await updateGymSettings({ whatsappGroupUrl: whatsappInput.trim() });
      setWhatsappSuccessMsg('¡Enlace de WhatsApp guardado con éxito!');
      setTimeout(() => {
        setIsEditingWhatsApp(false);
        setWhatsappSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error('Error guardando enlace de WhatsApp:', err);
    } finally {
      setIsSavingWhatsApp(false);
    }
  };

  const handleJoinWhatsApp = () => {
    const url = gymSettings?.whatsappGroupUrl?.trim();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('El enlace al grupo de WhatsApp aún no ha sido configurado por el gimnasio.');
    }
  };

  // Configuración de OneSignal Push (Solo Admin)
  const [isEditingOneSignal, setIsEditingOneSignal] = useState(false);
  const [oneSignalApiKeyInput, setOneSignalApiKeyInput] = useState('');
  const [isSavingOneSignal, setIsSavingOneSignal] = useState(false);
  const [oneSignalSuccessMsg, setOneSignalSuccessMsg] = useState('');

  const handleOpenOneSignalModal = () => {
    if (role !== 'admin') return;
    setOneSignalApiKeyInput(gymSettings?.oneSignalRestApiKey || '');
    setOneSignalSuccessMsg('');
    setIsEditingOneSignal(true);
  };

  const handleSaveOneSignalKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'admin') return;
    setIsSavingOneSignal(true);
    try {
      await updateGymSettings({ oneSignalRestApiKey: oneSignalApiKeyInput.trim() });
      setOneSignalSuccessMsg('¡Llave REST API de OneSignal guardada con éxito!');
      setTimeout(() => {
        setIsEditingOneSignal(false);
        setOneSignalSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Error guardando llave OneSignal:', err);
    } finally {
      setIsSavingOneSignal(false);
    }
  };

  // Notificaciones Web de Anuncios
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [notifFeedback, setNotifFeedback] = useState<string | null>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleRequestNotif = async () => {
    try {
      const oneSignalGranted = await promptOneSignalPushPermission();
      const res = await requestNotificationPermission();
      setNotifPermission(res);
      if (oneSignalGranted || res === 'granted') {
        setNotifFeedback('¡Notificaciones activadas exitosamente en este dispositivo!');
        setTimeout(() => setNotifFeedback(null), 6000);
      }
    } catch (err) {
      console.warn('Error al solicitar permisos:', err);
    }
  };

  const canManageFlyers = role === 'admin' || role === 'coach';
  const isAdmin = role === 'admin';

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.78);
      setNewFlyerImage(compressedDataUrl);
    } catch (err: any) {
      console.error('Error al procesar imagen:', err);
      setImageError(err.message || 'No se pudo procesar la imagen seleccionada.');
    } finally {
      setIsCompressingImage(false);
      if (flyerFileInputRef.current) {
        flyerFileInputRef.current.value = '';
      }
    }
  };

  const handleCreateFlyer = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError('');
    if (!newFlyerTitle.trim()) return;
    if (!newFlyerImage.trim()) {
      setImageError('Debes seleccionar una imagen desde tu dispositivo para publicar el flyer.');
      return;
    }

    setIsSubmitting(true);
    const newFlyer: GymFlyer = {
      id: `flyer_${Date.now()}`,
      title: newFlyerTitle.trim(),
      imageUrl: newFlyerImage.trim(),
      tag: newFlyerTag,
      description: newFlyerDesc.trim(),
      date: newFlyerDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await saveFlyer(newFlyer);
    setIsSubmitting(false);
    setIsCreatingFlyer(false);
    setNewFlyerTitle('');
    setNewFlyerImage('');
    setNewFlyerDesc('');
  };

  const handleDeleteFlyer = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este anuncio?')) {
      await deleteFlyer(id);
      if (selectedFlyer?.id === id) {
        setSelectedFlyer(null);
      }
    }
  };

  const getDisciplineInfo = (discipline: AthleteDiscipline) => {
    switch (discipline) {
      case 'personalizado':
        return {
          title: 'Entrenamiento Personalizado',
          badgeClass: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
          icon: Sparkles,
          desc: 'Acceso a musculación + seguimiento antropométrico y composición corporal',
        };
      case 'musculacion':
        return {
          title: 'Solo Musculación',
          badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          icon: Dumbbell,
          desc: 'Acceso completo al área de pesas, hipertrofia y máquinas guiadas',
        };
      case 'crossfit':
      default:
        return {
          title: 'CrossFit Total Access',
          badgeClass: 'bg-red-500/20 text-red-400 border-red-500/40',
          icon: Flame,
          desc: 'WODs diarios, reservas de clases, musculación y comunidad completa',
        };
    }
  };

  const disciplineInfo = getDisciplineInfo(athleteDiscipline);
  const DisciplineIcon = disciplineInfo.icon;

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'EVENTO':
        return 'bg-red-600 text-white';
      case 'PROMO':
        return 'bg-emerald-600 text-white';
      case 'TORNEO':
        return 'bg-amber-600 text-white';
      case 'HORARIO':
        return 'bg-sky-600 text-white';
      case 'COMUNIDAD':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-zinc-700 text-zinc-100';
    }
  };

  const activeFlyers = flyers.filter((f) => f.isActive !== false);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn pb-12">
      {/* Tarjeta de Acceso al Grupo Oficial de WhatsApp INDOMABLE (Compacta) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-emerald-950/30 border border-emerald-500/30 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-md">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight font-teko leading-none">
                  Comunidad Oficial INDOMABLE
                </h3>
                {gymSettings?.whatsappGroupUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate">
                Canal oficial de WhatsApp para novedades y avisos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {gymSettings?.whatsappGroupUrl ? (
              <button
                type="button"
                onClick={handleJoinWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-emerald-950/60 active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                <span>Unirme</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : isAdmin ? (
              <button
                type="button"
                onClick={handleOpenWhatsAppModal}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition"
              >
                <Link className="w-3.5 h-3.5" />
                <span>Configurar</span>
              </button>
            ) : (
              <span className="text-[10px] text-zinc-500 italic px-1">
                Próximamente
              </span>
            )}

            {isAdmin && gymSettings?.whatsappGroupUrl && (
              <button
                type="button"
                onClick={handleOpenWhatsAppModal}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white transition"
                title="Configurar enlace de WhatsApp (Solo Admin)"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 1. Header de Bienvenida Dinámico */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-black border border-zinc-800/80 p-5 sm:p-7 shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                  Comunidad Indomable
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full border ${disciplineInfo.badgeClass}`}
                >
                  <DisciplineIcon className="w-3.5 h-3.5" />
                  {disciplineInfo.title}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-teko leading-none">
                ¡Hola, {currentAthlete ? currentAthlete.name.split(' ')[0] : 'Atleta'}!
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                {disciplineInfo.desc}
              </p>
            </div>

            {/* Tarjeta de Membresía Destacada & Llamativa (Días Restantes Grandes) */}
            {currentAthlete && (() => {
              const daysRemaining = calculateMembershipDaysRemaining(currentAthlete.membership?.endDate);
              const daysInfo = formatMembershipDaysRemaining(daysRemaining);
              const isNearExpiry = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;
              const isExpired = daysRemaining !== null && daysRemaining < 0;
              const isPending = !!currentAthlete.membership?.isPendingApproval;
              const hasPunchCard = typeof currentAthlete.membership?.remainingClasses === 'number';

              return (
                <div className="w-full md:w-auto md:min-w-[280px] shrink-0">
                  <div
                    className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl transition-all ${
                      isPending
                        ? 'border-amber-500/70 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-zinc-950 shadow-amber-950/40'
                        : isExpired
                        ? 'border-red-600/70 bg-gradient-to-br from-red-950/50 via-zinc-950 to-zinc-950 shadow-red-950/40'
                        : isNearExpiry
                        ? 'border-amber-500/80 bg-gradient-to-br from-amber-950/50 via-zinc-950 to-zinc-950 shadow-amber-950/50 ring-1 ring-amber-500/40'
                        : 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 shadow-emerald-950/30 ring-1 ring-emerald-500/20'
                    }`}
                  >
                    {/* Glowing corner accent */}
                    <div
                      className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
                        isPending
                          ? 'bg-amber-500/20'
                          : isExpired
                          ? 'bg-red-600/25'
                          : isNearExpiry
                          ? 'bg-amber-500/30'
                          : 'bg-emerald-500/25'
                      }`}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-4">
                      {/* Left: Big prominent days counter or status */}
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1 mb-0.5">
                          {isNearExpiry && <Clock className="w-3 h-3 text-amber-400 animate-pulse" />}
                          Vigencia de Plan
                        </span>

                        {isPending ? (
                          <div className="flex flex-col">
                            <span className="text-xl sm:text-2xl font-black font-teko uppercase text-amber-400 tracking-wide leading-tight">
                              Por Activar
                            </span>
                            <span className="text-[10px] text-amber-300/80 font-bold">
                              Validando pago en caja
                            </span>
                          </div>
                        ) : isExpired ? (
                          <div className="flex flex-col">
                            <span className="text-2xl sm:text-3xl font-black font-teko uppercase text-red-500 tracking-wide leading-tight">
                              Plan Vencido
                            </span>
                            <span className="text-[10px] text-red-400 font-mono">
                              Venció: {currentAthlete.membership?.endDate || 'S/F'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={`text-4xl sm:text-5xl font-black font-teko leading-none tracking-tight ${
                                isNearExpiry
                                  ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                  : 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                              }`}
                            >
                              {daysRemaining !== null ? Math.max(0, daysRemaining) : '--'}
                            </span>
                            <div className="flex flex-col">
                              <span
                                className={`text-xs sm:text-sm font-black uppercase font-teko tracking-wider leading-none ${
                                  isNearExpiry ? 'text-amber-300' : 'text-emerald-300'
                                }`}
                              >
                                {daysRemaining === 1 ? 'Día Restante' : 'Días Restantes'}
                              </span>
                              {currentAthlete.membership?.endDate && (
                                <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                                  Hasta: {currentAthlete.membership.endDate}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Plan Pill & Punch card badge */}
                      <div className="flex flex-col items-end text-right">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-sm ${
                            isPending
                              ? 'bg-amber-500 text-black'
                              : isExpired
                              ? 'bg-red-600 text-white'
                              : isNearExpiry
                              ? 'bg-amber-500 text-black animate-pulse'
                              : 'bg-emerald-500 text-black'
                          }`}
                        >
                          {isPending
                            ? 'Pendiente'
                            : isExpired
                            ? 'Vencido'
                            : isNearExpiry
                            ? 'Por Vencer'
                            : 'Activo'}
                        </span>

                        <span className="text-xs font-bold text-white max-w-[130px] truncate leading-tight">
                          {currentAthlete.membership?.planName || 'Plan General'}
                        </span>

                        {hasPunchCard && (
                          <div className="mt-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-300 font-bold">
                            {currentAthlete.membership.remainingClasses} / {currentAthlete.membership.totalClasses} clases
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 1. Guía para iPhone cuando está en Safari (No instalado aún) */}
      {(() => {
        const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isStandalone = typeof window !== 'undefined' && (
          window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as any).standalone === true
        );

        if (isIOS && !isStandalone) {
          return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-950 border border-red-700/80 shadow-xl text-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">🍎 Para recibir notificaciones en tu iPhone (Pantalla bloqueada)</p>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    Apple <strong className="text-white">bloquea las notificaciones dentro del navegador Safari</strong>. Para que te lleguen alertas con la pantalla bloqueada o app cerrada, sigue estos sencillos pasos:
                  </p>
                  <div className="mt-2 space-y-1 text-[11px] text-zinc-300 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-red-400">1.</span>
                      <span>En la barra inferior de Safari, toca el botón <strong>Compartir</strong> (ícono cuadrado con flecha hacia arriba ⬆️).</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-red-400">2.</span>
                      <span>Desplaza hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="font-bold text-red-400">3.</span>
                      <span>Abre la app desde el nuevo ícono de <strong>INDOMABLE</strong> en tu iPhone e inicia sesión.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // 2. Banner para activar notificaciones (en Android, PC o iPhone ya instalado)
        if (notifPermission !== 'granted') {
          return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-950 border border-red-800/60 shadow-lg text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5 text-zinc-200">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-400 shrink-0">
                  <Bell className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">¿Enterarte de nuevos anuncios y eventos al instante?</p>
                  <p className="text-[11px] text-zinc-400">Activa las notificaciones oficiales en este dispositivo.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestNotif}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] uppercase tracking-wider transition shadow-md shadow-red-950/50 shrink-0 text-center cursor-pointer"
                >
                  Activar Alertas
                </button>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {notifPermission === 'denied' && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-200 text-xs">Notificaciones bloqueadas en el navegador</p>
            <p className="text-[11px] text-amber-300/80">
              Para recibir avisos y eventos, haz clic en el ícono de candado 🔒 en la barra de URL del navegador (o en Ajustes en iPhone) y activa el permiso de notificaciones.
            </p>
          </div>
        </div>
      )}

      {notifFeedback && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-fadeIn flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{notifFeedback}</span>
        </div>
      )}

      {/* 2. Cartelera & Flyers de Novedades del Box */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-red-500" />
              Cartelera & Anuncios del Box
            </h2>
            {notifPermission === 'granted' && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                <BellRing className="w-3 h-3 text-emerald-400" />
                Alertas activas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenOneSignalModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-zinc-200 text-xs font-bold transition-colors shadow-sm"
                title="Configurar Notificaciones Push de OneSignal (despierta celulares bloqueados o con app cerrada)"
              >
                <BellRing className="w-3.5 h-3.5 text-red-500" />
                <span>Configurar Push</span>
              </button>
            )}
            {canManageFlyers && (
              <button
                type="button"
                onClick={() => setIsCreatingFlyer(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Publicar Flyer
              </button>
            )}
          </div>
        </div>

        {activeFlyers.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-900/50 border border-zinc-800 text-zinc-400">
            <Megaphone className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
            <p className="text-sm font-medium">No hay flyers activos por el momento.</p>
            {canManageFlyers && (
              <button
                type="button"
                onClick={() => setIsCreatingFlyer(true)}
                className="mt-3 text-xs text-red-400 hover:text-red-300 underline font-semibold"
              >
                Sé el primero en publicar un aviso o evento
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeFlyers.map((flyer) => (
              <div
                key={flyer.id}
                onClick={() => setSelectedFlyer(flyer)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 transition-all duration-300 flex flex-col shadow-lg hover:shadow-red-950/30"
              >
                {/* Imagen del Flyer */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={flyer.imageUrl}
                    alt={flyer.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

                  {/* Badge de Categoría */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md ${getTagColor(
                        flyer.tag
                      )}`}
                    >
                      {flyer.tag || 'AVISO'}
                    </span>
                  </div>

                  {/* Fecha si aplica */}
                  {flyer.date && (
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[11px] font-semibold text-zinc-300 flex items-center gap-1 border border-zinc-700/50">
                      <Calendar className="w-3 h-3 text-red-400" />
                      {flyer.date}
                    </div>
                  )}
                </div>

                {/* Contenido del Flyer */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {flyer.title}
                    </h3>
                    {flyer.description && (
                      <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {flyer.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                    <span className="text-red-400 font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Ver detalle completo <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    {canManageFlyers && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlyer(flyer.id);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                        title="Eliminar Anuncio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalle de Flyer */}
      {selectedFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setSelectedFlyer(null);
                setIsZoomViewerOpen(false);
              }}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[85vh] overflow-y-auto">
              {/* Contenedor de Imagen Completa con opción de Zoom */}
              <div
                onClick={() => setIsZoomViewerOpen(true)}
                className="relative w-full bg-zinc-950 flex items-center justify-center overflow-hidden min-h-[260px] max-h-[65vh] sm:max-h-[70vh] cursor-zoom-in group border-b border-zinc-800"
              >
                {/* Fondo difuminado para que cualquier formato luzca integrado */}
                <img
                  src={selectedFlyer.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
                />

                {/* Imagen completa sin ningún recorte */}
                <img
                  src={selectedFlyer.imageUrl}
                  alt={selectedFlyer.title}
                  className="relative z-10 max-h-[65vh] sm:max-h-[70vh] w-auto max-w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02] shadow-2xl"
                />

                {/* Botón flotante para invitar a hacer zoom */}
                <div className="absolute top-4 right-14 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsZoomViewerOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-xl transition-all hover:scale-105 active:scale-95"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-red-400" />
                    <span>Ver completa & Zoom</span>
                  </button>
                </div>

                {/* Tags y fecha en la parte inferior */}
                <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${getTagColor(
                      selectedFlyer.tag
                    )}`}
                  >
                    {selectedFlyer.tag || 'AVISO'}
                  </span>
                  {selectedFlyer.date && (
                    <span className="bg-black/80 px-2.5 py-1 rounded-full text-xs font-medium text-zinc-300 flex items-center gap-1 border border-zinc-700/50 backdrop-blur-sm">
                      <Calendar className="w-3.5 h-3.5 text-red-400" />
                      {selectedFlyer.date}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-xl font-black text-white font-teko uppercase tracking-wide">
                  {selectedFlyer.title}
                </h2>
                <div className="mt-3 text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
                  {selectedFlyer.description || 'Sin descripción adicional.'}
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFlyer(null);
                      setIsZoomViewerOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold text-white transition-colors"
                  >
                    Cerrar
                  </button>

                  {canManageFlyers && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFlyer(selectedFlyer.id)}
                      className="px-3 py-2 rounded-lg bg-red-950/40 border border-red-800/50 hover:bg-red-900/60 text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar de Cartelera
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Pantalla Completa con Zoom y Gestos Táctiles */}
      {selectedFlyer && (
        <ImageViewerModal
          isOpen={isZoomViewerOpen}
          onClose={() => setIsZoomViewerOpen(false)}
          imageUrl={selectedFlyer.imageUrl}
          title={selectedFlyer.title}
          tag={selectedFlyer.tag}
        />
      )}

      {/* Modal Crear Flyer (Admin / Coach) */}
      {isCreatingFlyer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsCreatingFlyer(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4 font-teko">
              <Megaphone className="w-5 h-5 text-red-500" />
              Publicar Nuevo Flyer o Anuncio
            </h2>

            <form onSubmit={handleCreateFlyer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Torneo Interno de Halterofilia 2026"
                  value={newFlyerTitle}
                  onChange={(e) => setNewFlyerTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Tipo de Etiqueta
                  </label>
                  <select
                    value={newFlyerTag}
                    onChange={(e) => setNewFlyerTag(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="AVISO">Aviso</option>
                    <option value="EVENTO">Evento</option>
                    <option value="TORNEO">Torneo</option>
                    <option value="PROMO">Promoción</option>
                    <option value="HORARIO">Horario</option>
                    <option value="COMUNIDAD">Comunidad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Fecha del Evento
                  </label>
                  <input
                    type="date"
                    value={newFlyerDate}
                    onChange={(e) => setNewFlyerDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Carga de Imagen desde el Dispositivo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Imagen del Flyer *</span>
                  <span className="text-[10px] text-zinc-500 font-normal normal-case">
                    JPG, PNG o WebP desde tu dispositivo
                  </span>
                </label>

                <input
                  ref={flyerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="welcome-flyer-file-input"
                />

                {imageError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {isCompressingImage ? (
                  <div className="h-40 w-full rounded-2xl border-2 border-dashed border-red-600/50 bg-red-950/20 flex flex-col items-center justify-center text-center p-4">
                    <RefreshCw className="w-7 h-7 text-red-500 animate-spin mb-2" />
                    <p className="text-xs font-bold text-white">Optimizando imagen...</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Comprimiendo archivo para carga rápida</p>
                  </div>
                ) : newFlyerImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 group">
                    <img
                      src={newFlyerImage}
                      alt="Vista previa del flyer"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600/80 text-white font-bold text-[10px] border border-emerald-500/50">
                          ✓ Imagen cargada
                        </span>
                        <button
                          type="button"
                          onClick={() => setNewFlyerImage('')}
                          className="p-1 rounded-lg bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white transition"
                          title="Eliminar imagen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <label
                        htmlFor="welcome-flyer-file-input"
                        className="cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-black/80 hover:bg-red-600 border border-zinc-600 text-white text-xs font-bold transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambiar Imagen</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="welcome-flyer-file-input"
                    className="h-36 w-full rounded-2xl border-2 border-dashed border-zinc-800 hover:border-red-600/80 bg-zinc-950 hover:bg-zinc-900/60 flex flex-col items-center justify-center text-center p-4 cursor-pointer transition group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 group-hover:bg-red-600/20 border border-zinc-800 group-hover:border-red-500/40 flex items-center justify-center text-zinc-400 group-hover:text-red-400 mb-2 transition">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition">
                      Toca aquí para seleccionar una imagen
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Directo desde la galería o archivos de tu dispositivo
                    </p>
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Descripción / Detalles del Anuncio
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe aquí los detalles del evento, requisitos, horarios o información clave para los atletas..."
                  value={newFlyerDesc}
                  onChange={(e) => setNewFlyerDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingFlyer(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar Anuncio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Configurar Enlace de WhatsApp (Solo Admin) */}
      {isAdmin && isEditingWhatsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsEditingWhatsApp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-white uppercase tracking-wider font-teko text-xl">
                Configurar Grupo de WhatsApp
              </h3>
            </div>

            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              Ingresa el enlace de invitación al grupo de WhatsApp oficial de INDOMABLE (debe comenzar por <span className="text-emerald-400 font-mono">https://chat.whatsapp.com/</span>). Todos los atletas podrán unirse con un solo toque desde la pantalla de Inicio.
            </p>

            <form onSubmit={handleSaveWhatsApp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Enlace de Invitación de WhatsApp *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://chat.whatsapp.com/..."
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {whatsappSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{whatsappSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsEditingWhatsApp(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-emerald-950/60 disabled:opacity-50"
                >
                  {isSavingWhatsApp ? 'Guardando...' : 'Guardar Enlace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Configurar OneSignal Push (Solo Admin) */}
      {isAdmin && isEditingOneSignal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsEditingOneSignal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-teko text-xl">
                  Configurar Notificaciones Push (OneSignal)
                </h3>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                  100% Gratuito y sin tarjeta
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 mb-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 font-bold block text-[10px] uppercase">App ID Vinculado:</span>
                <span className="font-mono text-emerald-400 text-[11px] select-all break-all">{ONESIGNAL_APP_ID}</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ingresa la <strong className="text-white">REST API Key</strong> de tu panel en <span className="text-red-400 font-mono">Settings &gt; Keys &amp; IDs &gt; REST API Key</span>.
              </p>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 space-y-1">
                <p className="font-bold text-amber-200">⚠️ Paso obligatorio en el panel de OneSignal:</p>
                <p>Ve a <strong>Settings ➔ Platforms ➔ Web</strong>, selecciona <em>Custom Code</em> y pon como <strong>Site URL:</strong> <code className="bg-black/60 px-1 py-0.5 rounded text-amber-200 select-all">https://app-crossfit-c66a5.web.app</code>. Sin esto, OneSignal no registrará los celulares.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1">
                  <span>🍎 En iPhone (iOS):</span>
                </p>
                <p className="text-zinc-400">
                  Apple exige que la PWA esté <strong>instalada en la Pantalla de Inicio</strong> (botón Compartir en Safari ➔ <em>Agregar a pantalla de inicio</em>). En pestañas normales de Safari, iOS no permite push con pantalla bloqueada.
                </p>
              </div>

              <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300">
                🔒 <strong>Solo usuarios autenticados:</strong> Las notificaciones solo se envían a atletas con sesión iniciada. Al cerrar sesión, la suscripción se desactiva de inmediato.
              </div>
            </div>

            <form onSubmit={handleSaveOneSignalKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  REST API Key de OneSignal *
                </label>
                <input
                  type="text"
                  required
                  placeholder="os_v2_app_..."
                  value={oneSignalApiKeyInput}
                  onChange={(e) => setOneSignalApiKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-xs focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              {oneSignalSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{oneSignalSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                    onClick={() => setIsEditingOneSignal(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
                  >
                    Cerrar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingOneSignal}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-950/60 disabled:opacity-50"
                  >
                    {isSavingOneSignal ? 'Guardando...' : 'Guardar Llave'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
