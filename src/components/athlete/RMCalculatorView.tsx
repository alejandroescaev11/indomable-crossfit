import React, { useState, useMemo, useRef } from 'react';
import { useGym } from '../../context/GymContext';
import { PersonalRecord, WeightUnit, CustomExercise } from '../../types';
import { DEFAULT_EXERCISES } from '../../data/seedData';
import {
  Trophy,
  Percent,
  Plus,
  Trash2,
  Edit2,
  Dumbbell,
  Check,
  Search,
  ArrowRight,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Calculator,
  Flame,
  Activity,
  ArrowLeftRight
} from 'lucide-react';

// Conversión matemática bidireccional LBS <-> KG
export const convertWeight = (
  val: number,
  fromUnit: WeightUnit = 'lbs',
  toUnit: WeightUnit
): number => {
  if (fromUnit === toUnit) return val;
  if (fromUnit === 'lbs' && toUnit === 'kg') {
    // 1 lb = 0.453592 kg -> 175 lbs / 2.20462 = 79.378 -> 79.4 kg
    return Math.round((val / 2.20462) * 10) / 10;
  }
  if (fromUnit === 'kg' && toUnit === 'lbs') {
    // 79.4 kg * 2.20462 = 175.04 -> 175 lbs
    return Math.round((val * 2.20462) * 10) / 10;
  }
  return val;
};

// Agrupador simplificado de ejercicios: 'levantamiento' o 'fuerza'
export const getExerciseGroup = (
  category: string = '',
  name: string = ''
): 'levantamiento' | 'fuerza' => {
  const c = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (
    c === 'olympic' ||
    c === 'levantamiento' ||
    c === 'halterofilia' ||
    n.includes('clean') ||
    n.includes('snatch') ||
    n.includes('jerk') ||
    n.includes('thruster')
  ) {
    return 'levantamiento';
  }
  return 'fuerza';
};

