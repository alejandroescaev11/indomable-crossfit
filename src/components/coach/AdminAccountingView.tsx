import React, { useState, useMemo } from 'react';
import { useGym } from '../../context/GymContext';
import { AccountingTransaction, PaymentMethod, TransactionType, AthleteDiscipline, AthleteProfile } from '../../types';
import {
  formatCOP,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  sendTransactionToGoogleSheets,
  exportTransactionsToCSV,
  exportUsersToCSV,
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
  Download,
  Users,
  BarChart3,
  Dumbbell,
  Activity,
  AlertTriangle,
  XCircle,
  Phone,
  Mail,
  Flame,
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

  // Active view tab: 'finances' | 'users'
  const [activeTab, setActiveTab] = useState<'finances' | 'users'>('finances');

  // Filter state for transactions
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | 'month' | 'last_month' | 'custom' | 'all'>('month');
  const todayStr = new Date().toISOString().split('T')[0];
  const [customStartDate, setCustomStartDate] = useState(todayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [disciplineFilter, setDisciplineFilter] = useState<'all' | AthleteDiscipline>('all');
  const [methodFilter, setMethodFilter] = useState<'all' | PaymentMethod>('all');

  // Filter state for users tab
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userDisciplineFilter, setUserDisciplineFilter] = useState<'all' | AthleteDiscipline>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'pending'>('all');

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
      alert('✅ ¡Petición enviada a Google Sheets! Revisa si se actualizaron las pestañas "Contabilidad" y "Usuarios_y_Pagos" en tu hoja.');
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
      // Find athlete info if document or name matches
      const targetAthlete = athletes.find(
        (a) =>
          (txAthleteDoc && a.documentId === txAthleteDoc.trim()) ||
          (txAthleteName && a.name.toLowerCase() === txAthleteName.trim().toLowerCase())
      );

      const newTx: AccountingTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        date: todayStr,
        timestamp: new Date().toISOString(),
        athleteId: targetAthlete?.id,
        athleteName: txAthleteName.trim() || targetAthlete?.name || 'Venta Mostrador / General',
        athleteDocumentId: txAthleteDoc.trim() || targetAthlete?.documentId || undefined,
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

  // Date Filtering Logic for Transactions
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
        if (y !== currentYear || m - 1 !== currentMonth) return false;
      } else if (filterPeriod === 'last_month') {
        const [y, m] = t.date.split('-').map(Number);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        if (y !== prevYear || m - 1 !== prevMonth) return false;
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

    // Métricas por método de pago
    const methodStats: Record<string, { total: number; count: number }> = {};
    filteredTransactions.forEach((t) => {
      const m = t.paymentMethod || 'otro';
      if (!methodStats[m]) methodStats[m] = { total: 0, count: 0 };
      methodStats[m].total += t.amount || 0;
      methodStats[m].count += 1;
    });

    return {
      totalIncome,
      count,
      averageTicket,
      crossfitIncome,
      musculacionIncome,
      personalizadoIncome,
      methodStats,
    };
  }, [filteredTransactions]);

  // User Stats & Activity Control Calculations
  const userStats = useMemo(() => {
    const totalAthletes = athletes.length;
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    let crossfitCount = 0;
    let musculacionCount = 0;
    let personalizadoCount = 0;

    let activeCount = 0;
    let expiringSoonCount = 0; // <= 3 days left
    let expiredCount = 0;
    let pendingCount = 0;

    athletes.forEach((a) => {
      const disc = a.discipline || a.membership?.discipline || 'crossfit';
      if (disc === 'crossfit') crossfitCount++;
      else if (disc === 'musculacion') musculacionCount++;
      else if (disc === 'personalizado') personalizadoCount++;

      const isPending = Boolean(a.membership?.isPendingApproval);
      const isActive = Boolean(a.membership?.isActive);
      const endDateStr = a.membership?.endDate;

      if (isPending) {
        pendingCount++;
      } else if (isActive && endDateStr) {
        const endDate = new Date(endDateStr);
        const diffMs = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

        if (diffDays >= 0 && diffDays <= 3) {
          expiringSoonCount++;
          activeCount++;
        } else if (diffDays > 3) {
          activeCount++;
        } else {
          expiredCount++;
        }
      } else {
        expiredCount++;
      }
    });

    return {
      totalAthletes,
      crossfitCount,
      musculacionCount,
      personalizadoCount,
      activeCount,
      expiringSoonCount,
      expiredCount,
      pendingCount,
    };
  }, [athletes]);

  // Filtered Athletes for Users Control Table
  const filteredAthletes = useMemo(() => {
    const now = new Date();

    return athletes.filter((a) => {
      // Search filter
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const matchName = a.name.toLowerCase().includes(q);
        const matchDoc = a.documentId?.toLowerCase().includes(q);
        const matchEmail = a.email?.toLowerCase().includes(q);
        const matchPhone = a.phone?.toLowerCase().includes(q);
        const matchPlan = a.membership?.planName?.toLowerCase().includes(q);
        if (!matchName && !matchDoc && !matchEmail && !matchPhone && !matchPlan) return false;
      }

      // Discipline filter
      const disc = a.discipline || a.membership?.discipline || 'crossfit';
      if (userDisciplineFilter !== 'all' && disc !== userDisciplineFilter) {
        return false;
      }

      // Status filter
      if (userStatusFilter !== 'all') {
        const isPending = Boolean(a.membership?.isPendingApproval);
        const isActive = Boolean(a.membership?.isActive);
        const endDateStr = a.membership?.endDate;

        if (userStatusFilter === 'pending' && !isPending) return false;
        if (userStatusFilter === 'expired' && (isActive || isPending)) return false;
        if (userStatusFilter === 'active') {
          if (!isActive || isPending) return false;
        }
        if (userStatusFilter === 'expiring') {
          if (!isActive || isPending || !endDateStr) return false;
          const endDate = new Date(endDateStr);
          const diffMs = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));
          if (diffDays < 0 || diffDays > 3) return false;
        }
      }

      return true;
    });
  }, [athletes, userSearchQuery, userDisciplineFilter, userStatusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Top Header Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-800/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-800/20 text-red-400 border border-red-700/30">
                <DollarSign className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-400">
                ADMINISTRACIÓN & CONTROL
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              CONTABILIDAD, GOOGLE SHEETS & ESTADO DE DEPORTISTAS
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Monitorea los ingresos en tiempo real, sincroniza automáticamente con tu hoja de cálculo en la nube y analiza el estado detallado de todos los atletas.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportTransactionsToCSV(filteredTransactions)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 hover:text-white transition shadow-sm"
              title="Exportar archivo CSV para Excel"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Exportar Contabilidad</span>
            </button>

            <button
              type="button"
              onClick={() => exportUsersToCSV(athletes, transactions)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-xs font-bold text-zinc-200 hover:text-white transition shadow-sm"
              title="Exportar estado de atletas a CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exportar Usuarios</span>
            </button>

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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-950/60"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Ingreso</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 pt-5 border-t border-zinc-850 mt-5">
          <button
            type="button"
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'finances'
                ? 'bg-red-800 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 Finanzas & Ingresos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'users'
                ? 'bg-red-800 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Control de Usuarios & Historial ({athletes.length})</span>
          </button>
        </div>
      </div>

      {/* Google Sheets Config Drawer */}
      {showSheetsConfig && (
        <div className="rounded-2xl border border-emerald-800/60 bg-zinc-950 p-5 shadow-2xl space-y-4 animate-in slide-in-from-top duration-200">
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                  Sincronización Automática Dual con Google Sheets
                </h4>
                <p className="text-xs text-zinc-400">
                  Conecta tu hoja en la nube para actualizar automáticamente en tiempo real las pestañas <strong>"Contabilidad"</strong> y <strong>"Usuarios_y_Pagos"</strong>.
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
                <p className="font-bold text-white mb-0.5">Código Dual de Apps Script (Contabilidad + Usuarios)</p>
                <p className="text-[11px] text-zinc-400">
                  Copia y pega este código en tu Google Drive (Extensiones &gt; Apps Script) para mantener ambas pestañas actualizadas.
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

      {/* TAB 1: FINANZAS & INGRESOS */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Total Recaudado */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Total Ingresos Periodo
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
                {formatCOP(stats.totalIncome)}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-400">{stats.count}</span> transacciones
                </div>
                <div>
                  Ticket prom: <span className="font-bold text-zinc-200">{formatCOP(stats.averageTicket)}</span>
                </div>
              </div>
            </div>

            {/* Card 2: CrossFit */}
            <div className="rounded-2xl border border-red-900/30 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  CrossFit
                </span>
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <Flame className="w-4 h-4" />
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
                  <Dumbbell className="w-4 h-4" />
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
                  <User className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white">
                {formatCOP(stats.personalizadoIncome)}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">1 a 1 & VIP</p>
            </div>
          </div>

          {/* Breakdown by Payment Method */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Desglose por Métodos de Pago</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
              {[
                { id: 'nequi', label: 'Nequi', color: 'bg-purple-500' },
                { id: 'daviplata', label: 'Daviplata', color: 'bg-red-500' },
                { id: 'efectivo', label: 'Efectivo', color: 'bg-emerald-500' },
                { id: 'breb', label: 'Bre-B', color: 'bg-blue-500' },
                { id: 'tarjeta', label: 'Tarjeta / PSE / Wompi', color: 'bg-amber-500' },
              ].map((methodItem) => {
                let totalForMethod = 0;
                let countForMethod = 0;

                if (methodItem.id === 'tarjeta') {
                  // Group tarjeta, pse, wompi
                  ['tarjeta', 'pse', 'wompi'].forEach((m) => {
                    totalForMethod += stats.methodStats[m]?.total || 0;
                    countForMethod += stats.methodStats[m]?.count || 0;
                  });
                } else {
                  totalForMethod = stats.methodStats[methodItem.id]?.total || 0;
                  countForMethod = stats.methodStats[methodItem.id]?.count || 0;
                }

                const percent = stats.totalIncome > 0 ? Math.round((totalForMethod / stats.totalIncome) * 100) : 0;

                return (
                  <div key={methodItem.id} className="rounded-xl border border-zinc-850 bg-zinc-900/60 p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-zinc-300">{methodItem.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{percent}%</span>
                    </div>
                    <div className="text-base font-black font-['Teko'] text-white">
                      {formatCOP(totalForMethod)}
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full ${methodItem.color}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      {countForMethod} txs
                    </div>
                  </div>
                );
              })}
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
                      ? 'bg-red-800 text-white shadow-md'
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
                      ? 'bg-red-800 text-white shadow-md'
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
                      ? 'bg-red-800 text-white shadow-md'
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
                      ? 'bg-red-800 text-white shadow-md'
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
                      ? 'bg-red-800 text-white shadow-md'
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
                      ? 'bg-red-800 text-white shadow-md'
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

            {/* Custom Date Range Selector */}
            {filterPeriod === 'custom' && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex-wrap animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Desde:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-red-700 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-400">Hasta:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:border-red-700 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-2 text-xs text-white focus:border-red-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
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
                              ? 'bg-red-950/60 text-red-400 border border-red-700/40'
                              : tx.discipline === 'musculacion'
                              ? 'bg-amber-950/60 text-amber-400 border border-amber-700/40'
                              : 'bg-purple-950/60 text-purple-400 border border-purple-700/40'
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
        </div>
      )}

      {/* TAB 2: CONTROL DE USUARIOS & HISTORIAL */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* User Control Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Active Users Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Membresías Activas / Al Día
                </span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black font-['Teko'] text-white">
                {userStats.activeCount} <span className="text-xs font-mono text-zinc-500">/ {userStats.totalAthletes} atletas</span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Con acceso activo al box</p>
            </div>

            {/* Expiring Soon Card */}
            <div className="rounded-2xl border border-amber-900/40 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Por Vencer (&lt;= 3 Días)
                </span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black font-['Teko'] text-amber-400">
                {userStats.expiringSoonCount}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Requieren renovación urgente</p>
            </div>

            {/* Expired Card */}
            <div className="rounded-2xl border border-red-900/40 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                  Vencidos / Inactivos
                </span>
                <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <XCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-black font-['Teko'] text-red-400">
                {userStats.expiredCount}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">Membresía vencida</p>
            </div>

            {/* Disciplines Distribution Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Distribución por Modalidad
                </span>
                <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                  <Activity className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xs space-y-1 font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span>CrossFit:</span>
                  <span className="font-bold text-red-400">{userStats.crossfitCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Musculación:</span>
                  <span className="font-bold text-amber-400">{userStats.musculacionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Personalizado:</span>
                  <span className="font-bold text-purple-400">{userStats.personalizadoCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Control Filters Bar */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-6 relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar atleta por nombre, cédula, correo o plan..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3 py-2 text-xs text-white focus:border-red-700 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={userDisciplineFilter}
                  onChange={(e) => setUserDisciplineFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
                >
                  <option value="all">Todas las Modalidades</option>
                  <option value="crossfit">CrossFit</option>
                  <option value="musculacion">Musculación</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="active">Activos / Al Día</option>
                  <option value="expiring">Por Vencer (&lt;= 3 días)</option>
                  <option value="expired">Vencidos / Inactivos</option>
                  <option value="pending">Pendientes de Aprobación</option>
                </select>
              </div>
            </div>
          </div>

          {/* Athletes Control Table */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Listado de Atletas & Historial de Pagos ({filteredAthletes.length})</span>
              </h3>

              <button
                type="button"
                onClick={() => exportUsersToCSV(athletes, transactions)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-emerald-400 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Hoja CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/80 text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Atleta & Documento</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Modalidad</th>
                    <th className="p-3">Plan Vigente</th>
                    <th className="p-3">Estado Membresía</th>
                    <th className="p-3">Fechas Vigencia</th>
                    <th className="p-3">Total Invertido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {filteredAthletes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-zinc-500">
                        No se encontraron deportistas registrados que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredAthletes.map((a) => {
                      const userTxs = transactions.filter(
                        (t) =>
                          (t.athleteDocumentId && t.athleteDocumentId === a.documentId) ||
                          (t.athleteId && t.athleteId === a.id)
                      );
                      const totalSpent = userTxs.reduce((sum, t) => sum + (t.amount || 0), 0);

                      const disc = a.discipline || a.membership?.discipline || 'crossfit';
                      const isPending = Boolean(a.membership?.isPendingApproval);
                      const isActive = Boolean(a.membership?.isActive);
                      const endDateStr = a.membership?.endDate;

                      let statusBadge = (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-950/60 text-red-400 border border-red-700/40">
                          Vencido / Inactivo
                        </span>
                      );

                      if (isPending) {
                        statusBadge = (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-950/60 text-purple-400 border border-purple-700/40">
                            Pendiente Aprobación
                          </span>
                        );
                      } else if (isActive && endDateStr) {
                        const now = new Date();
                        const endDate = new Date(endDateStr);
                        const diffMs = endDate.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffMs / (1000 * 3600 * 24));

                        if (diffDays >= 0 && diffDays <= 3) {
                          statusBadge = (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-950/60 text-amber-400 border border-amber-700/40">
                              Por Vencer ({diffDays}d)
                            </span>
                          );
                        } else if (diffDays > 3) {
                          statusBadge = (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
                              Activo / Al Día
                            </span>
                          );
                        }
                      }

                      return (
                        <tr key={a.id} className="hover:bg-zinc-900/40 transition">
                          <td className="p-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{a.name}</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              CC: {a.documentId || 'N/A'}
                            </div>
                          </td>

                          <td className="p-3 text-[11px] text-zinc-400">
                            {a.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-zinc-500" />
                                <span>{a.phone}</span>
                              </div>
                            )}
                            {a.email && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <Mail className="w-3 h-3 text-zinc-500" />
                                <span>{a.email}</span>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              disc === 'crossfit'
                                ? 'bg-red-950/60 text-red-400 border border-red-700/40'
                                : disc === 'musculacion'
                                ? 'bg-amber-950/60 text-amber-400 border border-amber-700/40'
                                : 'bg-purple-950/60 text-purple-400 border border-purple-700/40'
                            }`}>
                              {disc}
                            </span>
                          </td>

                          <td className="p-3 font-medium text-zinc-200">
                            {a.membership?.planName || 'Sin Plan Asignado'}
                          </td>

                          <td className="p-3">
                            {statusBadge}
                          </td>

                          <td className="p-3 text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                            <div>Del: {a.membership?.startDate || 'N/A'}</div>
                            <div>Al: {a.membership?.endDate || 'N/A'}</div>
                          </td>

                          <td className="p-3 font-bold font-mono text-emerald-400 text-sm whitespace-nowrap">
                            {formatCOP(totalSpent)}
                            <div className="text-[10px] font-normal text-zinc-500">
                              {userTxs.length} pagos
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white font-mono focus:border-red-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-700 focus:outline-none"
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
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-xs text-white focus:border-red-700 focus:outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-950/60 disabled:opacity-50"
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
