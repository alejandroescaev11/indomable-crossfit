import React, { useState, useEffect } from 'react';
import { Megaphone, X, BellRing, Sparkles } from 'lucide-react';
import { InAppAlertDetail } from '../../utils/notificationUtils';

export const NotificationToast: React.FC = () => {
  const [currentAlert, setCurrentAlert] = useState<InAppAlertDetail | null>(null);

  useEffect(() => {
    const handleInAppAlert = (e: Event) => {
      const customEvent = e as CustomEvent<InAppAlertDetail>;
      if (customEvent.detail) {
        setCurrentAlert(customEvent.detail);
      }
    };

    window.addEventListener('indomable-inapp-alert', handleInAppAlert);
    return () => {
      window.removeEventListener('indomable-inapp-alert', handleInAppAlert);
    };
  }, []);

  useEffect(() => {
    if (!currentAlert) return;

    const timer = setTimeout(() => {
      setCurrentAlert(null);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentAlert]);

  if (!currentAlert) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md pointer-events-auto animate-bounce-short">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-red-600/70 p-4 shadow-2xl shadow-red-950/60 flex items-start gap-3.5">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-600/20 rounded-full blur-xl pointer-events-none" />

        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/40 flex items-center justify-center text-white shrink-0 shadow-lg shadow-red-900/50">
          <BellRing className="w-5 h-5 animate-pulse" />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white font-mono">
              Aviso Nuevo
            </span>
            {currentAlert.date && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentAlert.date}
              </span>
            )}
          </div>
          <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
            {currentAlert.title}
          </h4>
          <p className="text-xs text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">
            {currentAlert.body}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setCurrentAlert(null)}
          className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/80 transition shrink-0"
          title="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
