import React, { useState, useMemo } from 'react';
import {
  Activity,
  Plus,
  Calendar,
  User,
  Scale,
  Percent,
  TrendingDown,
  TrendingUp,
  Minus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Sparkles,
  HeartPulse,
  Ruler,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { AnthropometricMeasurement } from '../../types';

interface AnthropometryViewProps {
  athleteIdOverride?: string; // Permitir al coach/admin ver las medidas de cualquier atleta específico
}

export const AnthropometryView: React.FC<AnthropometryViewProps> = ({ athleteIdOverride }) => {
  const {
    currentAthlete,
    currentAthleteId,
    role,
    currentCoach,
    anthropometricRecords,
    saveAnthropometry,
    deleteAnthropometry,
    athletes,
  } = useGym();

  const targetAthleteId = athleteIdOverride || currentAthleteId;
  const targetAthlete = useMemo(() => {
    return athletes.find((a) => a.id === targetAthleteId) || currentAthlete;
  }, [athletes, targetAthleteId, currentAthlete]);

  // Registros ordenados del más reciente al más antiguo
  const records = useMemo(() => {
    if (!targetAthleteId) return [];
    return anthropometricRecords
      .filter((r) => r.athleteId === targetAthleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [anthropometricRecords, targetAthleteId]);

  const latestRecord = records[0] || null;
  const previousRecord = records[1] || null;

  // Estado para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);
  const [editingRecord, setEditingRecord] = useState<AnthropometricMeasurement | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<AnthropometricMeasurement | null>(null);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [bodyFatPercent, setBodyFatPercent] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [visceralFat, setVisceralFat] = useState<string>('');
  const [chestCm, setChestCm] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [abdomenCm, setAbdomenCm] = useState<string>('');
  const [hipsCm, setHipsCm] = useState<string>('');
  const [armRelaxedCm, setArmRelaxedCm] = useState<string>('');
  const [armFlexedCm, setArmFlexedCm] = useState<string>('');
  const [thighCm, setThighCm] = useState<string>('');
  const [calfCm, setCalfCm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [evaluatorName, setEvaluatorName] = useState<string>(
    currentCoach ? currentCoach.name : role === 'admin' ? 'Administrador' : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permisos: Coach, Admin, o atleta si está en su perfil
  const canAddMeasurement = role === 'admin' || role === 'coach' || !!targetAthleteId;

  // Cálculo de deltas vs registro anterior
  const getDelta = (currentVal?: number, prevVal?: number) => {
    if (typeof currentVal !== 'number' || typeof prevVal !== 'number') return null;
    const diff = Number((currentVal - prevVal).toFixed(1));
    return diff;
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setWeightKg('');
    setHeightCm('');
    setBodyFatPercent('');
    setMuscleMassKg('');
    setVisceralFat('');
    setChestCm('');
    setWaistCm('');
    setAbdomenCm('');
    setHipsCm('');
    setArmRelaxedCm('');
    setArmFlexedCm('');
    setThighCm('');
    setCalfCm('');
    setNotes('');
    setEvaluatorName(currentCoach ? currentCoach.name : role === 'admin' ? 'Administrador' : '');
    setValidationError(null);
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rec: AnthropometricMeasurement) => {
    setEditingRecord(rec);
    setDate(rec.date);
    setWeightKg(rec.weightKg !== undefined ? rec.weightKg.toString() : '');
    setHeightCm(rec.heightCm !== undefined ? rec.heightCm.toString() : '');
    setBodyFatPercent(rec.bodyFatPercent !== undefined ? rec.bodyFatPercent.toString() : '');
    setMuscleMassKg(rec.muscleMassKg !== undefined ? rec.muscleMassKg.toString() : '');
    setVisceralFat(rec.visceralFat !== undefined ? rec.visceralFat.toString() : '');
    setChestCm(rec.chestCm !== undefined ? rec.chestCm.toString() : '');
    setWaistCm(rec.waistCm !== undefined ? rec.waistCm.toString() : '');
    setAbdomenCm(rec.abdomenCm !== undefined ? rec.abdomenCm.toString() : '');
    setHipsCm(rec.hipsCm !== undefined ? rec.hipsCm.toString() : '');
    setArmRelaxedCm(rec.armRelaxedCm !== undefined ? rec.armRelaxedCm.toString() : '');
    setArmFlexedCm(rec.armFlexedCm !== undefined ? rec.armFlexedCm.toString() : '');
    setThighCm(rec.thighCm !== undefined ? rec.thighCm.toString() : '');
    setCalfCm(rec.calfCm !== undefined ? rec.calfCm.toString() : '');
    setNotes(rec.notes || '');
    setEvaluatorName(rec.evaluatorName || (currentCoach ? currentCoach.name : role === 'admin' ? 'Administrador' : ''));
    setValidationError(null);
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    setValidationError(null);
    if (!date) {
      setValidationError('La Fecha de Evaluación es obligatoria.');
      return false;
    }
    const weight = parseFloat(weightKg);
    if (isNaN(weight) || weight < 25 || weight > 350) {
      setValidationError('El Peso Corporal (kg) es obligatorio y debe ser un valor numérico real (entre 25 y 350 kg).');
      return false;
    }
    const height = parseFloat(heightCm);
    if (isNaN(height) || height < 80 || height > 260) {
      setValidationError('La Estatura (cm) es obligatoria y debe ser un valor numérico real (entre 80 y 260 cm).');
      return false;
    }

    const hasFat = bodyFatPercent && !isNaN(parseFloat(bodyFatPercent));
    const hasMuscle = muscleMassKg && !isNaN(parseFloat(muscleMassKg));
    const hasWaist = waistCm && !isNaN(parseFloat(waistCm));
    const hasAbdomen = abdomenCm && !isNaN(parseFloat(abdomenCm));
    const hasChest = chestCm && !isNaN(parseFloat(chestCm));
    const hasHips = hipsCm && !isNaN(parseFloat(hipsCm));
    const hasArm = (armRelaxedCm && !isNaN(parseFloat(armRelaxedCm))) || (armFlexedCm && !isNaN(parseFloat(armFlexedCm)));
    const hasThigh = thighCm && !isNaN(parseFloat(thighCm));

    if (!hasFat && !hasMuscle && !hasWaist && !hasAbdomen && !hasChest && !hasHips && !hasArm && !hasThigh) {
      setValidationError('Debes diligenciar al menos una métrica clave adicional para el seguimiento (% Grasa, Masa Muscular, Cintura, Abdomen o Perímetros).');
      return false;
    }

    return true;
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsConfirmSaveOpen(true);
  };

  const handleExecuteSave = async () => {
    if (!targetAthleteId) return;

    setIsSubmitting(true);
    try {
      const recordToSave: AnthropometricMeasurement = {
        id: editingRecord ? editingRecord.id : `ant_${Date.now()}`,
        athleteId: targetAthleteId,
        date,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
        visceralFat: visceralFat ? parseFloat(visceralFat) : undefined,
        chestCm: chestCm ? parseFloat(chestCm) : undefined,
        waistCm: waistCm ? parseFloat(waistCm) : undefined,
        abdomenCm: abdomenCm ? parseFloat(abdomenCm) : undefined,
        hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
        armRelaxedCm: armRelaxedCm ? parseFloat(armRelaxedCm) : undefined,
        armFlexedCm: armFlexedCm ? parseFloat(armFlexedCm) : undefined,
        thighCm: thighCm ? parseFloat(thighCm) : undefined,
        calfCm: calfCm ? parseFloat(calfCm) : undefined,
        notes: notes.trim() || undefined,
        evaluatorName: evaluatorName.trim() || (role === 'admin' ? 'Administrador' : currentCoach?.name || 'Coach'),
        createdAt: editingRecord?.createdAt || new Date().toISOString(),
      };

      await saveAnthropometry(recordToSave);
      setIsConfirmSaveOpen(false);
      setIsModalOpen(false);
      setEditingRecord(null);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    await deleteAnthropometry(recordToDelete.id);
    setRecordToDelete(null);
  };

  // Helper para renderizar delta visual
  const renderDeltaBadge = (
    delta: number | null,
    unit: string,
    goodDirection: 'up' | 'down' = 'down'
  ) => {
    if (delta === null || delta === 0) {
      return (
        <span className="text-[11px] text-zinc-500 inline-flex items-center gap-0.5">
          <Minus className="w-3 h-3" /> Sin cambios
        </span>
      );
    }

    const isPositive = delta > 0;
    const isGood = goodDirection === 'up' ? isPositive : !isPositive;
    const colorClass = isGood ? 'text-emerald-400' : 'text-rose-400';
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <span className={`text-[11px] font-semibold inline-flex items-center gap-0.5 ${colorClass}`}>
        <Icon className="w-3.5 h-3.5" />
        {isPositive ? `+${delta}` : delta} {unit}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 p-5 rounded-2xl border border-purple-800/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Seguimiento Corporal Personalizado
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase font-teko tracking-wide">
            Medidas Antropométricas & Evolución
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            {targetAthlete
              ? `Progreso físico de ${targetAthlete.name} (${targetAthlete.documentId})`
              : 'Historial y evolución de composición corporal'}
          </p>
        </div>

        {canAddMeasurement && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-950/50 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nueva Valoración Antropométrica
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <Activity className="w-12 h-12 text-purple-500/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">
            Sin valoraciones antropométricas registradas
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
            Para evaluar tu progreso físico, tu coach registrará mediciones periódicas de peso, porcentaje de grasa, masa muscular y perímetros corporales.
          </p>
          {canAddMeasurement && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
            >
              Registrar Primera Valoración
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Tarjetas Principales de Composición Corporal Actual */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-purple-400" />
                Última Valoración ({latestRecord?.date})
              </h2>
              <div className="flex items-center gap-2">
                {records.length > 1 && (
                  <span className="text-[11px] text-zinc-500 hidden sm:inline mr-2">
                    Comparado vs {previousRecord?.date}
                  </span>
                )}
                {latestRecord && canAddMeasurement && (
                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(latestRecord)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-950/50 hover:text-purple-300 text-zinc-300 text-xs font-semibold transition"
                      title="Editar última valoración"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecordToDelete(latestRecord)}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition"
                      title="Eliminar última valoración"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Peso */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase">Peso Corporal</span>
                  <Scale className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-teko">
                    {latestRecord?.weightKg !== undefined ? `${latestRecord.weightKg} kg` : 'N/A'}
                  </div>
                  {latestRecord && previousRecord && (
                    <div className="mt-1">
                      {renderDeltaBadge(
                        getDelta(latestRecord.weightKg, previousRecord.weightKg),
                        'kg',
                        'down'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* % Grasa Corporal */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase">% Grasa Corporal</span>
                  <Percent className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-teko">
                    {latestRecord?.bodyFatPercent !== undefined ? `${latestRecord.bodyFatPercent} %` : 'N/A'}
                  </div>
                  {latestRecord && previousRecord && (
                    <div className="mt-1">
                      {renderDeltaBadge(
                        getDelta(latestRecord.bodyFatPercent, previousRecord.bodyFatPercent),
                        '%',
                        'down'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Masa Muscular */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase">Masa Muscular</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-teko">
                    {latestRecord?.muscleMassKg !== undefined ? `${latestRecord.muscleMassKg} kg` : 'N/A'}
                  </div>
                  {latestRecord && previousRecord && (
                    <div className="mt-1">
                      {renderDeltaBadge(
                        getDelta(latestRecord.muscleMassKg, previousRecord.muscleMassKg),
                        'kg',
                        'up'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Grasa Visceral / Estatura */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400 mb-2">
                  <span className="text-xs font-semibold uppercase">Grasa Visceral</span>
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <div className="text-2xl font-black text-white font-teko">
                    {latestRecord?.visceralFat !== undefined ? `Nivel ${latestRecord.visceralFat}` : 'N/A'}
                  </div>
                  {latestRecord && previousRecord && (
                    <div className="mt-1">
                      {renderDeltaBadge(
                        getDelta(latestRecord.visceralFat, previousRecord.visceralFat),
                        'pts',
                        'down'
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Perímetros Corporales Detallados (Circunferencias) */}
          {latestRecord && (
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-md">
              <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                    Perímetros Corporales (cm)
                  </h3>
                </div>
                <span className="text-xs text-zinc-500">
                  Evaluador: {latestRecord.evaluatorName || 'Coach'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Tórax / Pecho', val: latestRecord.chestCm, prev: previousRecord?.chestCm },
                  { label: 'Cintura', val: latestRecord.waistCm, prev: previousRecord?.waistCm },
                  { label: 'Abdomen', val: latestRecord.abdomenCm, prev: previousRecord?.abdomenCm },
                  { label: 'Cadera / Glúteo', val: latestRecord.hipsCm, prev: previousRecord?.hipsCm },
                  { label: 'Brazo Relajado', val: latestRecord.armRelaxedCm, prev: previousRecord?.armRelaxedCm },
                  { label: 'Brazo Contraído', val: latestRecord.armFlexedCm, prev: previousRecord?.armFlexedCm },
                  { label: 'Muslo Medio', val: latestRecord.thighCm, prev: previousRecord?.thighCm },
                  { label: 'Pantorrilla', val: latestRecord.calfCm, prev: previousRecord?.calfCm },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80">
                    <span className="text-[11px] text-zinc-400 block font-medium">
                      {item.label}
                    </span>
                    <div className="text-lg font-bold text-white font-teko mt-0.5">
                      {item.val !== undefined ? `${item.val} cm` : '—'}
                    </div>
                    {item.val !== undefined && item.prev !== undefined && (
                      <div className="text-[10px] mt-0.5">
                        {renderDeltaBadge(getDelta(item.val, item.prev), 'cm', 'up')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {latestRecord.notes && (
                <div className="mt-4 p-3 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-200">
                  <strong className="text-purple-300 block mb-0.5 font-semibold">Observaciones del Coach:</strong>
                  {latestRecord.notes}
                </div>
              )}
            </div>
          )}

          {/* 3. Historial Completo de Evaluaciones */}
          <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-lg">
            <button
              type="button"
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full p-4 flex items-center justify-between bg-zinc-900/80 hover:bg-zinc-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                  Historial de Mediciones ({records.length})
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>{isHistoryExpanded ? 'Ocultar' : 'Ver todo'}</span>
                {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {isHistoryExpanded && (
              <div className="overflow-x-auto border-t border-zinc-800">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Peso</th>
                      <th className="p-3">% Grasa</th>
                      <th className="p-3">Masa M.</th>
                      <th className="p-3">Cintura</th>
                      <th className="p-3">Brazo C.</th>
                      <th className="p-3">Evaluador</th>
                      {canAddMeasurement && <th className="p-3 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="p-3 font-semibold text-white whitespace-nowrap">{rec.date}</td>
                        <td className="p-3">{rec.weightKg ? `${rec.weightKg} kg` : '—'}</td>
                        <td className="p-3 text-amber-400 font-semibold">{rec.bodyFatPercent ? `${rec.bodyFatPercent} %` : '—'}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{rec.muscleMassKg ? `${rec.muscleMassKg} kg` : '—'}</td>
                        <td className="p-3">{rec.waistCm ? `${rec.waistCm} cm` : '—'}</td>
                        <td className="p-3">{rec.armFlexedCm ? `${rec.armFlexedCm} cm` : '—'}</td>
                        <td className="p-3 text-zinc-400">{rec.evaluatorName || 'Coach'}</td>
                        {canAddMeasurement && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="p-1 rounded text-zinc-400 hover:text-purple-300 hover:bg-zinc-800 transition-colors"
                                title="Editar valoración"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setRecordToDelete(rec)}
                                className="p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                                title="Eliminar valoración"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal Registrar Nueva Medición */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1 font-teko">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {editingRecord ? 'Editar Valoración Antropométrica' : 'Nueva Valoración Antropométrica'}
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Atleta: <strong className="text-white">{targetAthlete?.name || 'Atleta'}</strong> ({targetAthlete?.documentId})
            </p>

            {validationError && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Campos obligatorios incompletos</span>
                  <span>{validationError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handlePromptSubmit} className="space-y-4">
              {/* Fecha y Evaluador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Fecha de Evaluación *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre del Evaluador (Coach)
                  </label>
                  <input
                    type="text"
                    value={evaluatorName}
                    onChange={(e) => setEvaluatorName(e.target.value)}
                    placeholder="Ej: Coach Alejandro"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Composición General */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-2">
                  Composición Corporal Básica
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 75.4"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Estatura (cm)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Ej: 175"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">% Grasa</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 16.5"
                      value={bodyFatPercent}
                      onChange={(e) => setBodyFatPercent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Masa Muscular (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ej: 34.2"
                      value={muscleMassKg}
                      onChange={(e) => setMuscleMassKg(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Perímetros */}
              <div className="border-t border-zinc-800 pt-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-2">
                  Perímetros y Circunferencias (cm)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Tórax / Pecho</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={chestCm}
                      onChange={(e) => setChestCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Cintura</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={waistCm}
                      onChange={(e) => setWaistCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Abdomen</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={abdomenCm}
                      onChange={(e) => setAbdomenCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Cadera</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={hipsCm}
                      onChange={(e) => setHipsCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Brazo Relajado</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={armRelaxedCm}
                      onChange={(e) => setArmRelaxedCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Brazo Contraído</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={armFlexedCm}
                      onChange={(e) => setArmFlexedCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Muslo Medio</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={thighCm}
                      onChange={(e) => setThighCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Pantorrilla</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="cm"
                      value={calfCm}
                      onChange={(e) => setCalfCm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Observaciones / Recomendaciones Nutricionales y de Entrenamiento
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Buena adherencia al plan de fuerza, reducción notable en pliegue abdominal..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-950/50 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingRecord ? 'Guardar Cambios' : 'Guardar Valoración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Guardar / Modificar Medición */}
      {isConfirmSaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  {editingRecord ? '¿Confirmar Modificación?' : '¿Confirmar Registro?'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {editingRecord
                    ? 'Se actualizarán los valores de la valoración antropométrica seleccionada.'
                    : 'Se registrará una nueva valoración antropométrica en el historial del atleta.'}
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl text-xs space-y-1.5 text-zinc-300">
              <div className="flex justify-between">
                <span className="text-zinc-500">Fecha:</span>
                <span className="font-semibold text-white">{date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Peso:</span>
                <span className="font-semibold text-white">{weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Estatura:</span>
                <span className="font-semibold text-white">{heightCm} cm</span>
              </div>
              {bodyFatPercent && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">% Grasa:</span>
                  <span className="font-semibold text-amber-400">{bodyFatPercent} %</span>
                </div>
              )}
              {muscleMassKg && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Masa Muscular:</span>
                  <span className="font-semibold text-emerald-400">{muscleMassKg} kg</span>
                </div>
              )}
              {waistCm && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cintura:</span>
                  <span className="font-semibold text-zinc-300">{waistCm} cm</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmSaveOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
              >
                Revisar datos
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteSave}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-lg shadow-purple-950/50 flex items-center gap-2"
              >
                {isSubmitting && <span className="animate-spin text-sm">⏳</span>}
                <span>{editingRecord ? 'Sí, Actualizar' : 'Sí, Guardar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Medición */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-red-900/50 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider">
                  ¿Eliminar Valoración?
                </h3>
                <p className="text-xs text-zinc-400">
                  Esta acción eliminará permanentemente la medición del <strong className="text-white">{recordToDelete.date}</strong>.
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800">
              Los deltas de evolución y gráficas históricas se recalcularán automáticamente excluyendo esta medición.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-lg shadow-red-950/50"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
