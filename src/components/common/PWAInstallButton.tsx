import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, Sparkles, ArrowDown } from 'lucide-react';

export interface PWAInstallButtonProps {
  variant?: 'compact' | 'banner';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopInfo, setShowDesktopInfo] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowDesktopInfo(true);
    }
  };

  return (
    <>
      {/* A. Banner Variant (Ideal para pantalla de inicio de sesión o bienvenida) */}
      {variant === 'banner' && (
        <div
          className={`p-3 rounded-2xl bg-gradient-to-r from-red-950/70 via-zinc-900 to-zinc-950 border border-red-800/60 flex items-center justify-between gap-3 shadow-lg shadow-red-950/40 animate-in fade-in ${className}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-400 shrink-0 shadow-md">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                  Instalar App INDOMABLE
                </p>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate mt-0.5">
                Acceso directo desde tu pantalla de inicio
              </p>
            </div>
          </div>

          <button
            onClick={handleInstallClick}
            type="button"
            id="btn-install-pwa-banner"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-950/60 shrink-0 cursor-pointer active:scale-95 border border-red-500/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
        </div>
      )}

      {/* B. Compact Variant (Para barras de cabecera o botones en línea) */}
      {variant === 'compact' && (
        <>
          {/* 1. Chromium / Android / Desktop flow with native prompt */}
          {isInstallable && (
            <button
              onClick={install}
              id="btn-install-pwa"
              type="button"
              className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-700 hover:to-red-800 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold shadow-md shadow-red-950/60 transition-all active:scale-95 border border-red-700/50 cursor-pointer shrink-0 ${className}`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden text-[11px]">Instalar</span>
            </button>
          )}

          {/* 2. iOS Safari / WebKit flow */}
          {isIOS && (
            <button
              onClick={() => setShowIOSGuide(true)}
              id="btn-install-ios-pwa"
              type="button"
              className={`flex items-center gap-1.5 rounded-xl border border-red-800/70 bg-red-950/40 hover:bg-red-900/50 text-white px-2.5 py-1 sm:py-1.5 text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer shrink-0 ${className}`}
              title="Instalar en iPhone / iPad"
            >
              <Smartphone className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[11px] sm:text-xs">Instalar</span>
            </button>
          )}

          {/* 3. Fallback desktop/ambient flow when neither prompt nor iOS */}
          {!isInstallable && !isIOS && (
            <button
              onClick={() => setShowDesktopInfo(true)}
              id="btn-info-pwa"
              type="button"
              className={`flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300 px-2.5 py-1 sm:py-1.5 text-xs font-medium transition cursor-pointer shrink-0 ${className}`}
              title="Instalar aplicación"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[11px] sm:text-xs">Instalar</span>
            </button>
          )}
        </>
      )}

      {/* Modal para iOS (Renderizado con createPortal en document.body para evitar clipping en Safari) */}
      {showIOSGuide && isClient && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setShowIOSGuide(false)}
          style={{ touchAction: 'auto' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-red-700/60 p-5 sm:p-6 shadow-2xl text-zinc-100 relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-3.5 right-3.5 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-900 border border-zinc-800 transition active:scale-95"
              aria-label="Cerrar modal"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabecera */}
            <div className="flex items-center gap-3 mb-4 pr-10">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-700 to-red-950 border border-red-600/70 flex items-center justify-center text-white shadow-lg shadow-red-950/60 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-white font-['Teko'] uppercase tracking-wider leading-none">
                  Instalar INDOMABLE
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">
                  Guía paso a paso para iPhone / iPad
                </p>
              </div>
            </div>

            {/* Pasos */}
            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-3 bg-zinc-900/95 p-3.5 rounded-2xl border border-zinc-800">
                <div className="w-8 h-8 rounded-xl bg-red-950/90 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-xs mb-0.5">
                    Paso 1: Botón Compartir
                  </span>
                  <span className="text-zinc-400 text-[11.5px] leading-relaxed block">
                    En la barra inferior de Safari, toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba <span className="inline-block border border-zinc-700 rounded px-1 text-[10px] text-zinc-200">⎋</span>).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/95 p-3.5 rounded-2xl border border-zinc-800">
                <div className="w-8 h-8 rounded-xl bg-red-950/90 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-xs mb-0.5">
                    Paso 2: Agregar al inicio
                  </span>
                  <span className="text-zinc-400 text-[11.5px] leading-relaxed block">
                    Desliza hacia abajo en el menú desplegable y toca <strong>"Agregar al inicio"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-zinc-900/95 p-3.5 rounded-2xl border border-zinc-800">
                <div className="w-8 h-8 rounded-xl bg-red-950/90 border border-red-800/80 flex items-center justify-center text-red-400 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block text-xs mb-0.5">
                    Paso 3: Confirmar instalación
                  </span>
                  <span className="text-zinc-400 text-[11.5px] leading-relaxed block">
                    Toca <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! Tendrás la app instalada en tu pantalla principal en pantalla completa.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3.5 border-t border-zinc-850 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <ArrowDown className="w-4 h-4 text-red-500 animate-bounce shrink-0" />
                <span>Busca el icono de compartir abajo en Safari</span>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="rounded-xl bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 px-4 py-2 text-xs font-bold text-white transition shadow-md shadow-red-950/60 active:scale-95 border border-red-600/40 cursor-pointer"
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal para Desktop / Otros navegadores */}
      {showDesktopInfo && isClient && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setShowDesktopInfo(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100 relative max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDesktopInfo(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1.5 rounded-lg bg-zinc-900 border border-zinc-800"
              aria-label="Cerrar"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Instalar INDOMABLE App</h3>
                <p className="text-xs text-zinc-400">PWA Offline & Pantalla Completa</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              Para instalar la app en tu ordenador o celular:
              <br /><br />
              • En <strong>Chrome / Edge</strong>: haz clic en el icono de instalación en la barra de direcciones o en el menú ⋮ y elige <strong>"Instalar INDOMABLE"</strong>.
              <br /><br />
              • En <strong>móviles</strong>: selecciona <em>"Agregar a la pantalla principal"</em>.
            </p>

            <button
              type="button"
              onClick={() => setShowDesktopInfo(false)}
              className="w-full rounded-xl bg-red-800 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition shadow-md shadow-red-950/60 border border-red-700/50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
