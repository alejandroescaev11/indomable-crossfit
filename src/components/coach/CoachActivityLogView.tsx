import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { ActivityLogRecord } from '../../types';
import {
  History,
  Search,
  Trash2,
  Calendar,
  CheckCircle2,
  UserPlus,
  Shield,
  Flame,
  Clock,
  FileText,
  User,
  X,
} from 'lucide-react';

type FilterCategory = 'ALL' | 'MEMBERSHIP' | 'BOOKING' | 'ATHLETE' | 'SECURITY' | 'WOD';
type TimeFilter = 'all' | 'today' | 'week';

export const CoachActivityLogView: React.FC = () => {
  const { activityLogs, clearActivityLogs, purgeActivityLogs } = useGym();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilter>('all');
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const handlePurge = (range: 'day' | 'week' | 'month' | 'all') => {
    if (purgeActivityLogs) {
      purgeActivityLogs(range);
    } else {
      clearActivityLogs();
    }
    setShowPurgeModal(false);
    const msg =
      range === 'all'
        ? 'Historial de auditoría vaciado por completo.'
        : range === 'day'
        ? 'Se han depurado los registros con más de 24 horas.'
        : range === 'week'
        ? 'Se han depurado los registros con más de 7 días.'
        : 'Se han depurado los registros con más de 30 días.';
    setPurgeFeedback(msg);
    setTimeout(() => setPurgeFeedback(null), 4000);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = activityLogs.length;
    const memberships = activityLogs.filter((l) => l.category === 'MEMBERSHIP').length;
    const bookings = activityLogs.filter((l) => l.category === 'BOOKING').length;
    const athletes = activityLogs.filter((l) => l.category === 'ATHLETE').length;
    const security = activityLogs.filter((l) => l.category === 'SECURITY').length;
    const wods = activityLogs.filter((l) => l.category === 'WOD').length;
    return { total, memberships, bookings, athletes, security, wods };
  }, [activityLogs]);

  // Filtered list
  const filteredLogs = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString();

    return activityLogs.filter((log) => {
      // 1. Category filter
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) {
        return false;
      }

      // 2. Time filter
      if (selectedTimeFilter === 'today') {
        if (!log.timestamp.startsWith(todayStr)) return false;
      } else if (selectedTimeFilter === 'week') {
        if (log.timestamp < sevenDaysAgoStr) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inAction = log.action.toLowerCase().includes(q);
        const inDesc = log.description.toLowerCase().includes(q);
        const inActor = log.actor.toLowerCase().includes(q);
        const inTarget = log.target ? log.target.toLowerCase().includes(q) : false;
        return inAction || inDesc || inActor || inTarget;
      }

      return true;
    });
  }, [activityLogs, selectedCategory, selectedTimeFilter, searchQuery]);

  // Format relative timestamp in friendly Spanish
  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);

      const timePart = date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (diffSec < 60) {
        return 'Hace unos momentos';
      }
      if (diffMin < 60) {
        return `Hace ${diffMin} min (${timePart})`;
      }
      if (diffHours < 24 && date.getDate() === now.getDate()) {
        return `Hoy a las ${timePart}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
        return `Ayer a las ${timePart}`;
      }

      return `${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} • ${timePart}`;
    } catch {
      return isoString;
    }
  };

  const getCategoryConfig = (category: ActivityLogRecord['category']) => {
    switch (category) {
      case 'MEMBERSHIP':
        return {
          label: 'Membresía',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          cardBorder: 'hover:border-emerald-500/40',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        };
      case 'BOOKING':
        return {
          label: 'Reserva',
          badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          cardBorder: 'hover:border-sky-500/40',
          icon: <Calendar className="w-4 h-4 text-sky-400" />,
        };
      case 'ATHLETE':
        return {
          label: 'Atleta',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          cardBorder: 'hover:border-amber-500/40',
          icon: <UserPlus className="w-4 h-4 text-amber-400" />,
        };
      case 'SECURITY':
        return {
          label: 'Seguridad',
          badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          cardBorder: 'hover:border-purple-500/40',
          icon: <Shield className="w-4 h-4 text-purple-400" />,
        };
      case 'WOD':
        return {
          label: 'WOD',
          badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
          cardBorder: 'hover:border-red-500/40',
          icon: <Flame className="w-4 h-4 text-red-400" />,
        };
      default:
        return {
          label: 'General',
          badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
          cardBorder: 'hover:border-zinc-700',
          icon: <FileText className="w-4 h-4 text-zinc-400" />,
        };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-600/15 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-['Teko'] tracking-wide text-white uppercase leading-none">
                HISTORIAL & AUDITORÍA EN TIEMPO REAL
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Trazabilidad completa de reservas, pagos, activaciones, seguridad y publicaciones en Firestore.
            </p>
          </div>
        </div>

        {activityLogs.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 border border-zinc-800 hover:border-red-800/50 px-3 py-2 text-xs font-bold text-zinc-400 hover:text-red-400 transition cursor-pointer"
              title="Depurar historial de auditoría por período"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Depurar</span>
            </button>
          </div>
        )}
      </div>

      {purgeFeedback && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{purgeFeedback}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block truncate">Total Acciones</span>
            <span className="text-xl font-black font-['Teko'] text-white tracking-wide">{stats.total}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block truncate">Membresías</span>
            <span className="text-xl font-black font-['Teko'] text-emerald-400 tracking-wide">{stats.memberships}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block truncate">Reservas</span>
            <span className="text-xl font-black font-['Teko'] text-sky-400 tracking-wide">{stats.bookings}</span>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800/90 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block truncate">Seguridad</span>
            <span className="text-xl font-black font-['Teko'] text-purple-400 tracking-wide">{stats.security}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
        {/* Search input and time filter */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula, detalle o acción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 self-stretch sm:self-auto shrink-0 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedTimeFilter === 'all'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeFilter('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedTimeFilter === 'today'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setSelectedTimeFilter('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                selectedTimeFilter === 'week'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              7 Días
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'ALL'
                ? 'bg-zinc-100 text-zinc-950 font-black'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            Todas ({stats.total})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('MEMBERSHIP')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'MEMBERSHIP'
                ? 'bg-emerald-600 text-white font-black'
                : 'bg-zinc-950 text-emerald-400 hover:bg-zinc-900 border border-emerald-900/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Membresías ({stats.memberships})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('BOOKING')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'BOOKING'
                ? 'bg-sky-600 text-white font-black'
                : 'bg-zinc-950 text-sky-400 hover:bg-zinc-900 border border-sky-900/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Reservas ({stats.bookings})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('ATHLETE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'ATHLETE'
                ? 'bg-amber-600 text-white font-black'
                : 'bg-zinc-950 text-amber-400 hover:bg-zinc-900 border border-amber-900/40'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Atletas ({stats.athletes})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('SECURITY')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'SECURITY'
                ? 'bg-purple-600 text-white font-black'
                : 'bg-zinc-950 text-purple-400 hover:bg-zinc-900 border border-purple-900/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Seguridad ({stats.security})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('WOD')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider whitespace-nowrap transition ${
              selectedCategory === 'WOD'
                ? 'bg-red-600 text-white font-black'
                : 'bg-zinc-950 text-red-400 hover:bg-zinc-900 border border-red-900/40'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>WODs ({stats.wods})</span>
          </button>
        </div>
      </div>

      {/* Activity Logs Timeline / Feed */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
            <History className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {activityLogs.length === 0
              ? 'No hay actividades registradas aún'
              : 'No se encontraron actividades con los filtros actuales'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {activityLogs.length === 0
              ? 'Las acciones como registros de atletas, reservas, pagos, renovaciones de membresía y cambios de PIN se registrarán aquí automáticamente en tiempo real.'
              : 'Intenta cambiar el término de búsqueda o selecciona otra categoría de filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredLogs.map((log) => {
            const catConfig = getCategoryConfig(log.category);
            return (
              <div
                key={log.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 ${catConfig.cardBorder} transition-all duration-200 group`}
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 w-8 h-8 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    {catConfig.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                        {log.action}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${catConfig.badgeClass}`}
                      >
                        {catConfig.label}
                      </span>
                      {log.target && (
                        <span className="rounded bg-zinc-950 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 font-semibold">
                          Ref: {log.target}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed break-words">
                      {log.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: Actor and Timestamp */}
                <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t border-zinc-800/50 sm:border-0 text-right">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                    <User className="w-3 h-3 text-zinc-500" />
                    <span>{log.actor}</span>
                  </div>
                  <div
                    title={log.timestamp}
                    className="flex items-center gap-1 text-[10px] font-mono text-zinc-500"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Depuración de Historial de Auditoría */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl relative text-zinc-100 space-y-4">
            <button
              type="button"
              onClick={() => setShowPurgeModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">Depurar Historial de Auditoría</h3>
                <p className="text-xs text-zinc-400">Elimina registros antiguos de actividad del sistema</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300">
              Total de registros en bitácora: <strong className="text-white">{activityLogs.length}</strong>. Los eventos anteriores al período elegido se borrarán de Firestore y de este dispositivo.
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handlePurge('day')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    Más de 24 horas (1 día)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Elimina eventos anteriores a las últimas 24 horas y conserva los de hoy
                  </p>
                </div>
                <Clock className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => handlePurge('week')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    Más de 7 días (1 semana)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Elimina eventos ocurridos hace más de una semana
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => handlePurge('month')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-red-600/50 text-left transition group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-red-400 transition">
                    Más de 30 días (1 mes)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Elimina eventos con más de un mes de antigüedad
                  </p>
                </div>
                <Calendar className="w-4 h-4 text-zinc-500 group-hover:text-red-400 shrink-0 ml-2" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('¿Estás seguro de vaciar TODO el historial de auditoría? Esta acción es irreversible.')) {
                    handlePurge('all');
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-left transition group cursor-pointer"
              >
                <div>
                  <p className="text-xs font-bold text-red-300 group-hover:text-red-200 transition">
                    Vaciar todo el historial
                  </p>
                  <p className="text-[11px] text-red-400/80">
                    Elimina el 100% de los registros de auditoría
                  </p>
                </div>
                <Trash2 className="w-4 h-4 text-red-400 shrink-0 ml-2" />
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-850">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-xs font-bold text-zinc-300 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
