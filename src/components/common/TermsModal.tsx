import React from 'react';
import { ShieldCheck, X, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-850 bg-zinc-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-['Teko'] uppercase tracking-wider text-white">
                TÉRMINOS, CONDICIONES & EXONERACIÓN DE RESPONSABILIDAD
              </h3>
              <p className="text-[11px] text-zinc-400">
                INDOMABLE CrossFit • Consentimiento Informado & Tratamiento de Datos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-800/40 text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p>
              Por favor lee con atención el presente documento antes de iniciar tus entrenamientos. La práctica del CrossFit, levantamiento de pesas y entrenamiento funcional de alta intensidad implica esfuerzo físico significativo.
            </p>
          </div>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" />
              1. Exoneración de Responsabilidad & Estado Físico
            </h4>
            <p>
              Declaro voluntariamente que me encuentro en condiciones físicas, médicas y psicológicas óptimas para realizar ejercicios de acondicionamiento físico de media y alta intensidad (CrossFit, Levantamiento Olímpico, Gimnásticos, Acondicionamiento Metabólico y Musculación).
            </p>
            <p>
              Exonero a <strong>INDOMABLE CROSSFIT</strong>, sus directores, entrenadores, personal administrativo y afiliados de cualquier responsabilidad derivada de lesiones, traumatismos, accidentes o complicaciones de salud preexistentes no notificadas formalmente por escrito al staff técnico.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" />
              2. Normas de Convivencia, Seguridad & Uso de Instalaciones
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-zinc-300">
              <li>El uso de toalla y calzado deportivo adecuado es obligatorio en todas las áreas del box.</li>
              <li>Todo atleta debe guardar y limpiar el material utilizado (barras, discos, mancuernas, kettlebells, colchonetas) al finalizar su bloque de trabajo.</li>
              <li>Se debe respetar puntualmente el horario de inicio y finalización de cada franja de clase reservada.</li>
              <li>El coach tiene total autoridad técnica para escalar, limitar o modificar los pesos o ejercicios si considera que la técnica del atleta pone en riesgo su integridad física.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" />
              3. Membresías, Reservas & Pagos
            </h4>
            <p>
              Las membresías son personales e intransferibles. La falta de asistencia no congela ni acumula días, salvo incapacidad médica certificada presentada dentro de los primeros 5 días calendario del evento. Los planes tipo tiquetera (punch-card) tienen una vigencia estipulada de días para su consumo.
            </p>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-red-500" />
              4. Política de Tratamiento de Datos Personales (Ley 1581 de 2012 - Colombia)
            </h4>
            <p>
              En cumplimiento del régimen legal de Habeas Data y protección de datos personales de la República de Colombia, autorizo expresamente a <strong>INDOMABLE CROSSFIT</strong> para recolectar, almacenar y tratar mis datos personales (nombre, identificación, correo, teléfono, EPS, contacto de emergencia y valoraciones antropométricas) con la exclusiva finalidad de prestar los servicios deportivos, coordinar el acceso al box, gestionar emergencias y remitir comunicaciones oficiales sobre membresías y horarios.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-850 bg-zinc-900/60 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[11px] text-zinc-400 text-center sm:text-left">
            Al registrarte confirmas tu aceptación vinculante de estos términos.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg shadow-red-950/50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aceptar Términos</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-white text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
