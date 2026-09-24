import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Shield, Wrench, Lock, AlertCircle, KeyRound, ArrowRight, Eye, EyeOff, CheckCircle2, FlaskConical } from 'lucide-react';

interface MaintenanceViewProps {
  customMessage?: string;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({ customMessage }) => {
  const { loginAsAdmin, loginAsTestUser } = useGym();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Test User Modal & Password state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [showTestPassword, setShowTestPassword] = useState(false);
  const [testErrorMsg, setTestErrorMsg] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMsg('Ingresa tu usuario y contraseña de administrador.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginAsAdmin(adminUsername.trim(), adminPassword.trim());
      if (!res.success) {
        setErrorMsg(res.message || 'Credenciales de administrador incorrectas.');
      } else {
        setShowAdminModal(false);
      }
    } catch {
      setErrorMsg('Error al verificar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTestErrorMsg('');
    const pass = testPassword.trim().toLowerCase();
    if (!pass) {
      setTestErrorMsg('Ingresa la contraseña de prueba autorizada.');
      return;
    }

    const validPasswords = ['demo123', '1234', 'demo', 'indomable', 'test123'];
    if (!validPasswords.includes(pass)) {
      setTestErrorMsg('Contraseña incorrecta. Consulta al administrador del box.');
      return;
    }

    loginAsTestUser();
    setShowTestModal(false);
  };

  return (
    <div className="min-h-[100dvh] w-full bg-black text-zinc-100 flex flex-col items-center justify-between p-4 sm:p-8 relative overflow-hidden select-none">
      {/* Background Red Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-red-950/20 blur-3xl pointer-events-none" />

      {/* Top Header Logo */}
      <div className="w-full max-w-md flex items-center justify-center gap-3 pt-4 sm:pt-6">
        <div className="h-14 w-14 rounded-2xl bg-zinc-950 border border-zinc-800 p-2 shadow-2xl overflow-hidden flex items-center justify-center">
          <img src="/logo.png" alt="INDOMABLE" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-3xl font-black font-['Teko'] tracking-wider text-white uppercase leading-none">
            INDOMABLE
          </h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">
            CrossFit & Performance Box
          </span>
        </div>
      </div>

      {/* Hero Center Card */}
      <div className="w-full max-w-md rounded-3xl bg-zinc-950/80 border border-zinc-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 my-auto">
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500 shadow-xl shadow-red-950/50 animate-pulse">
            <Wrench className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow">
            En Curso
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black font-['Teko'] tracking-wide text-white uppercase">
            SITIO EN MANTENIMIENTO
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
            {customMessage ||
              'Estamos realizando actualizaciones y mejoras en los servidores para optimizar tu experiencia en el box. Volvemos en unos momentos.'}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Tus datos y reservas están 100% seguros</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-normal">
            No te preocupes por tus franjas agendadas ni tus marcas personales; el sistema reactivará el acceso regular inmediatamente al terminar las labores.
          </p>
        </div>

        {/* Test User Access Button */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <button
            type="button"
            id="btn-test-user-login"
            onClick={() => {
              setTestPassword('');
              setTestErrorMsg('');
              setShowTestModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-purple-950/60 active:scale-95 transition-all cursor-pointer border border-purple-400/30"
          >
            <FlaskConical className="w-4 h-4 text-purple-200" />
            <span>Explorar como Usuario de Prueba</span>
          </button>
          <p className="text-[10px] text-zinc-500">
            Acceso especial para recorrer y evaluar todas las funciones del box
          </p>
        </div>
      </div>

      {/* Footer Discreet Admin Bypass Link */}
      <div className="w-full max-w-md flex flex-col items-center justify-center pb-4 pt-2">
        <button
          type="button"
          onClick={() => setShowAdminModal(true)}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-zinc-900/50"
        >
          <Lock className="w-3.5 h-3.5 text-zinc-600" />
          <span>Acceso Administrativo</span>
        </button>
        <p className="text-[10px] text-zinc-600 mt-1">© {new Date().getFullYear()} INDOMABLE CrossFit</p>
      </div>

      {/* Admin Login Modal (Bypass) */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ingreso de Administrador</h3>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Usuario / Correo</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 pr-8 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-950/60 disabled:opacity-50 border border-red-700/50"
              >
                {isSubmitting ? 'Validando...' : 'Acceder y Administrar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Test User Login Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-purple-900/60 p-5 shadow-2xl text-zinc-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Acceso de Prueba (Demo)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTestModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Ingresa la contraseña autorizada para explorar la plataforma en modo mantenimiento como usuario de prueba.
            </p>

            {testErrorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{testErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleTestUserLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Contraseña</label>
                <div className="relative">
                  <input
                    type={showTestPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 pr-8 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTestPassword(!showTestPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showTestPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-purple-950/60 cursor-pointer"
              >
                Ingresar al Box
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
