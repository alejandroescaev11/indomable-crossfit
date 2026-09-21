import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { CoachUser } from '../../types';
import {
  Shield,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  Phone,
  Mail,
  X,
  Check,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';

export const CoachUserManagementView: React.FC = () => {
  const {
    coaches,
    addCoach,
    updateCoach,
    deleteCoach,
    forceReleaseAdminSession,
    updateAdminPassword,
    role,
  } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachUser | null>(null);
  const [coachToDelete, setCoachToDelete] = useState<CoachUser | null>(null);

  // Admin Password Change Modal State
  const [isAdminPassModalOpen, setIsAdminPassModalOpen] = useState(false);
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleOpenAdminPassModal = () => {
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setPassError('');
    setPassSuccess('');
    setIsAdminPassModalOpen(true);
  };

  const handleUpdateAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!currentPassInput.trim()) {
      setPassError('Ingresa tu contraseña actual de Administrador.');
      return;
    }

    if (newPassInput.trim().length < 8) {
      setPassError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (newPassInput.trim() !== confirmPassInput.trim()) {
      setPassError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      const res = await updateAdminPassword(currentPassInput.trim(), newPassInput.trim());
      if (res.success) {
        setPassSuccess(res.message);
        setCurrentPassInput('');
        setNewPassInput('');
        setConfirmPassInput('');
        setTimeout(() => {
          setIsAdminPassModalOpen(false);
          setPassSuccess('');
        }, 1500);
      } else {
        setPassError(res.message);
      }
    } catch (err: any) {
      setPassError(err?.message || 'Error al actualizar contraseña.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  // Add Staff/Coach Form
  const [addName, setAddName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [showAddPass, setShowAddPass] = useState(false);
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<'coach' | 'admin'>('coach');

  // Edit Staff/Coach Form
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPass, setShowEditPass] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editRole, setEditRole] = useState<'coach' | 'admin'>('coach');
  const [releasingUser, setReleasingUser] = useState<string | null>(null);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  const filteredCoaches = coaches.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return c.isActive;
    if (statusFilter === 'inactive') return !c.isActive;
    return true;
  });

  const handleOpenAddModal = () => {
    setAddName('');
    setAddUsername('');
    setAddEmail('');
    setAddPassword('');
    setAddPhone('');
    setAddRole('coach');
    setShowAddPass(false);
    setIsAddModalOpen(true);
  };

  const handleCreateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addUsername.trim() || !addEmail.trim() || !addPassword.trim()) {
      showToast('error', 'Por favor diligencia todos los campos obligatorios.');
      return;
    }

    if (addPassword.trim().length < 6) {
      showToast('error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const res = await addCoach({
      name: addName.trim(),
      username: addUsername.trim().toLowerCase(),
      email: addEmail.trim().toLowerCase(),
      password: addPassword.trim(),
      phone: addPhone.trim(),
      role: addRole,
      isActive: true,
    });

    if (res.success) {
      showToast('success', res.message);
      setIsAddModalOpen(false);
    } else {
      showToast('error', res.message);
    }
  };

  const handleOpenEditModal = (coach: CoachUser) => {
    setSelectedCoach(coach);
    setEditName(coach.name);
    setEditUsername(coach.username);
    setEditEmail(coach.email);
    setEditPhone(coach.phone || '');
    setEditPassword('');
    setShowEditPass(false);
    setEditIsActive(coach.isActive);
    setEditRole(coach.role || 'coach');
    setIsEditModalOpen(true);
  };

  const handleSaveEditCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach) return;

    if (!editName.trim() || !editUsername.trim() || !editEmail.trim()) {
      showToast('error', 'Nombre, usuario y correo son obligatorios.');
      return;
    }

    const updates: Partial<CoachUser> = {
      name: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      email: editEmail.trim().toLowerCase(),
      phone: editPhone.trim(),
      isActive: editIsActive,
      role: editRole,
    };

    if (editPassword.trim()) {
      if (editPassword.trim().length < 6) {
        showToast('error', 'La nueva contraseña debe tener mínimo 6 caracteres.');
        return;
      }
      updates.password = editPassword.trim();
    }

    const res = await updateCoach(selectedCoach.id, updates);
    if (res.success) {
      showToast('success', res.message);
      setIsEditModalOpen(false);
    } else {
      showToast('error', res.message);
    }
  };

  const handleReleaseAdminSession = async (username: string) => {
    setReleasingUser(username);
    try {
      const res = await forceReleaseAdminSession(username);
      showToast(res.success ? 'success' : 'error', res.message);
    } catch {
      showToast('error', 'Error al solicitar liberación de la sesión.');
    } finally {
      setReleasingUser(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!coachToDelete) return;
    const res = await deleteCoach(coachToDelete.id);
    if (res.success) {
      showToast('success', res.message);
      setCoachToDelete(null);
    } else {
      showToast('error', res.message);
    }
  };

  if (role !== 'admin') {
    return (
      <div className="p-8 text-center text-zinc-400">
        <Lock className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-white">Acceso Restringido</p>
        <p className="text-xs text-zinc-500 mt-1">
          Solo el Administrador general puede gestionar las cuentas de los entrenadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600/20 text-amber-500 border border-amber-600/40">
                <Shield className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-500">
                SEGURIDAD & STAFF • INDOMABLE
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              GESTIÓN DE COACHES Y ADMINISTRADORES
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Crea credenciales de acceso para tu equipo de coaches y administradores, modifica la contraseña maestra y gestiona sesiones activas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              id="btn-admin-change-password"
              onClick={handleOpenAdminPassModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-amber-400 border border-amber-600/50 px-3.5 py-2.5 text-xs font-bold transition shadow-md shrink-0"
              title="Cambiar la clave maestra del administrador"
            >
              <KeyRound className="w-4 h-4" />
              <span>Cambiar Clave de Admin</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 text-xs font-extrabold shadow-lg shadow-amber-950/60 transition active:scale-95 shrink-0 border border-amber-500/40"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Staff / Administrador</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-zinc-800/90">
          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-zinc-400 font-bold uppercase">Total Coaches</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-white leading-none mt-0.5">
              {coaches.length}
            </div>
          </div>
          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center">
            <span className="text-[10px] text-emerald-400 font-bold uppercase">Activos</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-emerald-400 leading-none mt-0.5">
              {coaches.filter((c) => c.isActive).length}
            </div>
          </div>
          <div className="rounded-xl bg-black/70 p-3 border border-zinc-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Inactivos</span>
            <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-zinc-500 leading-none mt-0.5">
              {coaches.filter((c) => !c.isActive).length}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-xs animate-in fade-in border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
              : 'bg-red-950/60 border-red-800/80 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, usuario, correo..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-600 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs w-full sm:w-auto justify-center">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
              statusFilter === 'all'
                ? 'bg-amber-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({coaches.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
              statusFilter === 'inactive'
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Inactivos
          </button>
        </div>
      </div>

      {/* Coaches List */}
      <div className="space-y-3">
        {filteredCoaches.map((coach) => (
          <div
            key={coach.id}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-zinc-850 border border-zinc-700 flex items-center justify-center shrink-0">
                {coach.avatar ? (
                  <img
                    src={coach.avatar}
                    alt={coach.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Shield className="w-6 h-6 text-amber-500" />
                )}
                {coach.isActive ? (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-black" />
                ) : (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-zinc-600 ring-2 ring-black" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-white">{coach.name}</h3>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    @{coach.username}
                  </span>
                  {coach.role === 'admin' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      Administrador
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold uppercase flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-red-400" />
                      Coach
                    </span>
                  )}
                  {coach.isActive ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
                      Activo
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold uppercase">
                      Inactivo
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{coach.email}</span>
                  </div>
                  {coach.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{coach.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                    <KeyRound className="w-3 h-3 text-zinc-600" />
                    <span>Contraseña configurada</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-end md:self-center">
              {coach.role === 'admin' && (
                <button
                  type="button"
                  disabled={releasingUser === coach.username}
                  onClick={() => handleReleaseAdminSession(coach.username)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-amber-950/40 hover:border-amber-600/60 text-zinc-300 hover:text-amber-300 text-xs font-semibold transition disabled:opacity-50"
                  title="Liberar bloqueo de sesión única en caso de que haya quedado abierta en otro dispositivo"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{releasingUser === coach.username ? 'Liberando...' : 'Liberar Sesión'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleOpenEditModal(coach)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold transition"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                onClick={() => setCoachToDelete(coach)}
                className="rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800 text-zinc-500 hover:text-red-400 p-2 transition"
                title="Eliminar Coach"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredCoaches.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-zinc-850 bg-zinc-950 text-zinc-400">
            <Shield className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-300">No se encontraron entrenadores</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Registra a los coaches de tu box para que puedan acceder con su usuario y clave.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Crear Coach */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center text-amber-400">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Nuevo Usuario de Staff</h3>
                <p className="text-xs text-zinc-400">Asigna credenciales y rol de acceso</p>
              </div>
            </div>

            <form onSubmit={handleCreateCoach} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Rol en la Plataforma *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAddRole('coach')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      addRole === 'coach'
                        ? 'bg-red-950/70 border-red-600 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span>Coach</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddRole('admin')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      addRole === 'admin'
                        ? 'bg-amber-950/70 border-amber-600 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Administrador</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Ej: Carlos Silva"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Usuario de Acceso *</label>
                  <input
                    type="text"
                    required
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    placeholder="Ej: coach.carlos"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="+57 300 000 0000"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="coach@indomable.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">
                  Contraseña Robusta (mínimo 6 caracteres) *
                </label>
                <div className="relative">
                  <input
                    type={showAddPass ? 'text' : 'password'}
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-3 pr-9 py-2.5 text-white focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPass(!showAddPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                    tabIndex={-1}
                  >
                    {showAddPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-950/60 transition active:scale-95"
                >
                  Registrar Coach
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Coach */}
      {isEditModalOpen && selectedCoach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center text-amber-400">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Editar Usuario de Staff</h3>
                <p className="text-xs text-zinc-400">{selectedCoach.name}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEditCoach} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Rol en la Plataforma *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('coach')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      editRole === 'coach'
                        ? 'bg-red-950/70 border-red-600 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-400" />
                    <span>Coach</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('admin')}
                    className={`p-2 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                      editRole === 'admin'
                        ? 'bg-amber-950/70 border-amber-600 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Administrador</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Usuario *</label>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">
                  Nueva Contraseña (dejar en blanco para conservar la actual)
                </label>
                <div className="relative">
                  <input
                    type={showEditPass ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-3 pr-9 py-2.5 text-white focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                    tabIndex={-1}
                  >
                    {showEditPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded border-zinc-700 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-bold text-zinc-300">Cuenta de Entrenador Activa</span>
                </label>
                <p className="text-[10px] text-zinc-500 ml-6">
                  Si desactivas esta cuenta, el coach no podrá iniciar sesión en la aplicación.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-950/60 transition active:scale-95"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation: Delete Coach */}
      {coachToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl relative text-zinc-100">
            <h3 className="font-bold text-sm text-white mb-1">¿Eliminar entrenador?</h3>
            <p className="text-xs text-zinc-400 mb-4">
              ¿Estás seguro de que deseas eliminar a <strong>{coachToDelete.name}</strong> (@{coachToDelete.username})? Esta acción revocará de inmediato su acceso al panel.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                Eliminar Definitivamente
              </button>
              <button
                type="button"
                onClick={() => setCoachToDelete(null)}
                className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cambiar Contraseña Maestra de Administrador */}
      {isAdminPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-amber-600/50 p-5 sm:p-6 shadow-2xl relative text-zinc-100">
            <button
              onClick={() => setIsAdminPassModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-600/30 flex items-center justify-center text-amber-500 shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Seguridad de Administrador</h3>
                <p className="text-xs text-zinc-400">Modificar contraseña maestra</p>
              </div>
            </div>

            {passError && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="mb-3 flex items-start gap-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 p-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{passSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateAdminPass} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Contraseña Actual *</label>
                <input
                  type="password"
                  required
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  placeholder="Contraseña actual"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nueva Contraseña (mínimo 8 caracteres) *</label>
                <input
                  type="password"
                  required
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  placeholder="Nueva contraseña robusta"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Confirmar Nueva Contraseña *</label>
                <input
                  type="password"
                  required
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white text-xs focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-950/60 transition active:scale-95 disabled:opacity-50"
                >
                  {isUpdatingPass ? 'Actualizando...' : 'Guardar Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminPassModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-850 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
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
