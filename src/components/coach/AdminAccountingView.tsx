import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { AccountingTransaction, PaymentMethod, TransactionType, AthleteDiscipline } from '../../types';
import {
  formatCOP,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  sendTransactionToGoogleSheets,
} from '../../services/accountingService';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  FileSpreadsheet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Shield,
  CreditCard,
  User,
  Tag,
  Trash2,
} from 'lucide-react';

export const AdminAccountingView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    gymSettings,
    updateGymSettings,
    athletes,
    plans,
  } = useGym();

  // Filter state
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | 'month' | 'last_month' | 'custom' | 'all'>('month');
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | AthleteDiscipline>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  // Google Sheets Config State
  const [showSheetsConfig, setShowSheetsConfig] = useState(false);
  const [sheetsUrlInput, setSheetsUrlInput] = useState(gymSettings?.googleSheetsAccountingWebhookUrl || '');
  const [isSavingSheetsUrl, setIsSavingSheetsUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sheetsStatusMsg, setSheetsStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manual Transaction Modal State
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [txAthleteName, setTxAthleteName] = useState('');
  const [txAthleteDoc, setTxAthleteDoc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txPlanName, setTxPlanName] = useState('Mensual Ilimitado Pro');
  const [txDiscipline, setTxDiscipline] = useState<AthleteDiscipline>('crossfit');
  const [txMethod, setTxMethod] = useState<PaymentMethod>('nequi');
  const [txType, setTxType] = useState<TransactionType>('membership_renewal');
  const [txNotes, setTxNotes] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Copy Google Apps Script code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSaveSheetsUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSheetsUrl(true);
    setSheetsStatusMsg(null);
    try {
      await updateGymSettings({
        googleSheetsAccountingWebhookUrl: sheetsUrlInput.trim(),
      });
      setSheetsStatusMsg({
        type: 'success',
        text: '¡URL de Google Sheets guardada con éxito!',
      });
      setTimeout(() => setSheetsStatusMsg(null), 3500);
    } catch (err: any) {
      setSheetsStatusMsg({
        type: 'error',
        text: err?.message || 'Error al guardar configuración.',
      });
    } finally {
      setIsSavingSheetsUrl(false);
    }
  };

  const handleTestSheetsConnection = async () => {
    const url = sheetsUrlInput.trim() || gymSettings?.googleSheetsAccountingWebhookUrl?.trim();
    if (!url) {
      alert('Ingresa primero la URL de tu Webhook de Google Apps Script.');
      return;
    }
    const testTx: AccountingTransaction = {
      id: `test-${Date.now()}`,
      date: todayStr,
      timestamp: new Date().toISOString(),
      athleteName: 'Prueba de Conexión',
      athleteDocumentId: '00000000',
      planName: 'Test Sistema',
      discipline: 'crossfit',
      amount: 1000,
      paymentMethod: 'otro',
      type: 'manual_income',
      approvedBy: 'Admin Test',
      notes: 'Prueba automática de webhook desde INDOMABLE App',
    };
    const res = await sendTransactionToGoogleSheets(testTx, url);
    if (res.success) {
      alert('✅ ¡Petición enviada a Google Sheets! Revisa si se creó la fila de prueba en tu hoja.');
    } else {
      alert(`❌ Error al conectar con Google Sheets: ${res.message}`);
    }
  };

  // Submit manual transaction
  const handleCreateManualTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(txAmount.replace(/\D/g, ''), 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Ingresa un valor monetario válido.');
      return;
    }

    setIsSubmittingTx(true);
    try {
      const newTx: AccountingTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: todayStr,
        timestamp: new Date().toISOString(),
        athleteName: txAthleteName.trim() || 'Venta Mostrador / General',
        athleteDocumentId: txAthleteDoc.trim() || undefined,
        planName: txPlanName.trim(),
        discipline: txDiscipline,
        amount: numAmount,
        paymentMethod: txMethod,
        type: txType,
        approvedBy: 'Administrador',
        notes: txNotes.trim() || undefined,
      };

      await addTransaction(newTx);
      setIsNewTxModalOpen(false);
      // Reset form
      setTxAthleteName('');
      setTxAthleteDoc('');
      setTxAmount('');
      setTxNotes('');
    } catch (err: any) {
      alert(`Error al registrar transacción: ${err?.message}`);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Date Filtering Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return transactions.filter((t) => {
      // 1. Period filter
      if (filterPeriod === 'today') {
        if (t.date !== todayStr) return false;
      } else if (filterPeriod === '7days') {
        const tDate = new Date(t.date);
        const diffDays = (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (filterPeriod === 'month') {
        const [y, m] = t.date.split('-').map(Number);
        if (y !== currentYear || (m - 1) !== currentMonth) return false;
      } else if (filterPeriod === 'last_month') {
        const [y, m] = t.date.split('-').map(Number);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (y !== prevYear || (m - 1) !== prevMonth) return false;
      } else if (filterPeriod === 'custom') {
        if (t.date < customStartDate || t.date > customEndDate) return false;
      }

      // 2. Discipline filter
      if (disciplineFilter !== 'all' && t.discipline !== disciplineFilter) {
        return false;
      }

      // 3. Payment Method filter
      if (methodFilter !== 'all' && t.paymentMethod !== methodFilter) {
        return false;
      }

      // 4. Search Query (athlete, document, plan, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = t.athleteName?.toLowerCase().includes(q);
        const matchDoc = t.athleteDocumentId?.toLowerCase().includes(q);
        const matchPlan = t.planName?.toLowerCase().includes(q);
        const matchNotes = t.notes?.toLowerCase().includes(q);
        if (!matchName && !matchDoc && !matchPlan && !matchNotes) return false;
      }

      return true;
    });
  }, [transactions, filterPeriod, todayStr, customStartDate, customEndDate, disciplineFilter, methodFilter, searchQuery]);

  // Financial Metrics
  const stats = useMemo(() => {
    const totalIncome = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const count = filteredTransactions.length;
    const averageTicket = count > 0 ? Math.round(totalIncome / count) : 0;

    // Métricas por disciplina
    const crossfitIncome = filteredTransactions
      .filter((t) => t.discipline === 'crossfit')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const musculacionIncome = filteredTransactions
      .filter((t) => t.discipline === 'musculacion')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const personalizadoIncome = filteredTransactions
      .filter((t) => t.discipline === 'personalizado')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
      totalIncome,
      count,
      averageTicket,
      crossfitIncome,
      musculacionIncome,
      personalizadoIncome,
    };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                <DollarSign className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                ADMINISTRACIÓN & FINANZAS
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              PANEL DE CONTABILIDAD & GOOGLE SHEETS
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Monitorea los ingresos del box en tiempo real. Cada renovación o aprobación alimenta automáticamente este panel y tu hoja de cálculo en la nube.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSheetsConfig(!showSheetsConfig)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 hover:text-white transition shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewTxModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/60"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheets Config Drawer / Card */}
      {showSheetsConfig && (
        <div className="rounded-2xl border border-emerald-800/60 bg-zinc-950 p-5 shadow-2xl space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                  Sincronización Automática con Google Sheets
                </h4>
                <p className="text-xs text-zinc-400">
                  Conecta tu hoja de Google Drive para registrar cada pago en una fila sin digitar nada.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSheetsConfig(false)}
              className="text-zinc-500 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveSheetsUrl} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                URL del Webhook de Google Apps Script (Aplicación Web)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetsUrlInput}
                  onChange={(e) => setSheetsUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={isSavingSheetsUrl}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {isSavingSheetsUrl ? 'Guardando...' : 'Guardar URL'}
                </button>
                <button
                  type="button"
                  onClick={handleTestSheetsConnection}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-emerald-400 transition"
                >
                  Probar Conexión
                </button>
              </div>
            </div>

            {sheetsStatusMsg && (
              <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                sheetsStatusMsg.type === 'success' ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300' : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}>
                {sheetsStatusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                <span>{sheetsStatusMsg.text}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-zinc-300">
                <p className="font-bold text-white mb-0.5">¿No tienes el código de Apps Script aún?</p>
                <p className="text-[11px] text-zinc-400">
                  Copia el código listo para tu hoja de cálculo y pégalo en Extensiones &gt; Apps Script.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition shrink-0"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? '¡Código Copiado!' : 'Copiar Código de Apps Script'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Recaudado en el Periodo */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Ingresos en Periodo
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
            {formatCOP(stats.totalIncome)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span className="font-bold text-emerald-400">{stats.count}</span>
            <span>transacciones aprobadas</span>
          </div>
        </div>

        {/* Card 2: CrossFit */}
        <div className="rounded-2xl border border-red-900/30 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
              CrossFit
            </span>
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
            {formatCOP(stats.crossfitIncome)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Planes grupales & WODs</p>
        </div>

        {/* Card 3: Musculación */}
        <div className="rounded-2xl border border-amber-900/30 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Musculación
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
            {formatCOP(stats.musculacionIncome)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Área libre & máquinas</p>
        </div>

        {/* Card 4: Personalizado */}
        <div className="rounded-2xl border border-purple-900/30 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Personalizado
            </span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
            {formatCOP(stats.personalizadoIncome)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">1 a 1 & VIP</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl space-y-3">
        {/* Period Selector */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setFilterPeriod('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === 'today'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('7days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === '7days'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Últimos 7 Días
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === 'month'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Este Mes
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === 'last_month'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Mes Anterior
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === 'custom'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Por Fechas Específicas
            </button>
            <button
              type="button"
              onClick={() => setFilterPeriod('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                filterPeriod === 'all'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Todo el Historial
            </button>
          </div>

          <span className="text-xs text-zinc-500 font-mono">
            {filteredTransactions.length} registros
          </span>
        </div>

        {/* Custom Date Range Selector (Visible only if 'custom' is active) */}
        {filterPeriod === 'custom' && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex-wrap animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Desde:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Hasta:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Search and Secondary Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, cédula, plan o nota..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todas las Disciplinas</option>
              <option value="crossfit">CrossFit</option>
              <option value="musculacion">Musculación</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">Todos los Medios de Pago</option>
              <option value="nequi">Nequi</option>
              <option value="daviplata">Daviplata</option>
              <option value="efectivo">Efectivo</option>
              <option value="pse">PSE</option>
              <option value="wompi">Wompi</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="breb">Bre-B</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Movimientos Registrados ({filteredTransactions.length})</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-3">Fecha & Hora</th>
                <th className="p-3">Atleta</th>
                <th className="p-3">Plan / Concepto</th>
                <th className="p-3">Modalidad</th>
                <th className="p-3">Método</th>
                <th className="p-3">Valor Pagado</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    No se encontraron transacciones registradas para este periodo o criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/40 transition">
                    <td className="p-3 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                      <div>{tx.date}</div>
                      <div className="text-[10px] text-zinc-500">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-white">{tx.athleteName}</div>
                      {tx.athleteDocumentId && (
                        <div className="text-[10px] font-mono text-zinc-400">
                          CC: {tx.athleteDocumentId}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="text-zinc-200 font-semibold">{tx.planName || 'Inscripción'}</div>
                      <div className="text-[10px] text-zinc-500">
                        {tx.type === 'membership_new'
                          ? 'Nueva Inscripción'
                          : tx.type === 'membership_renewal'
                          ? 'Renovación de Membresía'
                          : tx.type === 'manual_expense'
                          ? 'Gasto Operativo'
                          : 'Ingreso Manual / Producto'}
                      </div>
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.discipline === 'crossfit'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : tx.discipline === 'musculacion'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {tx.discipline || 'CrossFit'}
                      </span>
                    </td>

                    <td className="p-3 uppercase text-[11px] font-bold font-mono text-zinc-300">
                      {tx.paymentMethod}
                    </td>

                    <td className="p-3 font-bold font-mono text-emerald-400 text-sm whitespace-nowrap">
                      {formatCOP(tx.amount)}
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar la transacción de ${tx.athleteName} por ${formatCOP(tx.amount)}?`)) {
                            deleteTransaction(tx.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                        title="Eliminar transacción contable"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Income Modal */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl text-zinc-100 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Registrar Ingreso Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTxModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualTransaction} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Atleta / Cliente (Opcional)
                </label>
                <input
                  type="text"
                  value={txAthleteName}
                  onChange={(e) => setTxAthleteName(e.target.value)}
                  placeholder="Ej: Laura Gómez o Venta Directa"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Cédula / Documento (Opcional)
                </label>
                <input
                  type="text"
                  value={txAthleteDoc}
                  onChange={(e) => setTxAthleteDoc(e.target.value)}
                  placeholder="Ej: 1020304050"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Valor Recibido ($ COP) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    placeholder="Ej: 160000"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="nequi">Nequi</option>
                    <option value="daviplata">Daviplata</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="pse">PSE</option>
                    <option value="wompi">Wompi</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="breb">Bre-B</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Disciplina
                  </label>
                  <select
                    value={txDiscipline}
                    onChange={(e) => setTxDiscipline(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="crossfit">CrossFit</option>
                    <option value="musculacion">Musculación</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Tipo de Ingreso
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="membership_renewal">Renovación Membresía</option>
                    <option value="membership_new">Nueva Inscripción</option>
                    <option value="manual_income">Venta Producto / Bebida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  value={txPlanName}
                  onChange={(e) => setTxPlanName(e.target.value)}
                  placeholder="Ej: Mensualidad, Tiquetera, Hidratación..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Notas de Auditoría (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  placeholder="Comprobante # / Observaciones..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-emerald-950/60 disabled:opacity-50"
                >
                  {isSubmittingTx ? 'Guardando...' : 'Guardar y Sincronizar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold transition"
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
