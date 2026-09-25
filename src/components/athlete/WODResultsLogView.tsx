import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { WODResultLog, WODType } from '../../types';
import {
  Timer,
  Trophy,
  Calendar,
  Trash2,
  Filter,
  Clock,
  Flame,
  Plus,
  Lock,
  Medal,
  Award,
  User,
  Users,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const WODResultsLogView: React.FC<{ defaultWodTitle?: string }> = ({
  defaultWodTitle,
}) => {
  const {
    wodLogs,
    saveWodLog,
    deleteWodLog,
    currentAthleteId,
    currentAthlete,
    selectedDate,
    setSelectedDate,
    currentWod,
    wods,
    role,
  } = useGym();

  // Tab: Leaderboard vs My History
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'history'>('leaderboard');
  const [filterDivision, setFilterDivision] = useState<'ALL' | 'RX' | 'SCALED'>('ALL');
  const [leaderboardDate, setLeaderboardDate] = useState<string>(selectedDate || new Date().toISOString().split('T')[0]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active WOD for selected date
  const wodForDate = useMemo(() => {
    return wods.find((w) => w.date === leaderboardDate) || (leaderboardDate === selectedDate ? currentWod : undefined);
  }, [wods, leaderboardDate, selectedDate, currentWod]);

  const lockedWodTitle = wodForDate?.title || defaultWodTitle || 'WOD DEL DÍA';

  // Form State
  const [formDate, setFormDate] = useState(leaderboardDate);
  const [formType, setFormType] = useState<WODType>(wodForDate?.wodType || 'FOR_TIME');
  const [formDivision, setFormDivision] = useState<'RX' | 'SCALED'>('RX');
  const [formMinutes, setFormMinutes] = useState('12');
  const [formSeconds, setFormSeconds] = useState('45');
  const [formRounds, setFormRounds] = useState('5');
  const [formReps, setFormReps] = useState('12');
  const [formLoadWeight, setFormLoadWeight] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // 1. Leaderboard Scores for the selected date WOD
  const leaderboardScores = useMemo(() => {
    // Filter all logs matching the selected date or WOD title
    const dateLogs = wodLogs.filter((l) => {
      const matchDate = l.wodDate === leaderboardDate;
      const matchDivision = filterDivision === 'ALL' || l.division === filterDivision;
      return matchDate && matchDivision;
    });

    // Deduplicate per athlete (keep best result per athlete if multiple)
    const byAthlete = new Map<string, WODResultLog>();
    dateLogs.forEach((log) => {
      const existing = byAthlete.get(log.athleteId);
      if (!existing) {
        byAthlete.set(log.athleteId, log);
      } else {
        // Compare to keep best
        if (log.wodType === 'FOR_TIME') {
          if (log.timeSeconds && existing.timeSeconds && log.timeSeconds < existing.timeSeconds) {
            byAthlete.set(log.athleteId, log);
          }
        } else if (log.wodType === 'AMRAP') {
          const scoreNew = (log.rounds || 0) * 1000 + (log.reps || 0);
          const scoreOld = (existing.rounds || 0) * 1000 + (existing.reps || 0);
          if (scoreNew > scoreOld) {
            byAthlete.set(log.athleteId, log);
          }
        } else if (log.wodType === 'STRENGTH') {
          if ((log.loadWeight || 0) > (existing.loadWeight || 0)) {
            byAthlete.set(log.athleteId, log);
          }
        }
      }
    });

    const uniqueLogs = Array.from(byAthlete.values());

    // Sort according to CrossFit rules: RX always above SCALED if "ALL" is selected, then by score
    uniqueLogs.sort((a, b) => {
      // Prioritize RX over SCALED if comparing across divisions
      if (filterDivision === 'ALL' && a.division !== b.division) {
        return a.division === 'RX' ? -1 : 1;
      }

      // If FOR_TIME: lowest seconds first
      if (a.wodType === 'FOR_TIME' && b.wodType === 'FOR_TIME') {
        if (a.timeSeconds && b.timeSeconds) {
          return a.timeSeconds - b.timeSeconds;
        }
      }

      // If AMRAP: highest rounds + reps first
      if (a.wodType === 'AMRAP' && b.wodType === 'AMRAP') {
        const scoreA = (a.rounds || 0) * 1000 + (a.reps || 0);
        const scoreB = (b.rounds || 0) * 1000 + (b.reps || 0);
        return scoreB - scoreA;
      }

      // If STRENGTH: highest weight first
      if (a.wodType === 'STRENGTH' && b.wodType === 'STRENGTH') {
        return (b.loadWeight || 0) - (a.loadWeight || 0);
      }

      return (b.wodDate || '').localeCompare(a.wodDate || '');
    });

    return uniqueLogs;
  }, [wodLogs, leaderboardDate, filterDivision]);

  // Athlete's personal logs across all dates
  const myPersonalLogs = useMemo(() => {
    return wodLogs
      .filter((l) => l.athleteId === currentAthleteId)
      .sort((a, b) => (b.wodDate || '').localeCompare(a.wodDate || ''));
  }, [wodLogs, currentAthleteId]);

  // Has current user posted score for this leaderboard date?
  const myScoreForDate = useMemo(() => {
    return leaderboardScores.find((l) => l.athleteId === currentAthleteId);
  }, [leaderboardScores, currentAthleteId]);

  const handleOpenModal = () => {
    setFormDate(leaderboardDate);
    const targetWod = wods.find((w) => w.date === leaderboardDate) || wodForDate;
    setFormType(targetWod?.wodType || 'FOR_TIME');
    setFormDivision('RX');
    setFormMinutes('');
    setFormSeconds('');
    setFormRounds('');
    setFormReps('');
    setFormLoadWeight('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let resultValue = '';
    let timeSeconds: number | undefined;

    if (formType === 'FOR_TIME') {
      const mins = parseInt(formMinutes || '0', 10);
      const secs = parseInt(formSeconds || '0', 10);
      timeSeconds = mins * 60 + secs;
      const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
      resultValue = `${mins}:${formattedSecs} min`;
    } else if (formType === 'AMRAP') {
      const r = formRounds || '0';
      const rep = formReps || '0';
      resultValue = `${r} rondas + ${rep} reps`;
    } else if (formType === 'EMOM' || formType === 'TABATA') {
      resultValue = formRounds ? `${formRounds} rondas completadas` : 'Completado';
    } else if (formType === 'STRENGTH') {
      resultValue = formLoadWeight ? `${formLoadWeight} kg / lbs` : 'Peso máximo logrado';
    } else {
      resultValue = formMinutes ? `${formMinutes} min` : 'Completado';
    }

    saveWodLog({
      athleteId: currentAthleteId,
      athleteName: currentAthlete?.name || 'Atleta Indomable',
      wodDate: formDate,
      wodTitle: lockedWodTitle,
      wodType: formType,
      division: formDivision,
      resultValue,
      timeSeconds,
      rounds: formRounds ? parseInt(formRounds, 10) : undefined,
      reps: formReps ? parseInt(formReps, 10) : undefined,
      loadWeight: formLoadWeight ? parseFloat(formLoadWeight) : undefined,
      notes: formNotes.trim(),
    });

    setIsModalOpen(false);
  };

  return (
    <div id="section-wod-logs" className="space-y-5 animate-fadeIn">
      {/* 1. Header & Navigation Switcher in Crimson & Black */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
                <Trophy className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                COMUNIDAD & RENDIMIENTO
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              PIZARRA & TABLA DE POSICIONES
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Compite sanamente, mide tus tiempos y celebra el progreso de todos los atletas en el box.
            </p>
          </div>

          <button
            onClick={handleOpenModal}
            id="btn-add-wod-score"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider shadow-md shadow-red-950/60 transition active:scale-95 border border-red-700/50 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Mi Score</span>
          </button>
        </div>

        {/* Tab Switcher: Leaderboard vs My History */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-850">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'leaderboard'
                ? 'bg-red-800/90 text-white border border-red-700/60 shadow-md shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Tabla de Posiciones (WOD)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono">
              {leaderboardScores.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-red-800/90 text-white border border-red-700/60 shadow-md shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Mis Registros Personales</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono">
              {myPersonalLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Leaderboard View */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar: Date Selector & Division Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/80 border border-zinc-800/80 p-3.5 rounded-2xl">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-xs font-bold text-zinc-300 hidden sm:inline">Fecha del WOD:</span>
              <input
                type="date"
                value={leaderboardDate}
                onChange={(e) => setLeaderboardDate(e.target.value)}
                className="rounded-xl border border-zinc-750 bg-black px-3 py-1.5 text-xs text-white focus:border-red-600 focus:outline-none font-semibold"
              />
              {leaderboardDate !== (selectedDate || new Date().toISOString().split('T')[0]) && (
                <button
                  type="button"
                  onClick={() => setLeaderboardDate(selectedDate || new Date().toISOString().split('T')[0])}
                  className="text-[11px] text-red-400 hover:underline font-semibold"
                >
                  Volver a Hoy
                </button>
              )}
            </div>

            {/* Division Filter */}
            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-xs text-zinc-400 mr-1 hidden sm:inline">División:</span>
              <div className="flex bg-black p-1 rounded-xl border border-zinc-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterDivision('ALL')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterDivision === 'ALL'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDivision('RX')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterDivision === 'RX'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  RX
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDivision('SCALED')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterDivision === 'SCALED'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Scaled
                </button>
              </div>
            </div>
          </div>

          {/* WOD Title & Header Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900/60 to-zinc-950 border border-red-900/40 p-4 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 block">
                {wodForDate?.wodType?.replace('_', ' ') || 'WOD'} • {leaderboardDate}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white font-['Teko'] tracking-wide">
                {lockedWodTitle}
              </h3>
            </div>

            {myScoreForDate ? (
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Tu Marca</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  {myScoreForDate.resultValue} ({myScoreForDate.division})
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenModal}
                className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-950/40 border border-red-800/40 px-3 py-1.5 rounded-xl transition"
              >
                <span>Aún no registras tu score</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Leaderboard Table / Cards */}
          <div className="space-y-2.5">
            {leaderboardScores.map((log, index) => {
              const isMe = log.athleteId === currentAthleteId;
              const rank = index + 1;

              // Podiums
              const isGold = rank === 1;
              const isSilver = rank === 2;
              const isBronze = rank === 3;

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-3.5 sm:p-4 transition-all flex items-center justify-between gap-3 ${
                    isMe
                      ? 'bg-zinc-900/95 border-red-600/70 shadow-lg shadow-red-950/30 ring-1 ring-red-600/50'
                      : isGold
                      ? 'bg-gradient-to-r from-amber-950/30 via-zinc-950 to-zinc-950 border-amber-500/50 shadow-md'
                      : isSilver
                      ? 'bg-zinc-950 border-zinc-700/80 shadow-sm'
                      : isBronze
                      ? 'bg-zinc-950 border-amber-800/40 shadow-sm'
                      : 'bg-zinc-950/90 border-zinc-850 hover:border-zinc-750'
                  }`}
                >
                  {/* Left: Rank & Athlete Info */}
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Rank Badge */}
                    <div className="shrink-0 flex items-center justify-center">
                      {isGold ? (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-sm font-black text-sm">
                          🥇
                        </div>
                      ) : isSilver ? (
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-500 flex items-center justify-center text-zinc-200 shadow-sm font-black text-sm">
                          🥈
                        </div>
                      ) : isBronze ? (
                        <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/60 flex items-center justify-center text-amber-500 shadow-sm font-black text-sm">
                          🥉
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-mono font-black text-xs">
                          #{rank}
                        </div>
                      )}
                    </div>

                    {/* Athlete Name & Tags */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-white truncate">
                          {log.athleteName}
                        </span>
                        {isMe && (
                          <span className="rounded-md bg-red-600 px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider text-white">
                            TÚ
                          </span>
                        )}
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider border ${
                            log.division === 'RX'
                              ? 'bg-red-600/20 text-red-400 border-red-600/40'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {log.division}
                        </span>
                      </div>

                      {log.notes && (
                        <p className="text-[11px] text-zinc-400 truncate max-w-xs sm:max-w-md italic mt-0.5">
                          "{log.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Score & Actions */}
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <div
                        className={`text-2xl sm:text-3xl font-black font-['Teko'] leading-none ${
                          isGold ? 'text-amber-400' : isMe ? 'text-red-400' : 'text-white'
                        }`}
                      >
                        {log.resultValue}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {log.wodType.replace('_', ' ')}
                      </div>
                    </div>

                    {(isMe || role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => deleteWodLog(log.id)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 transition rounded-lg hover:bg-zinc-900"
                        title="Eliminar score"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {leaderboardScores.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 sm:p-12 text-center text-zinc-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Aún no hay scores registrados para el {leaderboardDate}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                    ¡Sé el primero en subir tu resultado al leaderboard del box y marca el ritmo del entrenamiento!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 border border-red-700/50 text-white px-4 py-2 text-xs font-bold shadow-md shadow-red-950/50 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Registrar Mi Score Ahora</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. My Personal History View */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800/80 p-3.5 rounded-2xl">
            <span className="text-xs text-zinc-400 font-semibold">
              Historial de entrenamientos registrados por ti ({myPersonalLogs.length})
            </span>
            <button
              onClick={handleOpenModal}
              className="text-xs text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Registro</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myPersonalLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-4 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                            log.division === 'RX'
                              ? 'bg-red-600/20 text-red-400 border-red-600/30'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                          }`}
                        >
                          {log.division}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-semibold">
                          {log.wodType.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                        {log.wodTitle}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-black font-['Teko'] text-red-500 leading-none">
                        {log.resultValue}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">{log.wodDate}</div>
                    </div>
                  </div>

                  {log.notes && (
                    <p className="text-xs text-zinc-300 bg-black/60 p-2.5 rounded-xl border border-zinc-800 mt-2.5 leading-relaxed italic">
                      "{log.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-850 flex justify-between items-center text-[11px] text-zinc-500">
                  <span>Atleta: {log.athleteName}</span>
                  <button
                    onClick={() => deleteWodLog(log.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {myPersonalLogs.length === 0 && (
              <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-950/40 p-8 text-center text-zinc-400">
                <Timer className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                <p className="font-semibold text-zinc-300">No tienes registros personales aún</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Registra tu tiempo o rondas para guardar tu evolución personal.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100">
            <h3 className="font-extrabold text-lg text-white mb-1">Registrar Score de WOD</h3>
            <p className="text-xs text-zinc-400 mb-4">
              Tu marca aparecerá en la Tabla de Posiciones comunitaria del box.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Modalidad</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as WODType)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="FOR_TIME">For Time (Por Tiempo)</option>
                    <option value="AMRAP">AMRAP (Rondas + Reps)</option>
                    <option value="EMOM">EMOM (Por Minuto)</option>
                    <option value="TABATA">TABATA</option>
                    <option value="STRENGTH">Fuerza / Heavy Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1 flex items-center justify-between">
                  <span>Título del WOD</span>
                  <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3 text-red-500" />
                    WOD del Box
                  </span>
                </label>
                <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5 flex items-center justify-between shadow-inner">
                  <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                    {lockedWodTitle}
                  </span>
                  <span className="rounded bg-red-950/80 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-400 border border-red-800/50">
                    INDOMABLE
                  </span>
                </div>
              </div>

              {/* Division Selector: RX vs Scaled */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">División</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDivision('RX')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      formDivision === 'RX'
                        ? 'bg-red-600 text-white border-red-500 font-extrabold shadow-sm'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    RX (Oficial)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDivision('SCALED')}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      formDivision === 'SCALED'
                        ? 'bg-zinc-800 text-white border-zinc-700 font-extrabold shadow-sm'
                        : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    SCALED (Adaptado)
                  </button>
                </div>
              </div>

              {/* Conditional Result Inputs based on modality */}
              {formType === 'FOR_TIME' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tiempo Final
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-black p-2 rounded-xl border border-zinc-700">
                      <input
                        type="number"
                        min="0"
                        max="120"
                        placeholder="Minutos"
                        required
                        value={formMinutes}
                        onChange={(e) => setFormMinutes(e.target.value)}
                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold">MIN</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black p-2 rounded-xl border border-zinc-700">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Segundos"
                        required
                        value={formSeconds}
                        onChange={(e) => setFormSeconds(e.target.value)}
                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold">SEG</span>
                    </div>
                  </div>
                </div>
              )}

              {formType === 'AMRAP' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Rondas y Repeticiones
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5 bg-black p-2 rounded-xl border border-zinc-700">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rondas"
                        required
                        value={formRounds}
                        onChange={(e) => setFormRounds(e.target.value)}
                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold">RONDAS</span>
                    </div>

                    <div className="flex items-center gap-1.5 bg-black p-2 rounded-xl border border-zinc-700">
                      <input
                        type="number"
                        min="0"
                        placeholder="+ Reps adicionales"
                        value={formReps}
                        onChange={(e) => setFormReps(e.target.value)}
                        className="w-full bg-transparent text-xs text-white focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 font-bold">REPS</span>
                    </div>
                  </div>
                </div>
              )}

              {(formType === 'EMOM' || formType === 'TABATA') && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Rondas Completadas
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 16"
                    value={formRounds}
                    onChange={(e) => setFormRounds(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              {formType === 'STRENGTH' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Carga o Peso Máximo Levantado
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ej: 110"
                    required
                    value={formLoadWeight}
                    onChange={(e) => setFormLoadWeight(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Notas personales / Estrategia (opcional)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ej: Dividí los Wall Balls en sets de 15, no fallé en el Clean..."
                  className="w-full rounded-xl border border-zinc-700 bg-black p-2 text-xs text-white focus:border-red-600 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-800 hover:bg-red-700 border border-red-700/50 py-2.5 text-xs font-bold text-white shadow-md shadow-red-950/60 transition active:scale-95"
                >
                  Guardar Score
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
    </div>
  );
};
