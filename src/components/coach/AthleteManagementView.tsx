import React, { useState, useMemo, useRef } from 'react';
import { useGym } from '../../context/GymContext';
import { AthleteProfile, AthleteDiscipline } from '../../types';
import { AnthropometryView } from '../athlete/AnthropometryView';
import { compressImageFile } from '../../utils/imageUtils';
import { AthleteAvatar } from '../common/AthleteAvatar';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  Check,
  Shield,
  ExternalLink,
  Info,
  KeyRound,
  Copy,
  Send,
  AlertCircle,
  Lock,
  Sparkles,
  Activity,
  Flame,
  Dumbbell,
  Camera,
  Upload,
  User,
  Tag,
} from 'lucide-react';
import { sendMembershipActivatedEmail } from '../../services/emailService';
import { PlanManagementModal } from './PlanManagementModal';

export const AthleteManagementView: React.FC = () => {
  const {
    role,
    athletes,
    addAthlete,
    updateAthlete,
    deleteAthlete,
    renewAthleteMembership,
    approveAthleteMembership,
    resetAthletePin,
    currentAthleteId,
    setCurrentAthleteId,
    setRole,
    slots,
    plans,
  } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'expiring' | 'expired' | 'punchcard'>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | 'crossfit' | 'musculacion' | 'personalizado'>('all');
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [anthropometryAthlete, setAnthropometryAthlete] = useState<AthleteProfile | null>(null);
  const [pinAthlete, setPinAthlete] = useState<AthleteProfile | null>(null);
  const [customPinInput, setCustomPinInput] = useState('');
  const [pinCopied, setPinCopied] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteProfile | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingAthlete, setIsDeletingAthlete] = useState(false);

  // New Athlete Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultEndObj = new Date();
  defaultEndObj.setDate(defaultEndObj.getDate() + 30);
  const defaultEndStr = defaultEndObj.toISOString().split('T')[0];

  const [formName, setFormName] = useState('');
  const [formDocumentId, setFormDocumentId] = useState('');
  const [formPin, setFormPin] = useState('1234');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPlanName, setFormPlanName] = useState('Mensual Ilimitado Pro');
  const [formIsPunchCard, setFormIsPunchCard] = useState(false);
  const [formTotalClasses, setFormTotalClasses] = useState('16');
  const [formStartDate, setFormStartDate] = useState(todayStr);
  const [formEndDate, setFormEndDate] = useState(defaultEndStr);
  const [formDiscipline, setFormDiscipline] = useState<AthleteDiscipline>('crossfit');
  const [formAvatar, setFormAvatar] = useState<string>('');
  const [isCompressingFormAvatar, setIsCompressingFormAvatar] = useState(false);
  const formAvatarInputRef = useRef<HTMLInputElement>(null);

  // Renewal Form State
  const [renewPlanName, setRenewPlanName] = useState('Mensual Ilimitado Pro');
  const [renewDurationDays, setRenewDurationDays] = useState(30);
  const [renewDiscipline, setRenewDiscipline] = useState<AthleteDiscipline>('crossfit');
  const [renewStartDate, setRenewStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Athlete Form State
  const [editName, setEditName] = useState('');
  const [editDocumentId, setEditDocumentId] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');
  const [isCompressingEditAvatar, setIsCompressingEditAvatar] = useState(false);
  const editAvatarInputRef = useRef<HTMLInputElement>(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editRemainingClasses, setEditRemainingClasses] = useState('');
  const [editTotalClasses, setEditTotalClasses] = useState('');
  const [editDiscipline, setEditDiscipline] = useState<AthleteDiscipline>('crossfit');
  const [isSubmittingRenew, setIsSubmittingRenew] = useState(false);
  const [actionToast, setActionToast] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);

  const handleFormAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingFormAvatar(true);
    try {
      const compressed = await compressImageFile(file, 350, 350, 0.82);
      setFormAvatar(compressed);
    } catch (err: any) {
      alert(err.message || 'Error al procesar foto de perfil.');
    } finally {
      setIsCompressingFormAvatar(false);
      if (formAvatarInputRef.current) formAvatarInputRef.current.value = '';
    }
  };

  const handleEditAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingEditAvatar(true);
    try {
      const compressed = await compressImageFile(file, 350, 350, 0.82);
      setEditAvatar(compressed);
    } catch (err: any) {
      alert(err.message || 'Error al procesar foto de perfil.');
    } finally {
      setIsCompressingEditAvatar(false);
      if (editAvatarInputRef.current) editAvatarInputRef.current.value = '';
    }
  };

  // Filtered athletes list
  const filteredAthletes = useMemo(() => {
    const today = new Date();
    return athletes.filter((ath) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        ath.name.toLowerCase().includes(q) ||
        (ath.documentId && ath.documentId.toLowerCase().includes(q)) ||
        ath.email.toLowerCase().includes(q) ||
        (ath.phone && ath.phone.includes(q)) ||
        ath.membership.planName.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Discipline filter
      const resolvedDiscipline = ath.discipline || ath.membership?.discipline ||
        (ath.membership?.planName?.toLowerCase().includes('personalizad') ? 'personalizado' :
         ath.membership?.planName?.toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');
      if (disciplineFilter !== 'all' && resolvedDiscipline !== disciplineFilter) {
        return false;
      }

      // Status calculation
      const isPending = !!ath.membership.isPendingApproval;
      const todayStr = new Date().toISOString().split('T')[0];
      const isDateExpired = Boolean(ath.membership.endDate && ath.membership.endDate < todayStr);
      const [endYear, endMonth, endDay] = (ath.membership.endDate || todayStr).split('-').map(Number);
      const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1, 23, 59, 59);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const remCls = typeof ath.membership.remainingClasses === 'number' ? ath.membership.remainingClasses : null;
      const hasPunchCard = remCls !== null;
      const isExpired = !ath.membership.isActive || isDateExpired || (hasPunchCard && remCls <= 0);
      const isExpiring = !isPending && !isExpired && (diffDays <= 4 || (hasPunchCard && remCls <= 2));

      if (statusFilter === 'pending') return isPending;
      if (statusFilter === 'active') return ath.membership.isActive && !isExpired && !isPending;
      if (statusFilter === 'expiring') return isExpiring;
      if (statusFilter === 'expired') return isExpired && !isPending;
      if (statusFilter === 'punchcard') return hasPunchCard;
      return true;
    });
  }, [athletes, searchQuery, statusFilter, disciplineFilter]);

  // General Metrics
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    let activeCount = 0;
    let pendingCount = 0;
    let expiredCount = 0;
    let expiringCount = 0;
    let punchCardCount = 0;
    let crossfitCount = 0;
    let musculacionCount = 0;
    let personalizadoCount = 0;

    athletes.forEach((ath) => {
      const isPending = !!ath.membership.isPendingApproval;
      const isDateExpired = Boolean(ath.membership.endDate && ath.membership.endDate < todayStr);
      const [endYear, endMonth, endDay] = (ath.membership.endDate || todayStr).split('-').map(Number);
      const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1, 23, 59, 59);
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      const remCls = typeof ath.membership.remainingClasses === 'number' ? ath.membership.remainingClasses : null;
      const hasPunchCard = remCls !== null;
      const isExpired = !ath.membership.isActive || isDateExpired || (hasPunchCard && remCls <= 0);
      const isExpiring = !isPending && !isExpired && (diffDays <= 4 || (hasPunchCard && remCls <= 2));

      // Discipline resolution
      const resolvedDiscipline = ath.discipline || ath.membership?.discipline ||
        (ath.membership?.planName?.toLowerCase().includes('personalizad') ? 'personalizado' :
         ath.membership?.planName?.toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');

      if (resolvedDiscipline === 'personalizado') {
        personalizadoCount++;
      } else if (resolvedDiscipline === 'musculacion') {
        musculacionCount++;
      } else {
        crossfitCount++;
      }

      if (isPending) {
        pendingCount++;
      } else if (isExpired) {
        expiredCount++;
      } else {
        activeCount++;
      }

      if (isExpiring) expiringCount++;
      if (hasPunchCard) punchCardCount++;
    });

    return {
      total: athletes.length,
      active: activeCount,
      pending: pendingCount,
      expired: expiredCount,
      expiring: expiringCount,
      punchCards: punchCardCount,
      crossfit: crossfitCount,
      musculacion: musculacionCount,
      personalizado: personalizadoCount,
    };
  }, [athletes]);

  // Helper to update form values when a plan is selected
  const handleSelectFormPlan = (planName: string, discipline: AthleteDiscipline = formDiscipline) => {
    setFormPlanName(planName);
    const chosen = plans.find((p) => p.name === planName && p.discipline === discipline);
    if (chosen) {
      setFormIsPunchCard(!!chosen.isPunchCard);
      if (chosen.isPunchCard && chosen.totalClasses) {
        setFormTotalClasses(chosen.totalClasses.toString());
      }
      const end = new Date(formStartDate || todayStr);
      end.setDate(end.getDate() + (chosen.durationDays || 30));
      setFormEndDate(end.toISOString().split('T')[0]);
    } else {
      if (planName.includes('Tiquetera')) {
        setFormIsPunchCard(true);
        if (planName.includes('12')) setFormTotalClasses('12');
        else if (planName.includes('16')) setFormTotalClasses('16');
        else if (planName.includes('24')) setFormTotalClasses('24');
      } else {
        setFormIsPunchCard(false);
      }
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormName('');
    setFormDocumentId('');
    setFormPin(Math.floor(1000 + Math.random() * 9000).toString());
    setFormEmail('');
    setFormPhone('');
    setFormAvatar('');
    setFormDiscipline('crossfit');

    const defaultPlan = plans.find((p) => p.discipline === 'crossfit' && p.isActive !== false);
    const planName = defaultPlan?.name || 'Mensual Ilimitado Pro';
    setFormPlanName(planName);
    setFormIsPunchCard(!!defaultPlan?.isPunchCard);
    setFormTotalClasses(defaultPlan?.totalClasses ? defaultPlan.totalClasses.toString() : '16');
    setFormStartDate(todayStr);
    const end = new Date();
    end.setDate(end.getDate() + (defaultPlan?.durationDays || 30));
    setFormEndDate(end.toISOString().split('T')[0]);
    setIsAddModalOpen(true);
  };

  // Submit Add Athlete
  const handleCreateAthlete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDocumentId.trim()) {
      alert('Nombre completo y Cédula son obligatorios.');
      return;
    }

    const cleanEmail = formEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert('El correo electrónico es obligatorio y debe tener un formato válido (ej: atleta@correo.com).');
      return;
    }

    const docId = formDocumentId.trim();
    if (athletes.some((a) => a.documentId.toLowerCase() === docId.toLowerCase())) {
      alert(`Ya existe un atleta registrado con la cédula ${docId}.`);
      return;
    }

    const cleanPin = formPin.trim();
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      alert('El PIN de acceso debe contener exactamente 4 números.');
      return;
    }

    const totalCls = formIsPunchCard ? parseInt(formTotalClasses, 10) || 16 : undefined;

    addAthlete({
      name: formName.trim(),
      documentId: docId,
      pin: cleanPin || '1234',
      email: cleanEmail,
      phone: formPhone.trim() || '+57 300 123 4567',
      avatar: formAvatar || undefined,
      discipline: formDiscipline,
      membership: {
        planName: formPlanName,
        startDate: formStartDate,
        endDate: formEndDate,
        isActive: true,
        totalClasses: totalCls,
        remainingClasses: totalCls,
        discipline: formDiscipline,
      },
    });

    setIsAddModalOpen(false);
  };

  // Open Renew Modal
  const handleOpenRenewModal = (ath: AthleteProfile) => {
    if (role !== 'admin') {
      alert('Solo el Administrador tiene autorización para aprobar o renovar membresías.');
      return;
    }
    setSelectedAthlete(ath);
    const isPending = !!ath.membership.isPendingApproval || ath.membership.planName.toLowerCase().includes('pendiente');
    const athleteDisc = ath.discipline || ath.membership?.discipline || 'crossfit';
    setRenewDiscipline(athleteDisc);

    const matchingPlan = plans.find((p) => p.name === ath.membership.planName && p.discipline === athleteDisc && p.isActive !== false)
      || plans.find((p) => p.discipline === athleteDisc && p.isActive !== false);

    const defaultPlanName = matchingPlan ? matchingPlan.name : (isPending ? 'Mensual Ilimitado Pro' : ath.membership.planName);
    setRenewPlanName(defaultPlanName);
    setRenewDurationDays(matchingPlan?.durationDays || (
      defaultPlanName.includes('Trimestral') ? 90 :
      defaultPlanName.includes('Semestral') ? 180 :
      defaultPlanName.includes('Anual') ? 365 :
      defaultPlanName.includes('Diario') ? 1 : 30
    ));
    setRenewStartDate(new Date().toISOString().split('T')[0]);
    setIsRenewModalOpen(true);
  };

  // Submit Renewal / Approval
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete) return;

    const isPending = !!selectedAthlete.membership.isPendingApproval || selectedAthlete.membership.planName.toLowerCase().includes('pendiente');
    const athleteName = selectedAthlete.name;
    const athleteEmail = selectedAthlete.email;

    setIsSubmittingRenew(true);
    try {
      const res = isPending
        ? await approveAthleteMembership(selectedAthlete.id, renewPlanName, renewDurationDays, undefined, renewDiscipline, renewStartDate)
        : await renewAthleteMembership(selectedAthlete.id, renewPlanName, renewDurationDays, undefined, renewDiscipline, renewStartDate);

      if (!res.success) {
        setActionToast({
          type: 'error',
          text: res.message || 'No se pudo procesar la membresía.',
        });
        return;
      }

      if (res.emailResult) {
        if (res.emailResult.success) {
          setActionToast({
            type: 'success',
            text: `¡Membresía activada con éxito! Se envió la confirmación por correo a ${athleteEmail}.`,
          });
        } else {
          setActionToast({
            type: 'warning',
            text: `Membresía activada en el sistema, pero ocurrió un problema al enviar el correo: ${res.emailResult.message}`,
          });
        }
      } else {
        setActionToast({
          type: 'success',
          text: `Membresía actualizada para ${athleteName}.`,
        });
      }
    } catch (err: any) {
      setActionToast({
        type: 'error',
        text: `Error al procesar: ${err.message || 'Intente nuevamente'}`,
      });
    } finally {
      setIsSubmittingRenew(false);
      setIsRenewModalOpen(false);
      setTimeout(() => setActionToast(null), 9000);
    }
  };

  // Reenviar correo de activación
  const handleResendActivationEmail = async (ath: AthleteProfile) => {
    if (!ath.email) {
      alert('Este atleta no tiene correo registrado.');
      return;
    }
    setActionToast({
      type: 'info',
      text: `Reenviando correo de activación a ${ath.email}...`,
    });

    try {
      const res = await sendMembershipActivatedEmail({
        name: ath.name,
        email: ath.email,
        planName: ath.membership.planName,
        startDate: ath.membership.startDate,
        endDate: ath.membership.endDate,
        classesCount: typeof ath.membership.totalClasses === 'number' ? ath.membership.totalClasses : undefined,
      });

      if (res.success) {
        setActionToast({
          type: 'success',
          text: `¡Correo de activación reenviado exitosamente a ${ath.email}!`,
        });
      } else {
        setActionToast({
          type: 'warning',
          text: `No se pudo entregar el correo: ${res.message}`,
        });
      }
    } catch (err: any) {
      setActionToast({
        type: 'error',
        text: `Error de conexión: ${err.message || 'No se pudo contactar el servicio de correo'}`,
      });
    }
    setTimeout(() => setActionToast(null), 9000);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ath: AthleteProfile) => {
    setSelectedAthlete(ath);
    setEditName(ath.name);
    setEditDocumentId(ath.documentId || '');
    setEditPin('');
    setEditEmail(ath.email);
    setEditPhone(ath.phone || '');
    setEditAvatar(ath.avatar || '');
    setEditPlanName(ath.membership.planName);
    setEditStartDate(ath.membership.startDate);
    setEditEndDate(ath.membership.endDate);
    setEditRemainingClasses(typeof ath.membership.remainingClasses === 'number' ? ath.membership.remainingClasses.toString() : '');
    setEditTotalClasses(typeof ath.membership.totalClasses === 'number' ? ath.membership.totalClasses.toString() : '');
    setEditIsActive(ath.membership.isActive);
    setEditDiscipline(ath.discipline || ath.membership?.discipline || 'crossfit');
    setIsEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthlete || !editName.trim() || !editDocumentId.trim()) {
      alert('Nombre y Cédula son obligatorios.');
      return;
    }

    const cleanEmail = editEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      alert('El correo electrónico es obligatorio y debe tener un formato válido (ej: atleta@correo.com).');
      return;
    }

    const docId = editDocumentId.trim();
    const duplicate = athletes.some((a) => a.id !== selectedAthlete.id && a.documentId.toLowerCase() === docId.toLowerCase());
    if (duplicate) {
      alert(`Ya existe otro atleta con la cédula ${docId}.`);
      return;
    }

    const cleanPin = editPin.trim();
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      alert('El nuevo PIN de acceso debe tener exactamente 4 números.');
      return;
    }

    const rem = editRemainingClasses !== '' ? parseInt(editRemainingClasses, 10) : undefined;
    const tot = editTotalClasses !== '' ? parseInt(editTotalClasses, 10) : undefined;
    const wasInactive = !selectedAthlete.membership.isActive || !!selectedAthlete.membership.isPendingApproval;
    const nowActive = editIsActive;

    const updates: Partial<AthleteProfile> = {
      name: editName.trim(),
      documentId: docId,
      email: cleanEmail,
      phone: editPhone.trim(),
      discipline: editDiscipline,
      membership: {
        ...selectedAthlete.membership,
        planName: editPlanName.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        isActive: editIsActive,
        isPendingApproval: editIsActive ? false : !!selectedAthlete.membership.isPendingApproval,
        discipline: editDiscipline,
        remainingClasses: rem,
        totalClasses: tot,
      },
    };

    // Solo actualizar el PIN si el Coach ingresó una nueva clave de 4 dígitos
    if (cleanPin && /^\d{4}$/.test(cleanPin)) {
      updates.pin = cleanPin;
    }

    if (editAvatar) {
      updates.avatar = editAvatar;
    }

    updateAthlete(selectedAthlete.id, updates);

    if (wasInactive && nowActive && cleanEmail) {
      sendMembershipActivatedEmail({
        name: editName.trim(),
        email: cleanEmail,
        planName: editPlanName.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        classesCount: rem,
      }).then((res) => {
        if (res.success) {
          setActionToast({
            type: 'success',
            text: `¡Atleta activado! Correo de confirmación enviado a ${cleanEmail}.`,
          });
        } else {
          setActionToast({
            type: 'warning',
            text: `Atleta activado, pero no se pudo entregar el correo: ${res.message}`,
          });
        }
        setTimeout(() => setActionToast(null), 9000);
      });
    } else {
      setActionToast({
        type: 'success',
        text: `Datos de ${editName.trim()} actualizados correctamente.`,
      });
      setTimeout(() => setActionToast(null), 5000);
    }

    setIsEditModalOpen(false);
  };

  // Dedicated PIN Modal Handlers
  const handleOpenPinModal = (ath: AthleteProfile) => {
    setPinAthlete(ath);
    setCustomPinInput('');
    setPinCopied(false);
    setPinSuccessMsg('');
    setIsPinModalOpen(true);
  };

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setCustomPinInput(randomPin);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinAthlete) return;
    const cleanPin = customPinInput.trim();
    if (!/^\d{4}$/.test(cleanPin)) {
      alert('El PIN debe contener exactamente 4 dígitos numéricos.');
      return;
    }
    resetAthletePin(pinAthlete.id, cleanPin);
    setPinSuccessMsg(`¡Nuevo PIN establecido para el atleta! Comunícaselo de forma privada para su acceso.`);
    // Update local modal state
    setPinAthlete({ ...pinAthlete, pin: cleanPin });
    setTimeout(() => {
      setPinSuccessMsg('');
    }, 4000);
  };

  const handleCopyPin = () => {
    if (!customPinInput) return;
    navigator.clipboard.writeText(customPinInput);
    setPinCopied(true);
    setTimeout(() => setPinCopied(false), 2000);
  };

  // Delete Athlete
  const handleDeleteAthlete = (id: string, name: string) => {
    setAthleteToDelete({ id, name });
  };

  const confirmDeleteAthlete = async () => {
    if (athleteToDelete) {
      setIsDeletingAthlete(true);
      try {
        await deleteAthlete(athleteToDelete.id);
      } catch (err) {
        console.error('Error al eliminar atleta:', err);
      } finally {
        setIsDeletingAthlete(false);
        setAthleteToDelete(null);
      }
    }
  };

  // Switch to this athlete and view as Athlete
  const handleImpersonateAthlete = (athId: string) => {
    setCurrentAthleteId(athId);
    setRole('athlete');
  };

  return (
    <div id="section-athlete-management" className="space-y-6">
      {/* Top Banner: User Management Overview in Red & Black */}
      <div className="rounded-2xl border border-red-900/40 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-600/40">
                <Users className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                ADMINISTRACIÓN DE USUARIOS • INDOMABLE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              DIRECTORIO & GESTIÓN DE ATLETAS
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Controla las altas de nuevos atletas, renovaciones de membresías, tiqueteras de clases, estados de pago y fechas de vencimiento del box.
            </p>
            {role === 'coach' && (
              <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 text-xs text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Modo Entrenador:</strong> Tienes permisos de consulta de atletas, reservas y reseteo de PIN. La aprobación y renovación de membresías es potestad exclusiva del <strong>Administrador</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {role === 'admin' && (
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(true)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-amber-400 border border-amber-600/50 px-3.5 py-2.5 text-xs font-bold transition shadow-md shrink-0"
                title="Gestionar tarifas y planes de membresía"
              >
                <Tag className="w-4 h-4" />
                <span>Gestionar Planes ({plans.length})</span>
              </button>
            )}

            <button
              type="button"
              id="btn-add-athlete"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-extrabold shadow-md shadow-red-950/60 transition active:scale-95 shrink-0 border border-red-700/50"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Atleta</span>
            </button>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className={`grid gap-2.5 mt-5 pt-4 border-t border-zinc-800/90 ${metrics.pending > 0 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Atletas</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-white leading-none mt-0.5">
              {metrics.total}
            </div>
          </div>

          {metrics.pending > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className="rounded-xl bg-amber-950/60 p-3 border border-amber-600/70 text-center hover:bg-amber-950/90 transition ring-1 ring-amber-500/40 animate-pulse"
            >
              <span className="text-[10px] text-amber-300 font-bold uppercase flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Por Activar
              </span>
              <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-amber-400 leading-none mt-0.5">
                {metrics.pending}
              </div>
            </button>
          )}

          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Membresías Activas</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-emerald-400 leading-none mt-0.5">
              {metrics.active}
            </div>
          </div>

          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Por Vencer / Alerta</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-amber-400 leading-none mt-0.5">
              {metrics.expiring}
            </div>
          </div>

          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Membresías Vencidas</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-red-400 leading-none mt-0.5">
              {metrics.expired}
            </div>
          </div>
        </div>

        {/* Desglose de Atletas por Disciplina (CrossFit, Musculación, Personalizado) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={() => setDisciplineFilter(disciplineFilter === 'crossfit' ? 'all' : 'crossfit')}
            className={`p-2.5 rounded-xl border text-center transition flex items-center justify-between px-3.5 cursor-pointer ${
              disciplineFilter === 'crossfit'
                ? 'bg-red-950/80 border-red-500 shadow-md shadow-red-950/50 ring-1 ring-red-500/40'
                : 'bg-black/60 border-zinc-800 hover:border-red-600/40'
            }`}
            title="Filtrar atletas de CrossFit"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block leading-none">CrossFit</span>
                <span className="text-[10px] text-zinc-500 font-medium">Atletas Inscritos</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-white leading-none">
              {metrics.crossfit}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDisciplineFilter(disciplineFilter === 'musculacion' ? 'all' : 'musculacion')}
            className={`p-2.5 rounded-xl border text-center transition flex items-center justify-between px-3.5 cursor-pointer ${
              disciplineFilter === 'musculacion'
                ? 'bg-amber-950/80 border-amber-500 shadow-md shadow-amber-950/50 ring-1 ring-amber-500/40'
                : 'bg-black/60 border-zinc-800 hover:border-amber-600/40'
            }`}
            title="Filtrar atletas de Musculación"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-600/40 flex items-center justify-center text-amber-500 shrink-0">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block leading-none">Musculación</span>
                <span className="text-[10px] text-zinc-500 font-medium">Atletas Inscritos</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-amber-400 leading-none">
              {metrics.musculacion}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setDisciplineFilter(disciplineFilter === 'personalizado' ? 'all' : 'personalizado')}
            className={`p-2.5 rounded-xl border text-center transition flex items-center justify-between px-3.5 cursor-pointer ${
              disciplineFilter === 'personalizado'
                ? 'bg-purple-950/80 border-purple-500 shadow-md shadow-purple-950/50 ring-1 ring-purple-500/40'
                : 'bg-black/60 border-zinc-800 hover:border-purple-600/40'
            }`}
            title="Filtrar atletas de Personalizado"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-600/40 flex items-center justify-center text-purple-400 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block leading-none">Personalizado</span>
                <span className="text-[10px] text-zinc-500 font-medium">Atletas Inscritos</span>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-purple-400 leading-none">
              {metrics.personalizado}
            </div>
          </button>
        </div>
      </div>

      {/* Alert banner if athletes are pending approval (Admin only) */}
      {role === 'admin' && metrics.pending > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 shadow-xl text-xs">
          <div className="flex items-center gap-3 text-amber-200">
            <div className="w-9 h-9 rounded-xl bg-amber-900/60 border border-amber-600/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white block">
                {metrics.pending} solicitud(es) de nuevo registro pendiente(s) de activación
              </span>
              <span className="text-zinc-400">
                Atletas que completaron su registro y requieren que el staff valide su pago y active su mensualidad.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition shrink-0 shadow-md self-start sm:self-auto"
          >
            Revisar Pendientes
          </button>
        </div>
      )}

      {/* Action Toast Alert Banner */}
      {actionToast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 shadow-xl animate-in fade-in ${
            actionToast.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-700/80 text-emerald-200'
              : actionToast.type === 'warning'
              ? 'bg-amber-950/80 border-amber-600 text-amber-200'
              : actionToast.type === 'error'
              ? 'bg-red-950/80 border-red-700 text-red-200'
              : 'bg-zinc-900 border-zinc-700 text-zinc-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : actionToast.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : actionToast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 animate-spin" />
            )}
            <div>
              <strong className="block font-bold text-sm">
                {actionToast.type === 'success'
                  ? 'Operación Exitosa'
                  : actionToast.type === 'warning'
                  ? 'Atención'
                  : actionToast.type === 'error'
                  ? 'Error al Procesar'
                  : 'Procesando...'}
              </strong>
              <p className="mt-0.5 leading-relaxed text-xs">{actionToast.text}</p>
            </div>
          </div>
          <button
            onClick={() => setActionToast(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-700 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-red-800 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Todos ({athletes.length})
            </button>

            {metrics.pending > 0 && (
              <button
                onClick={() => setStatusFilter('pending')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-black shadow-sm font-black'
                    : 'bg-zinc-900 text-amber-400 hover:text-amber-300 border border-amber-700/60'
                }`}
              >
                Pendientes ({metrics.pending})
              </button>
            )}

            <button
              onClick={() => setStatusFilter('active')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Activos
            </button>

            <button
              onClick={() => setStatusFilter('expiring')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'expiring'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Por Vencer
            </button>

            <button
              onClick={() => setStatusFilter('expired')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'expired'
                  ? 'bg-red-900 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Vencidos
            </button>

            <button
              onClick={() => setStatusFilter('punchcard')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition whitespace-nowrap ${
                statusFilter === 'punchcard'
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Tiqueteras
            </button>
          </div>

          {/* Discipline Filter Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pt-1.5 border-t border-zinc-900">
            <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">Disciplina:</span>
            {[
              { id: 'all', label: 'Todas' },
              { id: 'crossfit', label: 'CrossFit' },
              { id: 'musculacion', label: 'Musculación' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDisciplineFilter(d.id as any)}
                className={`rounded-lg px-2.5 py-0.5 text-xs font-bold transition whitespace-nowrap ${
                  disciplineFilter === d.id
                    ? d.id === 'personalizado'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : d.id === 'musculacion'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-red-600 text-white shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Athletes List */}
      <div className="space-y-3">
        {filteredAthletes.map((ath) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = new Date().toISOString().split('T')[0];
          const isDateExpired = Boolean(ath.membership.endDate && ath.membership.endDate < todayStr);
          const [endYear, endMonth, endDay] = (ath.membership.endDate || todayStr).split('-').map(Number);
          const endDate = new Date(endYear, (endMonth || 1) - 1, endDay || 1, 23, 59, 59);
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          const remCls = typeof ath.membership.remainingClasses === 'number' ? ath.membership.remainingClasses : null;
          const hasPunch = remCls !== null;
          const isExpired = !ath.membership.isActive || isDateExpired || (hasPunch && remCls <= 0);
          const isExpiring = !isExpired && (diffDays <= 4 || (hasPunch && remCls <= 2));

          // Count reservations booked by this athlete in all loaded slots
          const bookedClassesCount = slots.filter((s) => s.attendeeIds.includes(ath.id)).length;

          const isCurrentSession = ath.id === currentAthleteId;

          return (
            <div
              key={ath.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isCurrentSession
                  ? 'bg-zinc-900/90 border-red-600/50 shadow-lg shadow-red-950/20'
                  : 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-750 shadow-md'
              }`}
            >
              {/* Athlete Info Header */}
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0">
                  <AthleteAvatar avatar={ath.avatar} name={ath.name} size="lg" className="h-full w-full rounded-xl" />
                  {ath.membership.isActive && !isExpired ? (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-950" />
                  ) : (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-red-600 ring-2 ring-zinc-950" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white truncate">{ath.name}</h3>
                    <span className="rounded bg-zinc-900 border border-zinc-750 px-2 py-0.5 text-[11px] font-mono font-bold text-red-400">
                      CC: {ath.documentId}
                    </span>
                    {(() => {
                      const athDiscipline = ath.discipline || ath.membership?.discipline ||
                        (ath.membership?.planName?.toLowerCase().includes('personalizad') ? 'personalizado' :
                         ath.membership?.planName?.toLowerCase().includes('musculaci') ? 'musculacion' : 'crossfit');
                      if (athDiscipline === 'personalizado') {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-950/80 border border-purple-700/60 px-2 py-0.5 text-[10px] font-black uppercase text-purple-300">
                            <Activity className="w-3 h-3 text-purple-400" />
                            Personalizado
                          </span>
                        );
                      }
                      if (athDiscipline === 'musculacion') {
                        return (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 text-[10px] font-black uppercase text-amber-300">
                            <Dumbbell className="w-3 h-3 text-amber-400" />
                            Musculación
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-950/80 border border-red-700/60 px-2 py-0.5 text-[10px] font-black uppercase text-red-300">
                          <Flame className="w-3 h-3 text-red-400" />
                          CrossFit
                        </span>
                      );
                    })()}
                    <button
                      onClick={() => handleOpenPinModal(ath)}
                      title="Restablecer PIN de acceso del atleta"
                      className="rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 hover:border-red-500/50 px-2 py-0.5 text-[11px] font-mono font-bold text-zinc-300 transition flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-red-400" />
                      <span>PIN: ••••</span>
                    </button>
                    {isCurrentSession && (
                      <span className="rounded bg-red-600/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-400 border border-red-600/30">
                        Atleta Activo en App
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{ath.email}</span>
                    </span>
                    {ath.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{ath.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Membership & Status Details */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-zinc-900/70 p-3 rounded-xl border border-zinc-800/80 min-w-[280px]">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Plan</span>
                  <span className="font-semibold text-zinc-200 truncate block">{ath.membership.planName}</span>
                  {typeof ath.membership.remainingClasses === 'number' && ath.membership.remainingClasses !== null && (
                    <span className="text-[10px] font-bold text-red-400">
                      {ath.membership.remainingClasses} de {ath.membership.totalClasses || 16} clases
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Vencimiento</span>
                  <span className={`font-semibold ${isExpired ? 'text-red-400' : isExpiring ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {ath.membership.endDate}
                  </span>
                  <span className="text-[10px] text-zinc-500 block">
                    {isExpired
                      ? `Vencida (${Math.abs(diffDays)}d)`
                      : `${diffDays} días restantes`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">Estado</span>
                  {ath.membership.isPendingApproval ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-800/60 animate-pulse">
                      <Clock className="w-3 h-3" />
                      Por Activar
                    </span>
                  ) : isExpired ? (
                    <span className="inline-flex items-center gap-1 rounded bg-red-950/60 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-800/50">
                      <AlertTriangle className="w-3 h-3" />
                      Vencida
                    </span>
                  ) : isExpiring ? (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 px-2 py-0.5 text-[10px] font-black text-amber-400 border border-amber-800/50">
                      <Clock className="w-3 h-3" />
                      Por Vencer
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-950/60 px-2 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-800/50">
                      <CheckCircle2 className="w-3 h-3" />
                      Vigente
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    {bookedClassesCount} reservas activas
                  </span>
                </div>
              </div>

              {/* Action Buttons in Dark Crimson & Carbon Theme */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                {role === 'admin' ? (
                  ath.membership.isPendingApproval ? (
                    <button
                      onClick={() => handleOpenRenewModal(ath)}
                      title="Aprobar registro y activar mensualidad tras validar pago"
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 text-xs font-black transition shadow-md"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Aprobar & Activar</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenRenewModal(ath)}
                      title="Renovar membresía / Añadir clases"
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 border border-red-700/50 text-white px-3 py-1.5 text-xs font-bold transition shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renovar</span>
                    </button>
                  )
                ) : (
                  ath.membership.isPendingApproval ? (
                    <div
                      className="flex items-center gap-1 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-400 px-2.5 py-1.5 text-xs font-semibold"
                      title="Solo el Administrador tiene autorización para aprobar y activar membresías"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Requiere Admin</span>
                    </div>
                  ) : null
                )}

                <button
                  onClick={() => setAnthropometryAthlete(ath)}
                  title="Seguimiento de Medidas Antropométricas y Evaluación Física"
                  className="flex items-center gap-1 rounded-xl border border-purple-800/60 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 px-2.5 py-1.5 text-xs font-semibold transition"
                >
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Antropometría</span>
                  <span className="sm:hidden">Medidas</span>
                </button>

                <button
                  onClick={() => handleOpenPinModal(ath)}
                  title="Gestionar / Restablecer PIN de acceso"
                  className="flex items-center gap-1 rounded-xl border border-zinc-750 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 text-xs font-semibold transition hover:border-red-600/50"
                >
                  <KeyRound className="w-3.5 h-3.5 text-red-400" />
                  <span>PIN</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(ath)}
                  title="Editar datos del atleta"
                  className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 text-xs font-medium transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar</span>
                </button>

                {role === 'admin' && ath.email && ath.membership.isActive && (
                  <button
                    onClick={() => handleResendActivationEmail(ath)}
                    title="Reenviar correo de activación de plan a este atleta"
                    className="flex items-center gap-1 rounded-xl border border-zinc-750 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white px-2.5 py-1.5 text-xs font-semibold transition hover:border-red-600/50"
                  >
                    <Send className="w-3.5 h-3.5 text-red-400" />
                    <span className="hidden sm:inline">Reenviar Correo</span>
                    <span className="sm:hidden">Correo</span>
                  </button>
                )}

                <button
                  onClick={() => handleImpersonateAthlete(ath.id)}
                  title="Entrar como este atleta para ver la vista de reservas"
                  className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 px-2.5 py-1.5 text-xs font-medium transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                  <span className="hidden sm:inline">Ver como Atleta</span>
                </button>

                {role === 'admin' && (
                  <button
                    onClick={() => handleDeleteAthlete(ath.id, ath.name)}
                    title="Eliminar atleta"
                    className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800 text-zinc-500 hover:text-red-400 p-1.5 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredAthletes.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
            <Users className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="font-bold text-white">No se encontraron atletas con los filtros actuales</p>
            <p className="text-xs text-zinc-500 mt-1">
              Prueba cambiando el texto de búsqueda o el filtro de estado.
            </p>
          </div>
        )}
      </div>


      {/* Modal 1: Add Athlete */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white font-['Teko'] tracking-wide">
                  REGISTRAR NUEVO ATLETA
                </h3>
                <p className="text-xs text-zinc-400">
                  Ingresa los datos personales y la membresía inicial del socio.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAthlete} className="space-y-4 text-xs">
              {/* Foto de Perfil (Opcional) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <input
                  ref={formAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFormAvatarChange}
                  className="hidden"
                  id="add-athlete-avatar-upload"
                />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center">
                    {isCompressingFormAvatar ? (
                      <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                    ) : formAvatar ? (
                      <img src={formAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <label
                    htmlFor="add-athlete-avatar-upload"
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow transition"
                    title="Cargar foto del atleta desde tu dispositivo"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <label htmlFor="add-athlete-avatar-upload" className="cursor-pointer block">
                    <p className="text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-500" />
                      <span>{formAvatar ? 'Cambiar foto de perfil' : 'Cargar foto de perfil'}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {formAvatar ? '✓ Foto cargada' : 'Opcional • Desde el dispositivo'}
                    </p>
                  </label>
                  {formAvatar && (
                    <button
                      type="button"
                      onClick={() => setFormAvatar('')}
                      className="text-[10px] text-zinc-500 hover:text-red-400 mt-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Quitar foto</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendoza"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="Ej. 1020304050"
                    value={formDocumentId}
                    onChange={(e) => setFormDocumentId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-500" />
                    <span>PIN de Acceso Inicial (4 dígitos) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormPin(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    🎲 Generar aleatorio
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 p-2 text-white font-mono tracking-widest text-center text-sm focus:border-red-600 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Este PIN será solicitado al atleta para ingresar a la app junto a su cédula.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    placeholder="carlos@gmail.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1.5">Disciplina / Modalidad *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormDiscipline('crossfit');
                        const p = plans.find((x) => x.discipline === 'crossfit' && x.isActive !== false);
                        if (p) {
                          handleSelectFormPlan(p.name, 'crossfit');
                        } else {
                          setFormPlanName('Mensual Ilimitado Pro');
                          setFormIsPunchCard(false);
                        }
                      }}
                      className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                        formDiscipline === 'crossfit'
                          ? 'border-red-600 bg-red-950/50 text-red-400 ring-1 ring-red-600'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>CrossFit Total</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormDiscipline('musculacion');
                        const p = plans.find((x) => x.discipline === 'musculacion' && x.isActive !== false);
                        if (p) {
                          handleSelectFormPlan(p.name, 'musculacion');
                        } else {
                          setFormPlanName('Musculación Mensual Libre');
                          setFormIsPunchCard(false);
                        }
                      }}
                      className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                        formDiscipline === 'musculacion'
                          ? 'border-amber-600 bg-amber-950/50 text-amber-400 ring-1 ring-amber-600'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Dumbbell className="w-4 h-4 text-amber-500" />
                      <span>Musculación</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormDiscipline('personalizado');
                        const p = plans.find((x) => x.discipline === 'personalizado' && x.isActive !== false);
                        if (p) {
                          handleSelectFormPlan(p.name, 'personalizado');
                        } else {
                          setFormPlanName('Entrenamiento Personalizado VIP');
                          setFormIsPunchCard(false);
                        }
                      }}
                      className={`rounded-xl border p-2 text-xs font-bold transition flex flex-col items-center gap-1 text-center ${
                        formDiscipline === 'personalizado'
                          ? 'border-purple-600 bg-purple-950/50 text-purple-400 ring-1 ring-purple-600'
                          : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span>Personalizado</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-zinc-300">Tipo de Membresía</label>
                    {role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setIsPlanModalOpen(true)}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                      >
                        <Tag className="w-3 h-3" />
                        <span>Gestionar Tarifas</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={formPlanName}
                    onChange={(e) => handleSelectFormPlan(e.target.value, formDiscipline)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-semibold"
                  >
                    {(() => {
                      const discPlans = plans.filter((p) => p.discipline === formDiscipline && p.isActive !== false);
                      if (discPlans.length > 0) {
                        return discPlans.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.durationDays} días{p.isPunchCard ? ` • ${p.totalClasses} clases` : ''} - ${new Intl.NumberFormat('es-CO').format(p.price)})
                          </option>
                        ));
                      }
                      return (
                        <option value="Mensual Ilimitado Pro">Mensual Ilimitado Pro (30 días)</option>
                      );
                    })()}
                  </select>
                </div>
              </div>

              {formIsPunchCard && (
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Número de Clases de la Tiquetera</label>
                  <input
                    type="number"
                    min="1"
                    value={formTotalClasses}
                    onChange={(e) => setFormTotalClasses(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50"
                >
                  Guardar & Dar de Alta
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Renew Membership */}
      {isRenewModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setIsRenewModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedAthlete.membership.isPendingApproval
                    ? 'bg-amber-600/20 border border-amber-600/40 text-amber-400'
                    : 'bg-red-600/20 border border-red-600/40 text-red-500'
                }`}
              >
                {selectedAthlete.membership.isPendingApproval ? (
                  <Check className="w-5 h-5 stroke-[2.5]" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-black text-lg text-white font-['Teko'] tracking-wide">
                  {selectedAthlete.membership.isPendingApproval
                    ? 'APROBAR & ACTIVAR MEMBRESÍA'
                    : 'RENOVAR MEMBRESÍA'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {selectedAthlete.name}
                  {selectedAthlete.membership.isPendingApproval && ' • Valida el pago y activa los cupos'}
                </p>
              </div>
            </div>

            <form onSubmit={handleRenewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Disciplina / Modalidad</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRenewDiscipline('crossfit');
                      const p = plans.find((x) => x.discipline === 'crossfit' && x.isActive !== false);
                      if (p) {
                        setRenewPlanName(p.name);
                        setRenewDurationDays(p.durationDays || 30);
                      } else {
                        setRenewPlanName('Mensual Ilimitado Pro');
                        setRenewDurationDays(30);
                      }
                    }}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      renewDiscipline === 'crossfit'
                        ? 'border-red-600 bg-red-950/50 text-red-300 ring-1 ring-red-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>CrossFit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenewDiscipline('musculacion');
                      const p = plans.find((x) => x.discipline === 'musculacion' && x.isActive !== false);
                      if (p) {
                        setRenewPlanName(p.name);
                        setRenewDurationDays(p.durationDays || 30);
                      } else {
                        setRenewPlanName('Musculación Mensual Libre');
                        setRenewDurationDays(30);
                      }
                    }}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      renewDiscipline === 'musculacion'
                        ? 'border-amber-600 bg-amber-950/50 text-amber-300 ring-1 ring-amber-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Musculación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenewDiscipline('personalizado');
                      const p = plans.find((x) => x.discipline === 'personalizado' && x.isActive !== false);
                      if (p) {
                        setRenewPlanName(p.name);
                        setRenewDurationDays(p.durationDays || 30);
                      } else {
                        setRenewPlanName('Entrenamiento Personalizado VIP');
                        setRenewDurationDays(30);
                      }
                    }}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      renewDiscipline === 'personalizado'
                        ? 'border-purple-600 bg-purple-950/50 text-purple-300 ring-1 ring-purple-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Personalizado</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-300">Seleccionar Plan de Membresía</label>
                  {role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsPlanModalOpen(true)}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Gestionar Tarifas</span>
                    </button>
                  )}
                </div>
                <select
                  value={renewPlanName}
                  onChange={(e) => {
                    const plan = e.target.value;
                    setRenewPlanName(plan);
                    const chosen = plans.find((p) => p.name === plan && p.discipline === renewDiscipline);
                    if (chosen) {
                      setRenewDurationDays(chosen.durationDays || 30);
                    } else if (plan.includes('Trimestral') || plan.includes('3 Meses')) {
                      setRenewDurationDays(90);
                    } else if (plan.includes('Semestral')) {
                      setRenewDurationDays(180);
                    } else if (plan.includes('Anual')) {
                      setRenewDurationDays(365);
                    } else if (plan.includes('Diario') || plan.includes('Individual')) {
                      setRenewDurationDays(1);
                    } else {
                      setRenewDurationDays(30);
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-semibold"
                >
                  {(() => {
                    const discPlans = plans.filter((p) => p.discipline === renewDiscipline && p.isActive !== false);
                    if (discPlans.length > 0) {
                      return discPlans.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.durationDays} días{p.isPunchCard ? ` • ${p.totalClasses} clases` : ''} - ${new Intl.NumberFormat('es-CO').format(p.price)})
                        </option>
                      ));
                    }
                    return (
                      <option value="Mensual Ilimitado Pro">Mensual Ilimitado Pro (30 días)</option>
                    );
                  })()}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={renewStartDate}
                    onChange={(e) => setRenewStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Duración (Días)</label>
                  <input
                    type="number"
                    min="1"
                    value={renewDurationDays}
                    onChange={(e) => setRenewDurationDays(parseInt(e.target.value, 10) || 30)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 bg-zinc-900 p-3 rounded-xl border border-zinc-800">
                La fecha de inicio será <strong>{renewStartDate}</strong> y la vigencia vencerá el{' '}
                <strong className="text-white">
                  {(() => {
                    try {
                      const d = new Date(renewStartDate + 'T00:00:00');
                      d.setDate(d.getDate() + (renewDurationDays > 0 ? renewDurationDays : 30));
                      return d.toISOString().split('T')[0];
                    } catch {
                      return '---';
                    }
                  })()}
                </strong> ({renewDurationDays} días). El estado cambiará a <strong>ACTIVO</strong> y se enviará el correo a <strong>{selectedAthlete.email}</strong>.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingRenew}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-60 disabled:pointer-events-none ${
                    selectedAthlete.membership.isPendingApproval
                      ? 'bg-amber-700 hover:bg-amber-600 shadow-amber-950/60'
                      : 'bg-red-800 hover:bg-red-700 shadow-red-950/60 border border-red-700/50'
                  }`}
                >
                  {isSubmittingRenew ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Procesando y enviando correo...</span>
                    </>
                  ) : selectedAthlete.membership.isPendingApproval ? (
                    'Aprobar & Activar Ahora'
                  ) : (
                    'Confirmar Renovación'
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSubmittingRenew}
                  onClick={() => setIsRenewModalOpen(false)}
                  className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Athlete */}
      {isEditModalOpen && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white font-['Teko'] tracking-wide">
                  EDITAR DATOS DE ATLETA
                </h3>
                <p className="text-xs text-zinc-400">Modifica perfil, fechas o clases</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                <input
                  ref={editAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleEditAvatarChange}
                  className="hidden"
                  id="edit-athlete-avatar-upload"
                />

                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-950 border-2 border-zinc-700 flex items-center justify-center">
                    {isCompressingEditAvatar ? (
                      <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                    ) : editAvatar ? (
                      <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-600" />
                    )}
                  </div>
                  <label
                    htmlFor="edit-athlete-avatar-upload"
                    className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow transition"
                    title="Cambiar foto del atleta desde tu dispositivo"
                  >
                    <Camera className="w-3 h-3" />
                  </label>
                </div>

                <div className="flex-1 min-w-0">
                  <label htmlFor="edit-athlete-avatar-upload" className="cursor-pointer block">
                    <p className="text-xs font-bold text-zinc-200 hover:text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-red-500" />
                      <span>{editAvatar ? 'Cambiar foto de perfil' : 'Cargar foto de perfil'}</span>
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {editAvatar ? '✓ Foto personalizada' : 'Carga desde tu teléfono o computador (JPG, PNG, WebP)'}
                    </p>
                  </label>
                  {editAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar('')}
                      className="text-[10px] text-zinc-500 hover:text-red-400 mt-1 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" />
                      <span>Quitar foto</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    value={editDocumentId}
                    onChange={(e) => setEditDocumentId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-red-500" />
                    <span>Restablecer PIN (Opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditPin(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                  >
                    🎲 Generar nuevo PIN
                  </button>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="•••• (Dejar en blanco para mantener actual)"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full rounded-lg border border-zinc-750 bg-zinc-950 p-2 text-white font-mono tracking-widest text-center text-sm focus:border-red-600 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Por seguridad, el PIN actual está protegido. Solo escribe 4 números si deseas asignarle una nueva clave.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1.5">Disciplina / Modalidad</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDiscipline('crossfit')}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editDiscipline === 'crossfit'
                        ? 'border-red-600 bg-red-950/50 text-red-300 ring-1 ring-red-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-red-500" />
                    <span>CrossFit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDiscipline('musculacion')}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editDiscipline === 'musculacion'
                        ? 'border-amber-600 bg-amber-950/50 text-amber-300 ring-1 ring-amber-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Dumbbell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Musculación</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDiscipline('personalizado')}
                    className={`rounded-xl border p-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      editDiscipline === 'personalizado'
                        ? 'border-purple-600 bg-purple-950/50 text-purple-300 ring-1 ring-purple-600'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-purple-400" />
                    <span>Personalizado</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nombre del Plan</label>
                <input
                  type="text"
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha Vencimiento</label>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Clases Restantes</label>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={editRemainingClasses}
                    onChange={(e) => setEditRemainingClasses(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Clases Totales</label>
                  <input
                    type="number"
                    placeholder="Sin límite"
                    value={editTotalClasses}
                    onChange={(e) => setEditTotalClasses(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActiveCheckbox"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="editIsActiveCheckbox" className="font-bold text-zinc-300">
                  Membresía activa (permite reservar cupos)
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl bg-zinc-850 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Manage / Reset PIN */}
      {isPinModalOpen && pinAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => {
                setIsPinModalOpen(false);
                setPinSuccessMsg('');
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white font-['Teko'] tracking-wide">
                  GESTIÓN DE PIN DE ACCESO
                </h3>
                <p className="text-xs text-zinc-400">
                  Restablece o genera una nueva clave de 4 dígitos.
                </p>
              </div>
            </div>

            {/* Athlete Info Card */}
            <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-3.5 mb-4 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">{pinAthlete.name}</span>
                <span className="text-[11px] font-mono text-zinc-400">CC: {pinAthlete.documentId}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase font-bold block">PIN de Acceso</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-zinc-800 border border-zinc-750 font-mono text-xs font-black text-zinc-300 tracking-wider">
                  <Lock className="w-3 h-3 text-red-400" />
                  •••• (Protegido)
                </span>
              </div>
            </div>

            {pinSuccessMsg && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-950/70 border border-emerald-800/80 p-3 text-xs text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 font-semibold">{pinSuccessMsg}</div>
              </div>
            )}

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-300">
                    Nuevo PIN (4 dígitos)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1 bg-red-950/40 hover:bg-red-950/70 border border-red-800/40 px-2 py-0.5 rounded-lg transition"
                  >
                    <span>🎲 Generar PIN aleatorio</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={customPinInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setCustomPinInput(val);
                    }}
                    placeholder="••••"
                    className="w-full rounded-xl border border-zinc-750 bg-zinc-900 py-3 text-center text-2xl font-mono font-black tracking-[0.4em] text-white focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">
                  El socio necesitará este código junto con su cédula para ingresar a la PWA.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPin}
                  disabled={!customPinInput}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 px-3 py-2.5 text-xs font-semibold text-zinc-300 transition"
                  title="Copiar PIN"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{pinCopied ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                <button
                  type="submit"
                  disabled={customPinInput.length !== 4}
                  className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none py-2.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50"
                >
                  Guardar y Asignar PIN
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-zinc-850 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsPinModalOpen(false);
                  setPinSuccessMsg('');
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition"
              >
                Cerrar ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <div className="flex items-center gap-3 mb-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-base text-white">¿Eliminar Atleta?</h3>
            </div>

            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              ¿Estás seguro de que deseas eliminar a <strong className="text-white">{athleteToDelete.name}</strong> del directorio? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmDeleteAthlete}
                disabled={isDeletingAthlete}
                className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingAthlete ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Sí, Eliminar'
                )}
              </button>
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 5: Anthropometry Tracking for Selected Athlete */}
      {anthropometryAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-6 shadow-2xl relative text-zinc-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-600/40 flex items-center justify-center text-purple-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white font-['Teko'] tracking-wide">
                    CONTROL ANTROPOMÉTRICO • {anthropometryAthlete.name.toUpperCase()}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Evaluación y seguimiento de medidas físicas (CC: {anthropometryAthlete.documentId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAnthropometryAthlete(null)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 p-2 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnthropometryView athleteIdOverride={anthropometryAthlete.id} />
          </div>
        </div>
      )}

      {/* Modal 6: Plan & Pricing Management */}
      <PlanManagementModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
      />
    </div>
  );
};
