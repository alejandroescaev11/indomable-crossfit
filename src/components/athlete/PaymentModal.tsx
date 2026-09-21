import React, { useState, useRef } from 'react';
import { useGym } from '../../context/GymContext';
import { MembershipPlan } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import { formatCOP } from '../../services/accountingService';
import {
  CreditCard,
  QrCode,
  Smartphone,
  Copy,
  Check,
  Upload,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  Flame,
  Dumbbell,
  RefreshCw,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose }) => {
  const {
    currentAthlete,
    plans,
    gymSettings,
    addActivityLog,
    addTransaction,
    role,
  } = useGym();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');

  // Transfer Proof State
  const [receiptImage, setReceiptImage] = useState('');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const receiptInputRef = useRef<HTMLInputElement>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingReceipt(true);
    try {
      const compressed = await compressImageFile(file, 800, 800, 0.85);
      setReceiptImage(compressed);
    } catch (err: any) {
      setErrorMsg('Error al procesar la imagen del comprobante.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  const handleReportPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAthlete) return;
    setErrorMsg('');

    if (!receiptImage) {
      setErrorMsg('Por favor adjunta la foto o captura del comprobante de transferencia.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Registrar log de auditoría para que el admin lo vea de inmediato
      addActivityLog({
        category: 'MEMBERSHIP',
        action: 'Reporte de Pago Atleta',
        description: `El atleta ${currentAthlete.name} (CC ${currentAthlete.documentId}) reportó comprobante de pago para el plan "${selectedPlan?.name || 'Membresía'}" por ${formatCOP(selectedPlan?.price || 0)}.`,
        actor: currentAthlete.name,
        target: currentAthlete.documentId,
      });

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al enviar reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-lg max-h-[92dvh] rounded-3xl bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-2xl text-zinc-100 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-['Teko'] uppercase tracking-wider text-white">
                PAGO & RENOVACIÓN DE MEMBRESÍA
              </h3>
              <p className="text-[11px] text-zinc-400">
                Selecciona tu plan y método de pago en Colombia
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-2xl font-black font-['Teko'] uppercase text-white">
                ¡PAGO REPORTADO CON ÉXITO!
              </h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                El Administrador ha recibido la notificación con tu comprobante. En pocos minutos validará la transacción y tu membresía quedará activa.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-3 flex-1">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1. Selección de Plan */}
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                1. Selecciona el Plan que deseas renovar o adquirir:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      selectedPlanId === p.id
                        ? 'bg-red-950/40 border-red-600 shadow-md shadow-red-950/30 ring-1 ring-red-600'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{p.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase">
                          {p.discipline}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">
                        {p.isPunchCard ? `${p.totalClasses} Clases` : `${p.durationDays} Días de Acceso`}
                      </p>
                    </div>
                    <div className="mt-2 text-sm font-black font-['Teko'] tracking-wider text-emerald-400">
                      {formatCOP(p.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Cuentas Oficiales del Box & Subir Comprobante */}
            <form onSubmit={handleReportPayment} className="space-y-3 pt-1">
              {/* Gym Payment Numbers Box */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="font-bold text-zinc-300">Cuentas para Transferencia Directa</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    0% Comisión
                  </span>
                </div>

                {/* Nequi / Bre-B */}
                <div className="flex items-center justify-between py-0.5">
                  <div>
                    <span className="font-bold text-purple-400">Nequi / Llave Bre-B: </span>
                    <span className="font-mono text-white">{gymSettings?.nequiNumber || '310 123 4567'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(gymSettings?.nequiNumber || '3101234567', 'nequi')}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedAccount === 'nequi' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount === 'nequi' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Daviplata */}
                <div className="flex items-center justify-between py-0.5">
                  <div>
                    <span className="font-bold text-red-400">Daviplata: </span>
                    <span className="font-mono text-white">{gymSettings?.daviplataNumber || '310 123 4567'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(gymSettings?.daviplataNumber || '3101234567', 'daviplata')}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedAccount === 'daviplata' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount === 'daviplata' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>

                {/* Bancolombia */}
                <div className="flex items-center justify-between py-0.5">
                  <div>
                    <span className="font-bold text-amber-400">Bancolombia Ahorros: </span>
                    <span className="font-mono text-white">{gymSettings?.bancolombiaAccount || '123-456789-00'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(gymSettings?.bancolombiaAccount || '123-456789-00', 'banco')}
                    className="p-1 px-2 rounded bg-zinc-800 text-zinc-400 hover:text-white text-[10px] flex items-center gap-1 cursor-pointer transition"
                  >
                    {copiedAccount === 'banco' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedAccount === 'banco' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Upload Receipt */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Adjuntar Foto o Captura de Pantalla del Comprobante *
                </label>
                <input
                  ref={receiptInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                  id="receipt-upload"
                />

                {receiptImage ? (
                  <div className="relative p-2.5 rounded-xl bg-zinc-900 border border-emerald-600/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <img src={receiptImage} alt="Comprobante" className="w-11 h-11 rounded-lg object-cover border border-zinc-800" />
                      <div>
                        <span className="text-xs text-emerald-400 font-bold block">✓ Comprobante adjuntado</span>
                        <span className="text-[10px] text-zinc-400">Listo para enviar al administrador</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImage('')}
                      className="text-xs text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="receipt-upload"
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer text-xs text-zinc-400 hover:text-white transition"
                  >
                    {isCompressingReceipt ? (
                      <RefreshCw className="w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-red-500" />
                    )}
                    <span>{isCompressingReceipt ? 'Procesando imagen...' : 'Subir imagen del comprobante'}</span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/60 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Enviando...' : `Enviar Comprobante de ${formatCOP(selectedPlan?.price || 0)}`}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
