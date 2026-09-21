import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { MembershipPlan, AthleteDiscipline } from '../../types';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Tag,
  Dumbbell,
  Flame,
  Activity,
  AlertCircle,
  Clock,
  DollarSign,
  Check,
  Layers,
} from 'lucide-react';

interface PlanManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlanManagementModal: React.FC<PlanManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { plans, addPlan, updatePlan, deletePlan, role } = useGym();

  const [activeDiscipline, setActiveDiscipline] = useState<'all' | AthleteDiscipline>('all');
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlan | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDiscipline, setFormDiscipline] = useState<AthleteDiscipline>('crossfit');
  const [formPrice, setFormPrice] = useState<string>('180000');
  const [formDurationDays, setFormDurationDays] = useState<string>('30');
  const [formIsPunchCard, setFormIsPunchCard] = useState(false);
  const [formTotalClasses, setFormTotalClasses] = useState<string>('16');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormName('');
    setFormDiscipline(activeDiscipline !== 'all' ? activeDiscipline : 'crossfit');
    setFormPrice('180000');
    setFormDurationDays('30');
    setFormIsPunchCard(false);
    setFormTotalClasses('16');
    setFormDescription('');
    setFormIsActive(true);
    setIsCreatingNew(true);
  };

  const handleOpenEdit = (plan: MembershipPlan) => {
    setIsCreatingNew(false);
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormDiscipline(plan.discipline);
    setFormPrice(plan.price ? plan.price.toString() : '0');
    setFormDurationDays(plan.durationDays ? plan.durationDays.toString() : '30');
    setFormIsPunchCard(!!plan.isPunchCard);
    setFormTotalClasses(plan.totalClasses ? plan.totalClasses.toString() : '16');
    setFormDescription(plan.description || '');
    setFormIsActive(plan.isActive !== false);
  };

  const handleCloseForm = () => {
    setIsCreatingNew(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      showToast('error', 'El nombre del plan es obligatorio.');
      return;
    }

    const price = parseInt(formPrice.replace(/\D/g, ''), 10) || 0;
    const durationDays = parseInt(formDurationDays, 10) || 30;
    const totalClasses = formIsPunchCard ? parseInt(formTotalClasses, 10) || 1 : null;

    setIsSubmitting(true);
    try {
      if (editingPlan) {
        const res = await updatePlan(editingPlan.id, {
          name: cleanName,
          discipline: formDiscipline,
          price,
          durationDays,
          isPunchCard: formIsPunchCard,
          totalClasses,
          description: formDescription.trim(),
          isActive: formIsActive,
        });
        showToast('success', res.message);
      } else {
        const res = await addPlan({
          name: cleanName,
          discipline: formDiscipline,
          price,
          durationDays,
          isPunchCard: formIsPunchCard,
          totalClasses,
          description: formDescription.trim(),
          isActive: formIsActive,
        });
        showToast('success', res.message);
      }
      handleCloseForm();
    } catch (err: any) {
      showToast('error', err?.message || 'Error al guardar el plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlanActive = async (plan: MembershipPlan) => {
    try {
      await updatePlan(plan.id, { isActive: !plan.isActive });
      showToast('success', `Plan "${plan.name}" ${!plan.isActive ? 'activado' : 'desactivado'}.`);
    } catch (err: any) {
      showToast('error', 'Error al cambiar estado del plan.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!planToDelete) return;
    try {
      await deletePlan(planToDelete.id);
      showToast('success', `Plan "${planToDelete.name}" eliminado.`);
      setPlanToDelete(null);
    } catch (err: any) {
      showToast('error', 'Error al eliminar el plan.');
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (activeDiscipline === 'all') return true;
    return p.discipline === activeDiscipline;
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative text-zinc-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 shadow-sm">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white uppercase font-teko tracking-wide leading-none">
                  Gestión de Planes y Tarifas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-950 text-red-400 border border-red-800/60">
                  {plans.length} Planes
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Crea o modifica los planes de membresía, precios y tiqueteras disponibles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreatingNew && !editingPlan && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-md shadow-red-950/60"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Plan</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toastMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in shrink-0 ${
              toastMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                : 'bg-red-950/80 border-red-700 text-red-200'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Create or Edit Form */}
          {(isCreatingNew || editingPlan) && (
            <form
              onSubmit={handleSavePlan}
              className="p-4 rounded-2xl bg-zinc-900/90 border border-red-600/40 shadow-xl space-y-4 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-white uppercase">
                    {editingPlan ? `Editar: ${editingPlan.name}` : 'Crear Nuevo Plan o Categoría'}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Nombre del Plan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mensual Ilimitado Pro, Tiquetera 16 Clases..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Disciplina / Modalidad *
                  </label>
                  <select
                    value={formDiscipline}
                    onChange={(e) => setFormDiscipline(e.target.value as AthleteDiscipline)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="crossfit">CrossFit</option>
                    <option value="musculacion">Musculación</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Precio ($ COP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      placeholder="180000"
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-7 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Vigencia en Días *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="30"
                      value={formDurationDays}
                      onChange={(e) => setFormDurationDays(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-8 pr-3 py-2.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    (30 = Mensual, 90 = Trimestral, 180 = Semestral, 365 = Anual, 1 = Diario)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tipo de Plan
                  </label>
                  <div className="flex items-center gap-3 pt-1">
                    <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsPunchCard}
                        onChange={(e) => setFormIsPunchCard(e.target.checked)}
                        className="rounded border-zinc-700 text-red-600 focus:ring-red-600 w-4 h-4 bg-zinc-950"
                      />
                      <span>¿Es tiquetera por clases?</span>
                    </label>
                  </div>
                </div>

                {formIsPunchCard && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Número de Clases Incluidas *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="16"
                      value={formTotalClasses}
                      onChange={(e) => setFormTotalClasses(e.target.value)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Descripción o Beneficios (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Acceso a clases diarias, open box y asesoría..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-zinc-700 text-red-600 focus:ring-red-600 w-4 h-4 bg-zinc-950"
                    />
                    <span>Plan activo y disponible para contratación</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white transition shadow-md shadow-red-950/60 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingPlan ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl bg-zinc-950 hover:bg-zinc-850 px-4 py-2.5 text-xs text-zinc-400 hover:text-white transition border border-zinc-800"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Discipline Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Todos los Planes' },
              { id: 'crossfit', label: 'CrossFit' },
              { id: 'musculacion', label: 'Musculación' },
              { id: 'personalizado', label: 'Personalizado' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDiscipline(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  activeDiscipline === tab.id
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPlans.map((plan) => {
              const discBadgeClass =
                plan.discipline === 'personalizado'
                  ? 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                  : plan.discipline === 'musculacion'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                  : 'bg-red-950/80 text-red-300 border-red-800/60';

              const DiscIcon =
                plan.discipline === 'personalizado'
                  ? Activity
                  : plan.discipline === 'musculacion'
                  ? Dumbbell
                  : Flame;

              return (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    plan.isActive !== false
                      ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                      : 'bg-zinc-950/40 border-zinc-900 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border mb-1.5 ${discBadgeClass}`}
                        >
                          <DiscIcon className="w-3 h-3" />
                          {plan.discipline}
                        </span>
                        <h4 className="text-base font-black text-white uppercase font-teko tracking-wide leading-tight line-clamp-1">
                          {plan.name}
                        </h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase shrink-0 ${
                          plan.isActive !== false
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        {plan.isActive !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                        {plan.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                      <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-zinc-800/80 text-emerald-400 font-extrabold font-mono">
                        {formatCOP(plan.price || 0)}
                      </div>

                      <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-zinc-800/80 text-zinc-300 font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{plan.durationDays} días</span>
                      </div>

                      {plan.isPunchCard && (
                        <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-zinc-800/80 text-amber-400 font-bold flex items-center gap-1">
                          <Layers className="w-3 h-3 text-amber-500" />
                          <span>{plan.totalClasses} clases</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePlanActive(plan)}
                      className={`text-[11px] font-bold underline transition ${
                        plan.isActive !== false ? 'text-zinc-400 hover:text-amber-400' : 'text-emerald-400 hover:text-emerald-300'
                      }`}
                    >
                      {plan.isActive !== false ? 'Desactivar' : 'Activar'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(plan)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition"
                        title="Editar Plan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlanToDelete(plan)}
                        className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-400 hover:text-red-200 transition"
                        title="Eliminar Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPlans.length === 0 && (
            <div className="text-center py-10 rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6">
              <Tag className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-white">No hay planes en esta categoría</p>
              <p className="text-xs text-zinc-500 mt-1">
                Haz clic en "Nuevo Plan" para añadir tarifas a esta disciplina.
              </p>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {planToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-red-800/60 p-5 shadow-2xl text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 mx-auto">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">¿Eliminar Plan?</h4>
              <p className="text-xs text-zinc-400">
                ¿Estás seguro de que deseas eliminar el plan{' '}
                <strong className="text-white">"{planToDelete.name}"</strong>? Los atletas que ya lo tengan contratado conservarán su vigencia actual.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanToDelete(null)}
                  className="flex-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 text-white py-2 text-xs font-bold transition shadow-lg shadow-red-950/60"
                >
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
