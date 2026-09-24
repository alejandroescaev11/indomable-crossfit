import React, { useState, useMemo, useRef } from 'react';
import {
  Camera,
  Upload,
  Calendar,
  Sparkles,
  Trash2,
  Maximize2,
  X,
  Plus,
  Scale,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { ProgressPhoto, ProgressPhotoPose } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';

interface ProgressPhotosReelViewProps {
  athleteIdOverride?: string;
}

export const ProgressPhotosReelView: React.FC<ProgressPhotosReelViewProps> = ({
  athleteIdOverride,
}) => {
  const {
    currentAthlete,
    currentAthleteId,
    role,
    currentCoach,
    athletes,
    progressPhotos,
    saveProgressPhoto,
    deleteProgressPhoto,
  } = useGym();

  const targetAthleteId = athleteIdOverride || currentAthleteId;
  const targetAthlete = useMemo(() => {
    return athletes.find((a) => a.id === targetAthleteId) || currentAthlete;
  }, [athletes, targetAthleteId, currentAthlete]);

  // All photos for this athlete sorted by date descending (newest first)
  const photos = useMemo(() => {
    if (!targetAthleteId) return [];
    return progressPhotos
      .filter((p) => p.athleteId === targetAthleteId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progressPhotos, targetAthleteId]);

  // Chronological photos (oldest first) useful for before/after default selection
  const chronologicalPhotos = useMemo(() => {
    return [...photos].reverse();
  }, [photos]);

  // View mode: 'reel' (carrete / galería) or 'compare' (antes / después)
  const [activeTab, setActiveTab] = useState<'compare' | 'reel'>('compare');
  const [filterPose, setFilterPose] = useState<'all' | ProgressPhotoPose>('all');

  // Filtered photos for reel view
  const filteredPhotos = useMemo(() => {
    if (filterPose === 'all') return photos;
    return photos.filter((p) => p.pose === filterPose);
  }, [photos, filterPose]);

  // Comparator states: IDs of Photo A (Before) and Photo B (After)
  const [beforePhotoId, setBeforePhotoId] = useState<string>('');
  const [afterPhotoId, setAfterPhotoId] = useState<string>('');

  // Default selection when photos load
  const selectedBeforePhoto = useMemo(() => {
    if (beforePhotoId) {
      const found = photos.find((p) => p.id === beforePhotoId);
      if (found) return found;
    }
    // Default to the oldest photo
    return chronologicalPhotos[0] || null;
  }, [beforePhotoId, photos, chronologicalPhotos]);

  const selectedAfterPhoto = useMemo(() => {
    if (afterPhotoId) {
      const found = photos.find((p) => p.id === afterPhotoId);
      if (found) return found;
    }
    // Default to the newest photo (different from before if possible)
    if (photos.length > 1) {
      return photos[0] || null;
    }
    return null;
  }, [afterPhotoId, photos]);

  // Days elapsed between Before & After
  const daysDifference = useMemo(() => {
    if (!selectedBeforePhoto || !selectedAfterPhoto) return null;
    const d1 = new Date(selectedBeforePhoto.date).getTime();
    const d2 = new Date(selectedAfterPhoto.date).getTime();
    const diff = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
    return diff;
  }, [selectedBeforePhoto, selectedAfterPhoto]);

  // Weight delta
  const weightDelta = useMemo(() => {
    if (
      selectedBeforePhoto?.weightKg !== undefined &&
      selectedAfterPhoto?.weightKg !== undefined
    ) {
      return Number(
        (selectedAfterPhoto.weightKg - selectedBeforePhoto.weightKg).toFixed(1)
      );
    }
    return null;
  }, [selectedBeforePhoto, selectedAfterPhoto]);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDate, setUploadDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [uploadPose, setUploadPose] = useState<ProgressPhotoPose>('frente');
  const [uploadWeight, setUploadWeight] = useState<string>('');
  const [uploadNotes, setUploadNotes] = useState<string>('');
  const [uploadImageData, setUploadImageData] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zoom / Fullscreen Viewer State
  const [zoomPhoto, setZoomPhoto] = useState<ProgressPhoto | null>(null);

  // Delete Confirmation State
  const [photoToDelete, setPhotoToDelete] = useState<ProgressPhoto | null>(null);

  // Handle File Select & Client-Side Compression
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsCompressing(true);
    try {
      // Compress to high quality max 1200x1200px
      const compressedBase64 = await compressImageFile(file, 1200, 1200, 0.82);
      setUploadImageData(compressedBase64);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al procesar la imagen seleccionada.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Submit Upload
  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAthleteId) return;

    if (!uploadImageData) {
      setUploadError('Por favor selecciona o toma una foto.');
      return;
    }

    setIsSaving(true);
    try {
      const parsedWeight = uploadWeight ? parseFloat(uploadWeight) : undefined;
      const evaluatorName =
        currentCoach?.name || (role === 'admin' ? 'Administrador' : currentAthlete?.name || 'Atleta');

      const newPhoto: ProgressPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        athleteId: targetAthleteId,
        date: uploadDate,
        imageUrl: uploadImageData,
        pose: uploadPose,
        weightKg: isNaN(Number(parsedWeight)) ? undefined : parsedWeight,
        notes: uploadNotes.trim() || undefined,
        evaluatorName,
        createdAt: new Date().toISOString(),
      };

      await saveProgressPhoto(newPhoto);

      // Reset form
      setIsUploadModalOpen(false);
      setUploadImageData('');
      setUploadNotes('');
      setUploadWeight('');
      setUploadPose('frente');
      setUploadDate(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al guardar la fotografía.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;
    try {
      await deleteProgressPhoto(photoToDelete.id);
      if (beforePhotoId === photoToDelete.id) setBeforePhotoId('');
      if (afterPhotoId === photoToDelete.id) setAfterPhotoId('');
      if (zoomPhoto?.id === photoToDelete.id) setZoomPhoto(null);
      setPhotoToDelete(null);
    } catch (err) {
      console.error('Error al eliminar foto:', err);
    }
  };

  const getPoseLabel = (pose: ProgressPhotoPose) => {
    switch (pose) {
      case 'frente':
        return 'Frente';
      case 'perfil':
        return 'Perfil';
      case 'espalda':
        return 'Espalda';
      case 'libre':
        return 'Libre';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in select-none">
      {/* Top Banner & Action Controls */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-wider">
              Seguimiento Visual • Plan Personalizado
            </span>
            <span className="text-xs text-zinc-400 font-bold">
              {targetAthlete?.name || 'Atleta'}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-['Teko'] uppercase text-white tracking-wide">
            EVOLUCIÓN & FOTOS DE PROGRESO
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Registra tu transformación física semana a semana. Compara fotografías tipo
            antes/después en diferentes posturas para evaluar hipertrofia, definición y postura.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setUploadError('');
            setUploadImageData('');
            setIsUploadModalOpen(true);
          }}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-red-950/60 active:scale-95 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer border border-red-500/30"
        >
          <Camera className="w-4 h-4" />
          <span>Subir Foto de Progreso</span>
        </button>
      </div>

      {/* Subtabs: Comparador Antes/Después vs Carrete Completo */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Comparador Antes / Después</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reel')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reel'
                ? 'bg-red-600 text-white shadow-lg shadow-red-950/50'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Carrete Cronológico ({photos.length})</span>
          </button>
        </div>

        {/* Pose Filter (Visible in Reel View) */}
        {activeTab === 'reel' && photos.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {(['all', 'frente', 'perfil', 'espalda', 'libre'] as const).map((pose) => (
              <button
                key={pose}
                type="button"
                onClick={() => setFilterPose(pose)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider transition shrink-0 cursor-pointer ${
                  filterPose === pose
                    ? 'bg-zinc-200 text-black font-black'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {pose === 'all' ? 'Todas' : getPoseLabel(pose)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black font-['Teko'] uppercase text-white tracking-wide">
              Aún no hay fotos registradas
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Comienza hoy subiendo tu foto inicial de frente, perfil o espalda para iniciar
              el comparador de progreso de tu plan personalizado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md shadow-red-950/60 cursor-pointer border border-red-700/50"
          >
            Subir Primera Foto
          </button>
        </div>
      )}

      {/* 1. COMPARADOR ANTES / DESPUÉS */}
      {activeTab === 'compare' && photos.length > 0 && (
        <div className="space-y-6">
          {/* Delta Statistics Banner */}
          {selectedBeforePhoto && selectedAfterPhoto && (
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Tiempo de Evolución Comparado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-['Teko'] text-white uppercase tracking-wide">
                      {daysDifference === 0
                        ? 'Mismo día'
                        : daysDifference === 1
                        ? '1 día transcurrido'
                        : `${daysDifference} días transcurridos`}
                    </span>
                    {daysDifference !== null && daysDifference > 0 && (
                      <span className="text-xs text-emerald-400 font-bold">
                        (~{Math.round(daysDifference / 7)} semanas)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {weightDelta !== null && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl">
                  <Scale className="w-4 h-4 text-zinc-400" />
                  <div>
                    <span className="text-[10px] text-zinc-400 uppercase font-bold block">
                      Variación de Peso
                    </span>
                    <span
                      className={`text-sm font-black font-mono ${
                        weightDelta > 0
                          ? 'text-emerald-400'
                          : weightDelta < 0
                          ? 'text-amber-400'
                          : 'text-zinc-300'
                      }`}
                    >
                      {weightDelta > 0 ? `+${weightDelta} kg` : `${weightDelta} kg`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Side-by-Side Dual View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* CARD ANTES */}
            <div className="rounded-3xl bg-zinc-950 border border-emerald-500/30 overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-wider">
                    ANTES 🟢
                  </span>
                  <span className="text-xs font-bold text-emerald-200">
                    {selectedBeforePhoto ? selectedBeforePhoto.date : 'Sin seleccionar'}
                  </span>
                </div>

                {/* Dropdown selector for Before */}
                <select
                  value={selectedBeforePhoto?.id || ''}
                  onChange={(e) => setBeforePhotoId(e.target.value)}
                  className="bg-zinc-900 border border-emerald-500/40 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.date} • {getPoseLabel(p.pose)}{' '}
                      {p.weightKg ? `(${p.weightKg}kg)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBeforePhoto ? (
                <div className="relative flex-1 bg-black flex items-center justify-center group min-h-[360px] max-h-[520px] overflow-hidden">
                  <img
                    src={selectedBeforePhoto.imageUrl}
                    alt="Foto Antes"
                    className="w-full h-full object-contain max-h-[520px] transition duration-300 group-hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomPhoto(selectedBeforePhoto)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur border border-zinc-700 transition"
                    title="Ver pantalla completa"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur border border-zinc-800 text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>{getPoseLabel(selectedBeforePhoto.pose)}</span>
                    {selectedBeforePhoto.weightKg && (
                      <span className="text-zinc-400 font-mono">
                        • {selectedBeforePhoto.weightKg} kg
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 text-xs flex-1 flex items-center justify-center">
                  Selecciona una foto para comparar
                </div>
              )}

              {selectedBeforePhoto?.notes && (
                <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 text-xs text-zinc-300 italic flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span>{selectedBeforePhoto.notes}</span>
                </div>
              )}
            </div>

            {/* CARD DESPUÉS */}
            <div className="rounded-3xl bg-zinc-950 border border-red-500/30 overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 bg-red-950/30 border-b border-red-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                    DESPUÉS 🔥
                  </span>
                  <span className="text-xs font-bold text-red-200">
                    {selectedAfterPhoto ? selectedAfterPhoto.date : 'Sin seleccionar'}
                  </span>
                </div>

                {/* Dropdown selector for After */}
                <select
                  value={selectedAfterPhoto?.id || ''}
                  onChange={(e) => setAfterPhotoId(e.target.value)}
                  className="bg-zinc-900 border border-red-500/40 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-400 cursor-pointer"
                >
                  {photos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.date} • {getPoseLabel(p.pose)}{' '}
                      {p.weightKg ? `(${p.weightKg}kg)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAfterPhoto ? (
                <div className="relative flex-1 bg-black flex items-center justify-center group min-h-[360px] max-h-[520px] overflow-hidden">
                  <img
                    src={selectedAfterPhoto.imageUrl}
                    alt="Foto Después"
                    className="w-full h-full object-contain max-h-[520px] transition duration-300 group-hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => setZoomPhoto(selectedAfterPhoto)}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur border border-zinc-700 transition"
                    title="Ver pantalla completa"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur border border-zinc-800 text-[11px] font-bold text-white flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{getPoseLabel(selectedAfterPhoto.pose)}</span>
                    {selectedAfterPhoto.weightKg && (
                      <span className="text-zinc-400 font-mono">
                        • {selectedAfterPhoto.weightKg} kg
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-zinc-500 text-xs flex-1 flex items-center justify-center">
                  Sube al menos 2 fotos para habilitar el comparador automático
                </div>
              )}

              {selectedAfterPhoto?.notes && (
                <div className="p-3 bg-zinc-900/60 border-t border-zinc-800 text-xs text-zinc-300 italic flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span>{selectedAfterPhoto.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. CARRETE CRONOLÓGICO / GALERÍA COMPLETA */}
      {activeTab === 'reel' && photos.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-lg hover:border-zinc-700 transition-all flex flex-col"
              >
                {/* Thumbnail Image */}
                <div
                  onClick={() => setZoomPhoto(photo)}
                  className="aspect-square bg-black overflow-hidden relative cursor-pointer"
                >
                  <img
                    src={photo.imageUrl}
                    alt={`Foto ${photo.date}`}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                    <span className="text-[10px] text-white font-bold flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Ver Detalle
                    </span>
                  </div>

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur text-[10px] font-black uppercase tracking-wider text-white border border-zinc-800">
                    {getPoseLabel(photo.pose)}
                  </span>
                </div>

                {/* Footer Info */}
                <div className="p-3 bg-zinc-950 flex flex-col justify-between flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {photo.date}
                    </span>
                    {photo.weightKg && (
                      <span className="font-mono text-[11px] text-emerald-400 font-bold">
                        {photo.weightKg} kg
                      </span>
                    )}
                  </div>

                  {photo.notes && (
                    <p className="text-[11px] text-zinc-400 truncate mb-2">
                      {photo.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-900 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setBeforePhotoId(photo.id);
                        setActiveTab('compare');
                      }}
                      className="text-[10px] text-zinc-400 hover:text-emerald-400 font-bold uppercase transition"
                    >
                      Usar de "Antes"
                    </button>

                    <button
                      type="button"
                      onClick={() => setPhotoToDelete(photo)}
                      className="p-1 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-zinc-900 transition"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: SUBIR NUEVA FOTOGRAFÍA */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-zinc-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black font-['Teko'] tracking-wider text-white uppercase text-lg">
                  Subir Foto de Progreso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-zinc-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleSavePhoto} className="space-y-4">
              {/* Image Input & Preview */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadImageData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-black aspect-video flex items-center justify-center">
                    <img
                      src={uploadImageData}
                      alt="Vista previa"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setUploadImageData('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 text-white hover:bg-red-600 transition"
                      title="Quitar foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-800 hover:border-red-600 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-zinc-900/40 hover:bg-zinc-900/80 group"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-zinc-800 group-hover:bg-red-600/20 text-zinc-400 group-hover:text-red-400 flex items-center justify-center transition mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      {isCompressing
                        ? 'Comprimiendo imagen...'
                        : 'Toca para seleccionar o tomar una foto'}
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      JPG o PNG. Se optimiza y comprime de forma automática.
                    </p>
                  </div>
                )}
              </div>

              {/* Grid Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Fecha de la Foto
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                {/* Weight reference */}
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">
                    Peso Corporal Opcional (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="250"
                    value={uploadWeight}
                    onChange={(e) => setUploadWeight(e.target.value)}
                    placeholder="Ej: 75.5"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Pose Selection Pills */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                  Postura / Ángulo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['frente', 'perfil', 'espalda', 'libre'] as const).map((pose) => (
                    <button
                      key={pose}
                      type="button"
                      onClick={() => setUploadPose(pose)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold uppercase transition text-center cursor-pointer ${
                        uploadPose === pose
                          ? 'bg-red-600 text-white shadow-md shadow-red-950/60'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      {getPoseLabel(pose)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Notas de Observación (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Ej: Semana 8 de plan. Mayor vascularización y corte abdominal..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-white focus:border-red-600 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isCompressing || !uploadImageData}
                  className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider transition shadow-md shadow-red-950/60 disabled:opacity-50 cursor-pointer border border-red-700/50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Fotografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: FULLSCREEN PHOTO ZOOM */}
      {zoomPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-lg animate-in fade-in select-none">
          <div className="relative w-full max-w-4xl max-h-[95vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomPhoto(null)}
              className="absolute -top-3 sm:-top-4 -right-2 sm:-right-2 z-50 p-2 rounded-full bg-zinc-900/90 text-white hover:bg-red-600 transition border border-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full flex items-center justify-center bg-black/80 rounded-3xl overflow-hidden border border-zinc-800 max-h-[80vh]">
              <img
                src={zoomPhoto.imageUrl}
                alt="Foto Ampliada"
                className="max-h-[78vh] w-auto object-contain"
              />
            </div>

            <div className="w-full mt-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-400 font-bold uppercase text-[10px]">
                  {getPoseLabel(zoomPhoto.pose)}
                </span>
                <span className="text-white font-bold">{zoomPhoto.date}</span>
                {zoomPhoto.weightKg && (
                  <span className="text-emerald-400 font-mono font-bold">
                    {zoomPhoto.weightKg} kg
                  </span>
                )}
              </div>

              {zoomPhoto.notes && (
                <p className="text-zinc-400 italic text-xs max-w-md truncate">
                  "{zoomPhoto.notes}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {photoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-400">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black font-['Teko'] uppercase text-white tracking-wide">
                ¿Eliminar esta fotografía?
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Se eliminará la foto del día{' '}
                <strong className="text-white">{photoToDelete.date}</strong> (
                {getPoseLabel(photoToDelete.pose)}). Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPhotoToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-950/60 border border-red-700/50"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