export const RMCalculatorView: React.FC<{ initialExercise?: string }> = ({
  initialExercise,
}) => {
  const {
    rms,
    saveRM,
    deleteRM,
    currentAthleteId,
    activeUnit,
    setActiveUnit,
    customExercises,
    addCustomExercise,
  } = useGym();

  const calculatorRef = useRef<HTMLDivElement>(null);

  // Search & Filter (Simplificado exclusivamente a 'levantamiento' y 'fuerza')
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'levantamiento' | 'fuerza'>('all');
  const [isTableExpanded, setIsTableExpanded] = useState(true);

  // Selected RM for calculation
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(
    initialExercise || 'Clean & Jerk'
  );
  const [customWeightInput, setCustomWeightInput] = useState<string>('');
  const [targetPercent, setTargetPercent] = useState<number>(75);
  const [barbellWeight, setBarbellWeight] = useState<number>(20); // 20kg / 45lbs

  // Modal for Adding / Editing RM
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PersonalRecord | null>(null);
  const [formExercise, setFormExercise] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formCategory, setFormCategory] = useState<'olympic' | 'powerlifting'>('olympic');
  const [formReps, setFormReps] = useState<number>(1);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [isCustomExerciseInput, setIsCustomExerciseInput] = useState(false);

  // Modal for Adding New Exercise definition to system
  const [isNewExerciseModalOpen, setIsNewExerciseModalOpen] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<'olympic' | 'powerlifting'>('powerlifting');
  const [isSavingEx, setIsSavingEx] = useState(false);

  // All known exercises list (DEFAULT + Custom)
  const allExerciseOptions = useMemo(() => {
    const list: { name: string; category: string }[] = [
      ...DEFAULT_EXERCISES,
      ...customExercises.map((c) => ({ name: c.name, category: c.category })),
    ];
    // Deduplicate by lowercase name
    const seen = new Set<string>();
    return list.filter((item) => {
      const lower = item.name.toLowerCase().trim();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    });
  }, [customExercises]);

  // Filter athlete's RMs
  const athleteRMs = useMemo(() => {
    return rms.filter((r) => r.athleteId === currentAthleteId);
  }, [rms, currentAthleteId]);

  // Filtered RMs according to search query and simplified category ('levantamiento' o 'fuerza')
  const filteredRMs = useMemo(() => {
    return athleteRMs.filter((rec) => {
      const matchesSearch = rec.exerciseName.toLowerCase().includes(searchQuery.toLowerCase());
      const group = getExerciseGroup(rec.category, rec.exerciseName);
      const matchesCategory = categoryFilter === 'all' || group === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [athleteRMs, searchQuery, categoryFilter]);

  // Selected RM object
  const currentRecord = useMemo(() => {
    return athleteRMs.find(
      (r) => r.exerciseName.toLowerCase() === selectedExerciseName.toLowerCase()
    );
  }, [athleteRMs, selectedExerciseName]);

  // Base 1RM weight used for calculation (converts automatically to activeUnit)
  const effective1RM = useMemo(() => {
    if (customWeightInput && !isNaN(Number(customWeightInput)) && Number(customWeightInput) > 0) {
      return Number(customWeightInput);
    }
    if (currentRecord) {
      return convertWeight(currentRecord.weight, currentRecord.unit || 'lbs', activeUnit);
    }
    return activeUnit === 'kg' ? 60 : 135; // fallback base
  }, [customWeightInput, currentRecord, activeUnit]);

  // Target calculated weight
  const calculatedWeight = useMemo(() => {
    const raw = (effective1RM * targetPercent) / 100;
    // Round to nearest 0.5
    return Math.round(raw * 2) / 2;
  }, [effective1RM, targetPercent]);

  // Plate Calculator: plates per side
  const plateBreakdown = useMemo(() => {
    const isKg = activeUnit === 'kg';
    const bar = isKg ? barbellWeight : barbellWeight === 20 ? 45 : 35;
    const weightToDistribute = Math.max(0, calculatedWeight - bar);
    const weightPerSide = weightToDistribute / 2;

    const availablePlates = isKg
      ? [25, 20, 15, 10, 5, 2.5, 1.25]
      : [45, 35, 25, 15, 10, 5, 2.5];

    let remaining = weightPerSide;
    const platesUsed: { weight: number; count: number; color: string }[] = [];

    const getPlateColor = (pWeight: number) => {
      if (isKg) {
        if (pWeight === 25) return 'bg-red-600 text-white'; // Red
        if (pWeight === 20) return 'bg-blue-600 text-white'; // Blue
        if (pWeight === 15) return 'bg-amber-400 text-black'; // Yellow
        if (pWeight === 10) return 'bg-emerald-600 text-white'; // Green
        if (pWeight === 5) return 'bg-white text-black'; // White
        if (pWeight === 2.5) return 'bg-zinc-700 text-white';
        return 'bg-zinc-800 text-zinc-300';
      } else {
        if (pWeight === 45) return 'bg-blue-600 text-white';
        if (pWeight === 35) return 'bg-amber-500 text-black';
        if (pWeight === 25) return 'bg-emerald-600 text-white';
        return 'bg-zinc-700 text-white';
      }
    };

    for (const plate of availablePlates) {
      if (remaining >= plate) {
        const count = Math.floor(remaining / plate);
        platesUsed.push({
          weight: plate,
          count,
          color: getPlateColor(plate),
        });
        remaining = Math.round((remaining - count * plate) * 100) / 100;
      }
    }

    return {
      barWeight: bar,
      weightPerSide,
      platesUsed,
      unaccounted: remaining,
    };
  }, [calculatedWeight, barbellWeight, activeUnit]);

  // Modal actions
  const handleOpenAddModal = (initialName?: string) => {
    setEditingRecord(null);
    setFormExercise(initialName || allExerciseOptions[0]?.name || 'Clean & Jerk');
    setFormWeight('');
    setFormCategory('olympic');
    setFormReps(1);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setIsCustomExerciseInput(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record: PersonalRecord) => {
    setEditingRecord(record);
    setFormExercise(record.exerciseName);
    // Mostrar en el modal el valor en la unidad activa para edición cómoda
    const convertedWeight = convertWeight(record.weight, record.unit || 'lbs', activeUnit);
    setFormWeight(convertedWeight.toString());
    const group = getExerciseGroup(record.category, record.exerciseName);
    setFormCategory(group === 'levantamiento' ? 'olympic' : 'powerlifting');
    setFormReps(record.reps || 1);
    setFormDate(record.date || new Date().toISOString().split('T')[0]);
    setFormNotes(record.notes || '');
    setIsCustomExerciseInput(false);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formExercise.trim() || !formWeight || isNaN(Number(formWeight))) {
      return;
    }

    saveRM({
      id: editingRecord?.id,
      athleteId: currentAthleteId,
      exerciseName: formExercise.trim(),
      weight: parseFloat(formWeight),
      reps: formReps,
      unit: activeUnit, // Se guarda en la unidad activa seleccionada
      date: formDate,
      category: formCategory,
      notes: formNotes.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const handleSelectForCalculation = (exerciseName: string) => {
    setSelectedExerciseName(exerciseName);
    setCustomWeightInput('');
    calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSaveCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;
    setIsSavingEx(true);
    await addCustomExercise(newExName.trim(), newExCategory);
    setIsSavingEx(false);
    setIsNewExerciseModalOpen(false);
    setNewExName('');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. SECCIÓN SUPERIOR: HISTORIAL DE RECORDS PERSONALES (1RM) EN FORMATO TABLA PLEGABLE */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-850">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
                <Trophy className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                HISTORIAL & CONTROL DE CARGAS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase font-teko tracking-wide">
              MIS RÉCORDS PERSONALES (1RM)
            </h2>
            <p className="text-xs text-zinc-400">
              Registra y consulta tus marcas con conversión instantánea entre kilogramos y libras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle de Unidad KG / LBS con efecto de conversión */}
            <div className="flex items-center bg-black p-1 rounded-xl border border-zinc-800 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveUnit('kg')}
                className={`px-3 py-1.5 rounded-lg transition-all font-black text-xs flex items-center gap-1 ${
                  activeUnit === 'kg'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>KG</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveUnit('lbs')}
                className={`px-3 py-1.5 rounded-lg transition-all font-black text-xs flex items-center gap-1 ${
                  activeUnit === 'lbs'
                    ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>LBS</span>
              </button>
            </div>

            {/* Botón Nuevo Ejercicio */}
            <button
              type="button"
              onClick={() => setIsNewExerciseModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3 py-2 text-xs font-bold border border-zinc-800 transition"
              title="Agregar nuevo tipo de ejercicio al catálogo"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Nuevo Ejercicio</span>
            </button>

            {/* Botón Nuevo RM */}
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 text-xs font-bold shadow-md shadow-red-950/60 transition active:scale-95 border border-red-500/40"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo RM</span>
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros de Categoría Simplificados ('Levantamiento' y 'Fuerza') */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar ejercicio... (ej: Clean, Snatch, Sentadilla, Press...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-black border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de Categoría Simplificados: Solo 'Levantamiento' y 'Fuerza' */}
          <div className="flex items-center gap-1.5 text-xs font-bold">
            <span className="text-zinc-500 text-[11px] mr-1 hidden sm:inline">Tipo:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'levantamiento', label: '🏋️ Levantamiento' },
              { id: 'fuerza', label: '💪 Fuerza' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl transition ${
                  categoryFilter === cat.id
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Toggle Plegar/Desplegar Tabla */}
            <button
              type="button"
              onClick={() => setIsTableExpanded(!isTableExpanded)}
              className="ml-auto sm:ml-2 p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center gap-1 text-xs border border-zinc-800"
              title={isTableExpanded ? 'Plegar tabla' : 'Desplegar tabla'}
            >
              <span className="text-[11px] font-semibold hidden sm:inline">
                {isTableExpanded ? 'Plegar' : 'Ver'} ({filteredRMs.length})
              </span>
              {isTableExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tabla Plegable de RMs con Conversión Dinámica */}
        {isTableExpanded && (
          <div className="rounded-xl border border-zinc-800 overflow-hidden bg-black/40">
            {filteredRMs.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs">
                {athleteRMs.length === 0 ? (
                  <div>
                    <Trophy className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                    <p className="font-semibold text-zinc-300">Aún no tienes récords personales registrados.</p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal()}
                      className="mt-3 text-red-400 hover:text-red-300 font-bold underline text-xs"
                    >
                      + Registrar tu primer 1RM
                    </button>
                  </div>
                ) : (
                  <div>No se encontraron ejercicios en la categoría seleccionada con "{searchQuery}".</div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Ejercicio</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Marca Actual ({activeUnit.toUpperCase()})</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Notas</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {filteredRMs.map((rec) => {
                      const isSelected =
                        rec.exerciseName.toLowerCase() === selectedExerciseName.toLowerCase();
                      const group = getExerciseGroup(rec.category, rec.exerciseName);
                      const originalUnit = rec.unit || 'lbs';
                      const converted = convertWeight(rec.weight, originalUnit, activeUnit);

                      return (
                        <tr
                          key={rec.id}
                          className={`hover:bg-zinc-900/60 transition-colors ${
                            isSelected ? 'bg-red-950/20' : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-white whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {isSelected && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                              <span>{rec.exerciseName}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {group === 'levantamiento' ? (
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-red-950/80 border border-red-700/60 text-red-300">
                                Levantamiento
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-700/60 text-amber-300">
                                Fuerza
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-base sm:text-lg font-black font-teko text-red-400 mr-1.5">
                              {converted} {activeUnit}
                            </span>
                            {originalUnit !== activeUnit && (
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({rec.weight} {originalUnit})
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-500 font-medium ml-1">
                              ({rec.reps || 1}RM)
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400 whitespace-nowrap">{rec.date || '—'}</td>
                          <td className="p-3 text-zinc-400 max-w-xs truncate" title={rec.notes}>
                            {rec.notes || '—'}
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectForCalculation(rec.exerciseName)}
                                className="px-2 py-1 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-[11px] font-bold border border-red-600/30 transition flex items-center gap-1"
                                title="Calcular porcentajes y discos para este ejercicio"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Calcular %</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(rec)}
                                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
                                title="Editar récord"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRM(rec.id)}
                                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition"
                                title="Eliminar récord"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. SECCIÓN INFERIOR: CALCULADORA DINÁMICA DE 1RM & DISTRIBUCIÓN DE DISCOS */}
      <div
        ref={calculatorRef}
        className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-6 shadow-xl space-y-5"
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
              <Calculator className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase font-teko tracking-wide">
                Calculadora de Porcentajes & Carga en Barra
              </h3>
              <p className="text-xs text-zinc-400">
                Selecciona tu porcentaje de entrenamiento y visualiza el peso exacto por lado.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Columna 1: Ejercicio Seleccionado y Peso Base */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Ejercicio Seleccionado para el Cálculo
              </label>
              <select
                value={selectedExerciseName}
                onChange={(e) => {
                  setSelectedExerciseName(e.target.value);
                  setCustomWeightInput('');
                }}
                className="w-full rounded-xl border border-zinc-700 bg-black p-2.5 text-xs sm:text-sm font-semibold text-white focus:border-red-600 focus:outline-none cursor-pointer"
              >
                {Array.from(
                  new Set([
                    ...allExerciseOptions.map((ex) => ex.name),
                    ...athleteRMs.map((r) => r.exerciseName),
                  ])
                ).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Base 1RM con Conversión Activa */}
            <div className="rounded-xl bg-black/80 p-3.5 border border-zinc-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-zinc-400 font-medium">1RM Registrado:</span>
                {currentRecord ? (
                  <span className="text-xs font-bold text-red-400 bg-red-600/20 border border-red-600/30 px-2 py-0.5 rounded">
                    {currentRecord.date}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500">Sin récord registrado</span>
                )}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black font-teko text-white">
                  {currentRecord
                    ? convertWeight(currentRecord.weight, currentRecord.unit || 'lbs', activeUnit)
                    : '--'}
                </span>
                <span className="text-sm font-bold text-zinc-400">{activeUnit}</span>
                {currentRecord && (currentRecord.unit || 'lbs') !== activeUnit && (
                  <span className="text-xs text-zinc-500 font-mono ml-1">
                    (equivale a {currentRecord.weight} {currentRecord.unit || 'lbs'})
                  </span>
                )}
              </div>

              {/* O probar con peso manual */}
              <div className="mt-3 pt-2.5 border-t border-zinc-800">
                <label className="block text-[11px] text-zinc-400 font-medium mb-1">
                  O prueba con un peso manual:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder={`Ej: ${effective1RM}`}
                    value={customWeightInput}
                    onChange={(e) => setCustomWeightInput(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                  />
                  <span className="text-xs text-zinc-400 font-bold">{activeUnit}</span>
                </div>
              </div>
            </div>

            {/* Selector de barra olímpica */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-medium">Barra Olímpica:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setBarbellWeight(20)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    barbellWeight === 20 ? 'bg-red-600 text-white' : 'bg-zinc-850 text-zinc-400'
                  }`}
                >
                  {activeUnit === 'kg' ? '20 kg (Hombres)' : '45 lbs'}
                </button>
                <button
                  type="button"
                  onClick={() => setBarbellWeight(15)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    barbellWeight === 15 ? 'bg-red-600 text-white' : 'bg-zinc-850 text-zinc-400'
                  }`}
                >
                  {activeUnit === 'kg' ? '15 kg (Mujeres)' : '35 lbs'}
                </button>
              </div>
            </div>
          </div>

          {/* Columna 2: Selector de % y Resultado */}
          <div className="space-y-4">
            <div className="rounded-xl bg-black p-4 border border-zinc-800 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Porcentaje Objetivo para el WOD
              </span>

              <div className="my-2">
                <span className="text-5xl font-black font-teko text-red-500 leading-none">
                  {targetPercent}%
                </span>
              </div>

              {/* Slider interactivo */}
              <input
                type="range"
                min="40"
                max="110"
                step="5"
                value={targetPercent}
                onChange={(e) => setTargetPercent(Number(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />

              {/* Botones de porcentaje rápido */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {[50, 65, 75, 80, 85, 90, 95].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTargetPercent(pct)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                      targetPercent === pct
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Carga Calculada Total */}
            <div className="rounded-xl bg-gradient-to-r from-red-950/70 to-black p-4 border border-red-700/50 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Carga Total Sugerida en Barra
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-1">
                <span className="text-6xl font-black font-teko text-white leading-none">
                  {calculatedWeight}
                </span>
                <span className="text-lg font-bold text-red-400">{activeUnit}</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                Equivale al {targetPercent}% de tu 1RM ({effective1RM} {activeUnit})
              </p>
            </div>
          </div>

          {/* Columna 3: Desglose de Discos por Lado */}
          <div className="space-y-4">
            <div className="rounded-xl bg-black/80 p-4 border border-zinc-800">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                <Layers className="w-4 h-4 text-red-500" />
                <span>Discos por Lado de la Barra</span>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 text-xs mb-3 text-zinc-300">
                <div className="flex justify-between">
                  <span>Peso por lado:</span>
                  <strong className="text-white">
                    {plateBreakdown.weightPerSide} {activeUnit}
                  </strong>
                </div>
                <div className="flex justify-between mt-1 text-[11px] text-zinc-400">
                  <span>Barra base:</span>
                  <span>
                    {plateBreakdown.barWeight} {activeUnit}
                  </span>
                </div>
              </div>

              {/* Lista visual de discos */}
              {plateBreakdown.platesUsed.length > 0 ? (
                <div className="space-y-1.5">
                  {plateBreakdown.platesUsed.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3.5 h-3.5 rounded-full ${p.color} inline-block border border-black/40`}
                        />
                        <span className="font-bold text-white">
                          Disco de {p.weight} {activeUnit}
                        </span>
                      </div>
                      <span className="font-black text-red-400 font-teko text-base">
                        x {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-zinc-500">
                  Solo barra vacía ({plateBreakdown.barWeight} {activeUnit}) o carga inferior a barra.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Agregar o Editar 1RM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-lg text-white mb-1 font-teko tracking-wide uppercase flex items-center gap-2">
              <Trophy className="w-5 h-5 text-red-500" />
              {editingRecord ? 'Editar Récord Personal' : 'Nuevo Récord Personal (1RM)'}
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Registra tu mejor levantamiento en {activeUnit.toUpperCase()}. Se convertirá automáticamente cuando cambies de unidad.
            </p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nombre del Ejercicio
                </label>
                <select
                  value={
                    isCustomExerciseInput
                      ? '__custom__'
                      : allExerciseOptions.some(
                          (e) => e.name.toLowerCase() === formExercise.toLowerCase()
                        )
                      ? allExerciseOptions.find(
                          (e) => e.name.toLowerCase() === formExercise.toLowerCase()
                        )?.name
                      : '__custom__'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__custom__') {
                      setIsCustomExerciseInput(true);
                      setFormExercise('');
                    } else {
                      setIsCustomExerciseInput(false);
                      setFormExercise(val);
                      const matched = allExerciseOptions.find((ex) => ex.name === val);
                      if (matched) {
                        const grp = getExerciseGroup(matched.category, matched.name);
                        setFormCategory(grp === 'levantamiento' ? 'olympic' : 'powerlifting');
                      }
                    }
                  }}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none font-semibold cursor-pointer"
                >
                  <optgroup label="🏋️ Levantamiento (Olímpico / Halterofilia)">
                    {allExerciseOptions
                      .filter((e) => getExerciseGroup(e.category, e.name) === 'levantamiento')
                      .map((e) => (
                        <option key={e.name} value={e.name}>
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="💪 Fuerza (Powerlifting & Musculación)">
                    {allExerciseOptions
                      .filter((e) => getExerciseGroup(e.category, e.name) === 'fuerza')
                      .map((e) => (
                        <option key={e.name} value={e.name}>
                          {e.name}
                        </option>
                      ))}
                  </optgroup>
                  <option value="__custom__">✍️ Escribir otro ejercicio personalizado...</option>
                </select>

                {isCustomExerciseInput && (
                  <div className="mt-2 animate-in fade-in">
                    <input
                      type="text"
                      required
                      value={formExercise}
                      onChange={(e) => setFormExercise(e.target.value)}
                      placeholder="Escribe el nombre del ejercicio..."
                      className="w-full rounded-xl border border-red-700/60 bg-black p-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Peso ({activeUnit.toUpperCase()})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formWeight}
                    onChange={(e) => setFormWeight(e.target.value)}
                    placeholder={activeUnit === 'kg' ? 'Ej: 80' : 'Ej: 175'}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2.5 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Repeticiones (1RM / 3RM)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={formReps}
                    onChange={(e) => setFormReps(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2.5 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="olympic">Levantamiento</option>
                    <option value="powerlifting">Fuerza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Fecha del Récord
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Buena técnica, cinturón puesto..."
                  className="w-full rounded-xl border border-zinc-700 bg-black p-2.5 text-xs text-white focus:border-red-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-500/40"
                >
                  Guardar RM
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Agregar Nuevo Ejercicio al Catálogo */}
      {isNewExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <button
              type="button"
              onClick={() => setIsNewExerciseModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-lg text-white mb-1 font-teko tracking-wide uppercase flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-red-500" />
              Nuevo Ejercicio al Catálogo
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Agrega un movimiento nuevo para que esté disponible en toda la plataforma.
            </p>

            <form onSubmit={handleSaveCustomExercise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  placeholder="Ej: Press Francés con Barra Z"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs sm:text-sm text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Categoría
                </label>
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                >
                  <option value="olympic">Levantamiento (Olímpico / Halterofilia)</option>
                  <option value="powerlifting">Fuerza (Sentadillas, Bancas, Musculación)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingEx}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95 border border-red-500/40 disabled:opacity-50"
                >
                  {isSavingEx ? 'Guardando...' : 'Crear Ejercicio'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewExerciseModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
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
