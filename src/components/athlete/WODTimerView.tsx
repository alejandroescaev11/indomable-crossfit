import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Flame,
  Clock,
  Timer,
  Activity,
  Plus,
  Minus,
  SkipForward,
  CheckCircle2,
  Zap,
  Info,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export type TimerMode = 'tabata' | 'emom' | 'amrap' | 'fortime';
export type TimerPhase = 'idle' | 'prep' | 'work' | 'rest' | 'finished';

// Sonidos sintéticos con Web Audio API (100% offline, 0 descargas, baja latencia)
class SoundBeepSynthesizer {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  public resume() {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Beep corto para conteo regresivo (3, 2, 1)
   */
  public playCountdownBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      this.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  /**
   * Beep agudo y enérgico para inicio o cambio a trabajo (GO!)
   */
  public playGoBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      this.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // A6
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }

  /**
   * Beep suave para aviso de descanso (REST)
   */
  public playRestBeep() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      this.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  }

  /**
   * Melodía de victoria al terminar el WOD completo
   */
  public playFinishHorn() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      this.resume();

      const now = ctx.currentTime;
      const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0.45, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.3);
      });
    } catch {}
  }
}

const soundManager = new SoundBeepSynthesizer();

export const WODTimerView: React.FC = () => {
  const [mode, setMode] = useState<TimerMode>('tabata');
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Configuración de Tabata
  const [tabataWorkSecs, setTabataWorkSecs] = useState<number>(20);
  const [tabataRestSecs, setTabataRestSecs] = useState<number>(10);
  const [tabataTotalRounds, setTabataTotalRounds] = useState<number>(8);
  const [currentRound, setCurrentRound] = useState<number>(1);

  // Configuración de EMOM
  const [emomTotalMins, setEmomTotalMins] = useState<number>(10);

  // Configuración de AMRAP
  const [amrapMins, setAmrapMins] = useState<number>(15);

  // Configuración de For Time
  const [forTimeCapMins, setForTimeCapMins] = useState<number>(20);
  const [laps, setLaps] = useState<string[]>([]);

  // Tiempo de preparación previo (Cuenta regresiva estándar 10s o 5s)
  const [prepSecs, setPrepSecs] = useState<number>(10);

  // Tiempo del reloj actual en milisegundos o segundos
  const [secondsLeft, setSecondsLeft] = useState<number>(10);
  const [forTimeSeconds, setForTimeSeconds] = useState<number>(0);

  // Wake Lock Sentinel
  const wakeLockRef = useRef<any>(null);

  // Prevenir que la pantalla se apague mientras entrena
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock?.request) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      }
    } catch {
      setWakeLockActive(false);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {}
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Sincronizar estado de mute
  const toggleMute = () => {
    soundManager.isMuted = !isMuted;
    setIsMuted(!isMuted);
    if (isMuted) {
      soundManager.playCountdownBeep();
    }
  };

  // Reset del reloj según el modo
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setCurrentRound(1);
    setForTimeSeconds(0);
    setLaps([]);
    releaseWakeLock();

    if (mode === 'tabata') {
      setSecondsLeft(prepSecs);
    } else if (mode === 'emom') {
      setSecondsLeft(prepSecs);
    } else if (mode === 'amrap') {
      setSecondsLeft(prepSecs);
    } else if (mode === 'fortime') {
      setSecondsLeft(prepSecs);
    }
  }, [mode, prepSecs]);

  // Al cambiar de modo, resetear
  useEffect(() => {
    resetTimer();
  }, [mode, resetTimer]);

  // Iniciar / Pausar
  const togglePlayPause = () => {
    soundManager.resume();
    if (!isRunning) {
      // Iniciar
      if (phase === 'idle' || phase === 'finished') {
        setPhase('prep');
        setSecondsLeft(prepSecs);
        setCurrentRound(1);
        setForTimeSeconds(0);
        soundManager.playCountdownBeep();
      }
      setIsRunning(true);
      requestWakeLock();
    } else {
      // Pausar
      setIsRunning(false);
      releaseWakeLock();
    }
  };

  // Saltar fase o siguiente ronda
  const handleSkipNext = () => {
    soundManager.resume();
    if (mode === 'tabata') {
      if (phase === 'prep') {
        setPhase('work');
        setSecondsLeft(tabataWorkSecs);
        soundManager.playGoBeep();
      } else if (phase === 'work') {
        if (currentRound >= tabataTotalRounds) {
          setPhase('finished');
          setIsRunning(false);
          soundManager.playFinishHorn();
        } else {
          setPhase('rest');
          setSecondsLeft(tabataRestSecs);
          soundManager.playRestBeep();
        }
      } else if (phase === 'rest') {
        setCurrentRound((prev) => prev + 1);
        setPhase('work');
        setSecondsLeft(tabataWorkSecs);
        soundManager.playGoBeep();
      }
    } else if (mode === 'emom') {
      if (phase === 'prep') {
        setPhase('work');
        setSecondsLeft(60);
        setCurrentRound(1);
        soundManager.playGoBeep();
      } else {
        if (currentRound >= emomTotalMins) {
          setPhase('finished');
          setIsRunning(false);
          soundManager.playFinishHorn();
        } else {
          setCurrentRound((prev) => prev + 1);
          setSecondsLeft(60);
          soundManager.playGoBeep();
        }
      }
    }
  };

  // Registrar vuelta en For Time
  const handleRecordLap = () => {
    const mins = Math.floor(forTimeSeconds / 60);
    const secs = forTimeSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    setLaps((prev) => [formatted, ...prev]);
    soundManager.playCountdownBeep();
  };

  // Loop de ejecución del temporizador (1 segundo por tick)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // MODO FOR TIME (Conteo ascendente)
      if (mode === 'fortime') {
        if (phase === 'prep') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setPhase('work');
              soundManager.playGoBeep();
              return 0;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        } else if (phase === 'work') {
          setForTimeSeconds((prev) => {
            const next = prev + 1;
            // Verificar si alcanzó el time cap
            if (forTimeCapMins > 0 && next >= forTimeCapMins * 60) {
              setPhase('finished');
              setIsRunning(false);
              soundManager.playFinishHorn();
              releaseWakeLock();
            }
            return next;
          });
        }
        return;
      }

      // MODO AMRAP (Conteo regresivo total)
      if (mode === 'amrap') {
        if (phase === 'prep') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setPhase('work');
              soundManager.playGoBeep();
              return amrapMins * 60;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        } else if (phase === 'work') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setPhase('finished');
              setIsRunning(false);
              soundManager.playFinishHorn();
              releaseWakeLock();
              return 0;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        }
        return;
      }

      // MODO EMOM (Minuto a minuto)
      if (mode === 'emom') {
        if (phase === 'prep') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setPhase('work');
              setCurrentRound(1);
              soundManager.playGoBeep();
              return 60;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        } else if (phase === 'work') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Fin del minuto
              if (currentRound >= emomTotalMins) {
                setPhase('finished');
                setIsRunning(false);
                soundManager.playFinishHorn();
                releaseWakeLock();
                return 0;
              } else {
                setCurrentRound((r) => r + 1);
                soundManager.playGoBeep();
                return 60;
              }
            }
            // Aviso de cuenta regresiva los últimos 3 segundos del minuto
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        }
        return;
      }

      // MODO TABATA (Prep -> Work -> Rest -> Repeat)
      if (mode === 'tabata') {
        if (phase === 'prep') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              setPhase('work');
              soundManager.playGoBeep();
              return tabataWorkSecs;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        } else if (phase === 'work') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Fin de trabajo
              if (currentRound >= tabataTotalRounds) {
                setPhase('finished');
                setIsRunning(false);
                soundManager.playFinishHorn();
                releaseWakeLock();
                return 0;
              } else {
                setPhase('rest');
                soundManager.playRestBeep();
                return tabataRestSecs;
              }
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        } else if (phase === 'rest') {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              // Fin de descanso -> Nueva ronda
              setCurrentRound((r) => r + 1);
              setPhase('work');
              soundManager.playGoBeep();
              return tabataWorkSecs;
            }
            if (prev <= 4) {
              soundManager.playCountdownBeep();
            }
            return prev - 1;
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isRunning,
    phase,
    mode,
    currentRound,
    tabataTotalRounds,
    tabataWorkSecs,
    tabataRestSecs,
    emomTotalMins,
    amrapMins,
    forTimeCapMins,
  ]);

  // Formato MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Color temático según la fase actual
  const getPhaseColorClasses = () => {
    if (phase === 'prep') {
      return {
        bg: 'bg-amber-950/40',
        border: 'border-amber-500/80',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500 text-black',
        glow: 'shadow-[0_0_50px_rgba(245,158,11,0.25)]',
        label: 'PREPÁRATE',
      };
    }
    if (phase === 'work') {
      return {
        bg: 'bg-emerald-950/40',
        border: 'border-emerald-500/80',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-500 text-black',
        glow: 'shadow-[0_0_60px_rgba(16,185,129,0.35)]',
        label: '¡TRABAJO / WORK!',
      };
    }
    if (phase === 'rest') {
      return {
        bg: 'bg-cyan-950/40',
        border: 'border-cyan-500/80',
        text: 'text-cyan-400',
        badgeBg: 'bg-cyan-500 text-black',
        glow: 'shadow-[0_0_50px_rgba(6,182,212,0.25)]',
        label: 'DESCANSO / REST',
      };
    }
    if (phase === 'finished') {
      return {
        bg: 'bg-red-950/40',
        border: 'border-red-600/80',
        text: 'text-red-400',
        badgeBg: 'bg-red-600 text-white',
        glow: 'shadow-[0_0_50px_rgba(220,38,38,0.3)]',
        label: '¡WOD COMPLETADO!',
      };
    }
    return {
      bg: 'bg-zinc-950',
      border: 'border-zinc-800',
      text: 'text-zinc-200',
      badgeBg: 'bg-zinc-800 text-zinc-300',
      glow: '',
      label: 'LISTO PARA EMPEZAR',
    };
  };

  const currentTheme = getPhaseColorClasses();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Controles de Sonido y Pantalla Activa */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {wakeLockActive && (
          <span
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-950/70 border border-emerald-800/70 text-emerald-400 text-[11px] font-bold"
            title="Tu pantalla permanecerá encendida durante el entrenamiento"
          >
            <Smartphone className="w-3.5 h-3.5 animate-pulse" />
            <span>Pantalla Activa</span>
          </span>
        )}

        <button
          type="button"
          onClick={toggleMute}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-md ${
            isMuted
              ? 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              : 'bg-red-950/80 border-red-800 text-red-400 hover:bg-red-900/80'
          }`}
          title={isMuted ? 'Activar sonido de cronómetro' : 'Silenciar sonido'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isMuted ? 'Mudo' : 'Sonido ON'}</span>
        </button>
      </div>

      {/* Selector de Modo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setMode('tabata')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold text-xs transition ${
            mode === 'tabata'
              ? 'bg-gradient-to-b from-red-600/20 to-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Flame className={`w-5 h-5 mb-1 ${mode === 'tabata' ? 'text-red-500' : 'text-zinc-500'}`} />
          <span className="uppercase tracking-wider">TABATA</span>
          <span className="text-[10px] text-zinc-500 font-normal">20s Trabajo / 10s Rest</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('emom')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold text-xs transition ${
            mode === 'emom'
              ? 'bg-gradient-to-b from-red-600/20 to-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Clock className={`w-5 h-5 mb-1 ${mode === 'emom' ? 'text-amber-500' : 'text-zinc-500'}`} />
          <span className="uppercase tracking-wider">EMOM</span>
          <span className="text-[10px] text-zinc-500 font-normal">Minuto a Minuto</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('amrap')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold text-xs transition ${
            mode === 'amrap'
              ? 'bg-gradient-to-b from-red-600/20 to-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Activity className={`w-5 h-5 mb-1 ${mode === 'amrap' ? 'text-cyan-500' : 'text-zinc-500'}`} />
          <span className="uppercase tracking-wider">AMRAP</span>
          <span className="text-[10px] text-zinc-500 font-normal">Cuenta Regresiva</span>
        </button>

        <button
          type="button"
          onClick={() => setMode('fortime')}
          className={`flex flex-col items-center justify-center p-3 rounded-xl border font-bold text-xs transition ${
            mode === 'fortime'
              ? 'bg-gradient-to-b from-red-600/20 to-red-950/40 border-red-600 text-white shadow-lg shadow-red-950/40'
              : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
          }`}
        >
          <Timer className={`w-5 h-5 mb-1 ${mode === 'fortime' ? 'text-emerald-500' : 'text-zinc-500'}`} />
          <span className="uppercase tracking-wider">FOR TIME</span>
          <span className="text-[10px] text-zinc-500 font-normal">Cronómetro / Cap</span>
        </button>
      </div>

      {/* DISPLAY GIGANTE DEL CRONÓMETRO */}
      <div
        className={`relative overflow-hidden rounded-3xl border-2 ${currentTheme.border} ${currentTheme.bg} ${currentTheme.glow} p-6 sm:p-10 text-center transition-all duration-300`}
      >
        {/* Badge superior de fase */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${currentTheme.badgeBg} shadow-md`}
          >
            {currentTheme.label}
          </span>

          {mode === 'tabata' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-750 text-white">
              Ronda {currentRound} / {tabataTotalRounds}
            </span>
          )}

          {mode === 'emom' && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-900 border border-zinc-750 text-white">
              Minuto {currentRound} / {emomTotalMins}
            </span>
          )}
        </div>

        {/* NÚMERO DIGITAL GIGANTE */}
        <div className="my-4 sm:my-8 select-none">
          <span
            className={`font-mono text-7xl sm:text-9xl md:text-[11rem] font-black tracking-tighter ${currentTheme.text} drop-shadow-2xl transition-colors duration-200`}
          >
            {mode === 'fortime' ? (
              phase === 'prep' ? (
                String(secondsLeft).padStart(2, '0')
              ) : (
                formatTime(forTimeSeconds)
              )
            ) : phase === 'prep' ? (
              String(secondsLeft).padStart(2, '0')
            ) : mode === 'tabata' ? (
              String(secondsLeft).padStart(2, '0')
            ) : (
              formatTime(secondsLeft)
            )}
          </span>
        </div>

        {/* Información contextual en tiempo real */}
        <div className="text-zinc-400 text-xs sm:text-sm font-semibold flex items-center justify-center gap-4">
          {mode === 'tabata' && (
            <>
              <span>Trabajo: <strong className="text-white">{tabataWorkSecs}s</strong></span>
              <span>•</span>
              <span>Descanso: <strong className="text-white">{tabataRestSecs}s</strong></span>
              <span>•</span>
              <span>Total: <strong className="text-white">{tabataTotalRounds} Rondas</strong></span>
            </>
          )}

          {mode === 'emom' && (
            <>
              <span>Intervalo: <strong className="text-white">Cada 1 Minuto</strong></span>
              <span>•</span>
              <span>Duración Total: <strong className="text-white">{emomTotalMins} Minutos</strong></span>
            </>
          )}

          {mode === 'amrap' && (
            <>
              <span>Límite de Tiempo: <strong className="text-white">{amrapMins} Minutos</strong></span>
              <span>•</span>
              <span>Objetivo: <strong className="text-white">Máximas Rondas Posibles</strong></span>
            </>
          )}

          {mode === 'fortime' && (
            <>
              <span>Time Cap: <strong className="text-white">{forTimeCapMins ? `${forTimeCapMins} Min` : 'Sin Límite'}</strong></span>
              {laps.length > 0 && (
                <>
                  <span>•</span>
                  <span>Vueltas: <strong className="text-white">{laps.length}</strong></span>
                </>
              )}
            </>
          )}
        </div>

        {/* BOTONES PRINCIPALES DE CONTROL */}
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={resetTimer}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg transition active:scale-95"
            title="Reiniciar cronómetro"
          >
            <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            className={`flex-1 max-w-xs h-12 sm:h-14 rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base font-black uppercase tracking-wider text-white shadow-xl transition active:scale-95 border ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-400/50 shadow-amber-950/60'
                : 'bg-red-600 hover:bg-red-500 border-red-500/50 shadow-red-950/60'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-6 h-6 fill-white" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-white" />
                <span>{phase === 'idle' || phase === 'finished' ? 'Iniciar WOD' : 'Continuar'}</span>
              </>
            )}
          </button>

          {mode === 'fortime' && isRunning && phase === 'work' ? (
            <button
              type="button"
              onClick={handleRecordLap}
              className="px-4 h-12 sm:h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold uppercase tracking-wider shadow-lg transition active:scale-95"
              title="Registrar vuelta (Lap)"
            >
              Lap
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSkipNext}
              disabled={phase === 'idle' || phase === 'finished'}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center shadow-lg transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              title="Avanzar a siguiente fase / ronda"
            >
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Historial de Vueltas (Laps) en For Time */}
      {mode === 'fortime' && laps.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-400 pb-2 border-b border-zinc-850">
            <span>Tiempos de Vuelta (Laps Registrados)</span>
            <span className="font-mono text-zinc-500">{laps.length} laps</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {laps.map((lap, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs"
              >
                <span className="text-zinc-500 font-bold">Lap #{laps.length - i}</span>
                <span className="font-mono font-bold text-emerald-400">{lap}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PANEL DE CONFIGURACIÓN DEL ENTRENAMIENTO */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-850">
          <Zap className="w-4 h-4 text-red-500" />
          <h2 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
            Ajustes Personalizados para tu {mode.toUpperCase()}
          </h2>
        </div>

        {/* Ajustes de TABATA */}
        {mode === 'tabata' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Segundos de Trabajo</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataWorkSecs((s) => Math.max(5, s - 5))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-emerald-400">{tabataWorkSecs}s</span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataWorkSecs((s) => s + 5)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Segundos de Descanso</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataRestSecs((s) => Math.max(0, s - 5))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-cyan-400">{tabataRestSecs}s</span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataRestSecs((s) => s + 5)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Total de Rondas</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataTotalRounds((r) => Math.max(1, r - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-white">{tabataTotalRounds}</span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setTabataTotalRounds((r) => r + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ajustes de EMOM */}
        {mode === 'emom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Minutos Totales</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setEmomTotalMins((m) => Math.max(1, m - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-amber-400">{emomTotalMins} mins</span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setEmomTotalMins((m) => m + 1)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                El reloj emitirá 3 beeps de advertencia en los segundos :57, :58 y :59 antes de cada minuto para marcar el inicio del siguiente ejercicio.
              </span>
            </div>
          </div>
        )}

        {/* Ajustes de AMRAP */}
        {mode === 'amrap' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Minutos de AMRAP</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    const next = Math.max(1, amrapMins - 1);
                    setAmrapMins(next);
                    if (phase === 'idle') setSecondsLeft(next * 60);
                  }}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-cyan-400">{amrapMins} mins</span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    const next = amrapMins + 1;
                    setAmrapMins(next);
                    if (phase === 'idle') setSecondsLeft(next * 60);
                  }}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[10, 12, 15, 20].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isRunning}
                  onClick={() => {
                    setAmrapMins(mins);
                    if (phase === 'idle') setSecondsLeft(mins * 60);
                  }}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold font-mono transition ${
                    amrapMins === mins
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ajustes de FOR TIME */}
        {mode === 'fortime' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/70 border border-zinc-800 p-3 rounded-xl space-y-2">
              <span className="text-xs text-zinc-400 font-bold">Time Cap (Límite Máximo)</span>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setForTimeCapMins((m) => Math.max(0, m - 5))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-black text-emerald-400">
                  {forTimeCapMins === 0 ? 'Sin Cap' : `${forTimeCapMins} mins`}
                </span>
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setForTimeCapMins((m) => m + 5)}
                  className="w-8 h-8 rounded-lg bg-zinc-800 text-white flex items-center justify-center hover:bg-zinc-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[10, 15, 20, 25].map((cap) => (
                <button
                  key={cap}
                  type="button"
                  disabled={isRunning}
                  onClick={() => setForTimeCapMins(cap)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold font-mono transition ${
                    forTimeCapMins === cap
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Cap {cap}m
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ajuste de Conteo Previo (Prep Countdown) */}
        <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-zinc-400 font-bold">Conteo de Preparación Inicial:</span>
          <div className="flex items-center gap-2">
            {[3, 5, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                disabled={isRunning}
                onClick={() => {
                  setPrepSecs(sec);
                  if (phase === 'idle') setSecondsLeft(sec);
                }}
                className={`px-3 py-1 rounded-lg border text-xs font-bold font-mono transition ${
                  prepSecs === sec
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
