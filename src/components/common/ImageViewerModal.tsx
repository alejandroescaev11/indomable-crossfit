import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Move } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  tag?: string;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  tag,
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastTouchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef(1);
  const lastTapRef = useRef<number>(0);

  // Reiniciar estado cada vez que se abre el visor o cambia la imagen
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, imageUrl]);

  // Permitir cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(5, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Doble toque o doble clic para alternar entre 100% y 250%
  const handleDoubleTap = (clientX: number, clientY: number) => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2.5);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = (rect.width / 2 - (clientX - rect.left)) * 1.5;
        const offsetY = (rect.height / 2 - (clientY - rect.top)) * 1.5;
        setPosition({ x: offsetX, y: offsetY });
      }
    }
  };

  // Zoom con rueda de mouse en escritorio
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.003;
    setScale((prev) => {
      const next = Math.min(5, Math.max(1, Number((prev + delta).toFixed(2))));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Arrastre con mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Gestos táctiles en móviles (pellizcar para zoom + arrastrar con 1 dedo)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistRef.current = dist;
      initialScaleRef.current = scale;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        handleDoubleTap(e.touches[0].clientX, e.touches[0].clientY);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / lastTouchDistRef.current;
      const nextScale = Math.min(5, Math.max(1, Number((initialScaleRef.current * ratio).toFixed(2))));
      setScale(nextScale);
      if (nextScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchDistRef.current = null;
    if (scale <= 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-fadeIn"
      onWheel={handleWheel}
      onMouseUp={handleMouseUp}
    >
      {/* Barra Superior con Título y Botón Cerrar */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2 max-w-[70%]">
          {tag && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shrink-0">
              {tag}
            </span>
          )}
          {title && (
            <h3 className="text-white text-sm font-bold truncate">
              {title}
            </h3>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-white transition-colors flex items-center justify-center shadow-lg"
          title="Cerrar visor"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Área Central Interactiva de Imagen y Zoom */}
      <div
        ref={containerRef}
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={(e) => handleDoubleTap(e.clientX, e.clientY)}
      >
        <div
          className="transition-transform duration-75 ease-out will-change-transform flex items-center justify-center w-full h-full p-2"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0px) scale(${scale})`,
          }}
        >
          <img
            src={imageUrl}
            alt={title || 'Imagen del anuncio'}
            className="max-h-[85vh] max-w-[95vw] object-contain select-none pointer-events-none drop-shadow-2xl"
            draggable={false}
          />
        </div>
      </div>

      {/* Barra Inferior con Controles de Zoom */}
      <div className="relative z-20 flex flex-col items-center gap-2 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent">
        <div className="flex items-center gap-3 bg-zinc-900/95 border border-zinc-700/60 rounded-full px-4 py-2 backdrop-blur-md shadow-2xl">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Reducir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2.5 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-white transition-colors"
            title="Restablecer tamaño"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          <button
            type="button"
            onClick={handleResetZoom}
            className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Restablecer zoom a 100%"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 text-center font-medium flex items-center gap-1.5">
          <Move className="w-3 h-3 text-red-400 shrink-0" />
          <span>Doble toque para zoom rápido • Pellizca con 2 dedos o usa botones para ampliar</span>
        </p>
      </div>
    </div>
  );
};
