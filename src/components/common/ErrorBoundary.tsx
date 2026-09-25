import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('INDOMABLE App Catch:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-[100dvh] w-full bg-black text-zinc-100 flex flex-col items-center justify-center p-6 text-center selection:bg-red-600 selection:text-white">
          <div className="max-w-md w-full rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500 shadow-xl shadow-red-950/80">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Teko'] uppercase tracking-wide text-white">
                ALGO SALIÓ MAL EN LA APLICACIÓN
              </h1>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Ocurrió un error inesperado al cargar esta pantalla. No te preocupes, tus datos están seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-red-400 text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-red-800 hover:bg-red-700 text-white py-3 text-xs font-black uppercase tracking-wider transition shadow-lg border border-red-700/50"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar Aplicación</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white px-4 py-3 text-xs font-bold transition"
                title="Limpiar datos temporales e iniciar sesión de nuevo"
              >
                <Home className="w-4 h-4" />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
