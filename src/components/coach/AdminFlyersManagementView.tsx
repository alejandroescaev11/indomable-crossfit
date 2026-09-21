import React, { useState, useRef, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { GymFlyer } from '../../types';
import { compressImageFile } from '../../utils/imageUtils';
import {
  getNotificationPermission,
  requestNotificationPermission,
} from '../../utils/notificationUtils';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  X,
  Pin,
  Clock,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Bell,
  BellRing,
} from 'lucide-react';

export const AdminFlyersManagementView: React.FC = () => {
  const { flyers, saveFlyer, deleteFlyer, role } = useGym();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFlyer, setEditingFlyer] = useState<GymFlyer | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTag, setFormTag] = useState<GymFlyer['tag']>('AVISO');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [imageError, setImageError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Estado y diagnóstico de notificaciones
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleRequestNotif = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  const filteredFlyers = flyers.filter((f) => {
    if (statusFilter === 'active') return f.isActive !== false;
    if (statusFilter === 'inactive') return f.isActive === false;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingFlyer(null);
    setFormTitle('');
    setFormImageUrl('');
    setImageError('');
    setFormTag('AVISO');
    setFormDescription('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormIsActive(true);
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (flyer: GymFlyer) => {
    setEditingFlyer(flyer);
    setFormTitle(flyer.title);
    setFormImageUrl(flyer.imageUrl);
    setImageError('');
    setFormTag(flyer.tag || 'AVISO');
    setFormDescription(flyer.description || '');
    setFormDate(flyer.date || new Date().toISOString().split('T')[0]);
    setFormIsActive(flyer.isActive !== false);
    setFormIsPinned(!!flyer.isPinned);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError('');
    setIsCompressingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 1200, 1200, 0.78);
      setFormImageUrl(compressedDataUrl);
    } catch (err: any) {
      console.error('Error al procesar imagen:', err);
      setImageError(err.message || 'No se pudo procesar la imagen seleccionada.');
    } finally {
      setIsCompressingImage(false);
      // Reset input value so re-selecting the same file triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleActive = async (flyer: GymFlyer) => {
    const updated: GymFlyer = {
      ...flyer,
      isActive: flyer.isActive === false ? true : false,
    };
    await saveFlyer(updated);
  };

  const handleTogglePinned = async (flyer: GymFlyer) => {
    const updated: GymFlyer = {
      ...flyer,
      isPinned: !flyer.isPinned,
    };
    await saveFlyer(updated);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el aviso "${title}"?`)) {
      await deleteFlyer(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageError('');
    if (!formTitle.trim()) return;
    if (!formImageUrl.trim()) {
      setImageError('Debes seleccionar o cargar una imagen para el aviso antes de publicar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const flyerData: GymFlyer = {
        id: editingFlyer ? editingFlyer.id : `flyer_${Date.now()}`,
        title: formTitle.trim(),
        imageUrl: formImageUrl.trim(),
        tag: formTag,
        description: formDescription.trim(),
        date: formDate,
        isActive: formIsActive,
        isPinned: formIsPinned,
        createdAt: editingFlyer?.createdAt || new Date().toISOString(),
      };

      await saveFlyer(flyerData);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'EVENTO':
        return 'bg-red-600/30 text-red-400 border-red-600/40';
      case 'PROMO':
        return 'bg-emerald-600/30 text-emerald-400 border-emerald-600/40';
      case 'TORNEO':
        return 'bg-amber-600/30 text-amber-400 border-amber-600/40';
      case 'HORARIO':
        return 'bg-sky-600/30 text-sky-400 border-sky-600/40';
      case 'COMUNIDAD':
        return 'bg-purple-600/30 text-purple-400 border-purple-600/40';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/20 text-red-500 border border-red-600/30">
                <Megaphone className="h-4 w-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-red-500">
                COMUNICACIÓN & EVENTOS DEL BOX
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Teko'] tracking-wide">
              GESTIÓN DE AVISOS, FLYERS & CARTELERA
            </h2>
            <p className="text-xs text-zinc-400 max-w-xl">
              Publica, programa, pausa o elimina los afiches y comunicados que ven los atletas en la pantalla de inicio.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-red-950/60 transition active:scale-95 border border-red-500/40 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Publicar Nuevo Aviso</span>
          </button>
        </div>
      </div>

      {/* Barra de Diagnóstico y Estado de Notificaciones Web */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              notifPermission === 'granted'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : notifPermission === 'denied'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Canal de Notificaciones de Anuncios
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  notifPermission === 'granted'
                    ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                    : notifPermission === 'denied'
                    ? 'bg-red-950/60 border-red-700/50 text-red-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                }`}
              >
                {notifPermission === 'granted'
                  ? 'ACTIVO & VINCULADO'
                  : notifPermission === 'denied'
                  ? 'BLOQUEADO EN NAVEGADOR'
                  : 'PENDIENTE DE PERMISO'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {notifPermission === 'granted'
                ? 'Al guardar un aviso, sonará una alerta auditiva y se disparará la notificación nativa en los dispositivos.'
                : notifPermission === 'denied'
                ? 'El navegador tiene bloqueadas las notificaciones. Pulsa el ícono de candado 🔒 al lado del link para permitirlas.'
                : 'Concede permisos para recibir y comprobar avisos en este equipo o dispositivo móvil.'}
            </p>
          </div>
        </div>

        {notifPermission !== 'granted' && notifPermission !== 'denied' && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleRequestNotif}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition shadow-md shadow-red-950/50 cursor-pointer"
            >
              Activar Notificaciones
            </button>
          </div>
        )}
      </div>

      {/* Metrics & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-500 mr-1.5">Total:</span>
            <strong className="text-white">{flyers.length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-emerald-500 mr-1.5">Activos:</span>
            <strong className="text-white">{flyers.filter((f) => f.isActive !== false).length}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <span className="text-zinc-500 mr-1.5">Pausados:</span>
            <strong className="text-white">{flyers.filter((f) => f.isActive === false).length}</strong>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-black p-1 rounded-xl border border-zinc-800 text-xs font-bold self-end sm:self-center">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'all' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'active' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Solo Activos
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1 rounded-lg transition ${
              statusFilter === 'inactive' ? 'bg-red-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pausados
          </button>
        </div>
      </div>

      {/* Flyers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFlyers.map((flyer) => {
          const isActive = flyer.isActive !== false;
          return (
            <div
              key={flyer.id}
              className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-zinc-950 border-zinc-800/90 hover:border-zinc-700 shadow-md'
                  : 'bg-zinc-950/60 border-zinc-850 opacity-70'
              }`}
            >
              {/* Image Preview & Badges */}
              <div className="relative h-44 w-full bg-zinc-900 overflow-hidden">
                <img
                  src={flyer.imageUrl}
                  alt={flyer.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-lg border backdrop-blur-sm ${getTagColor(
                      flyer.tag
                    )}`}
                  >
                    {flyer.tag || 'AVISO'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {flyer.isPinned && (
                      <span className="p-1 rounded-lg bg-amber-500 text-black shadow" title="Fijado en cartelera">
                        <Pin className="w-3.5 h-3.5 fill-black" />
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                      }`}
                    >
                      {isActive ? 'Visible' : 'Oculto'}
                    </span>
                  </div>
                </div>

                {/* Bottom Title on Image */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-extrabold text-white text-base leading-tight drop-shadow">
                    {flyer.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-red-400" />
                    <span>{flyer.date || 'Publicación general'}</span>
                  </div>
                </div>
              </div>

              {/* Description & Action Bar */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                {flyer.description ? (
                  <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                    {flyer.description}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-600 italic">Sin descripción adicional.</p>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-zinc-850 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(flyer)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition ${
                        isActive
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-750'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                      }`}
                      title={isActive ? 'Pausar aviso (ocultar de atletas)' : 'Activar aviso'}
                    >
                      {isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTogglePinned(flyer)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition ${
                        flyer.isPinned
                          ? 'bg-amber-950/40 text-amber-300 border-amber-700/60'
                          : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border-zinc-750'
                      }`}
                      title={flyer.isPinned ? 'Desfijar' : 'Fijar arriba'}
                    >
                      <Pin className={`w-4 h-4 ${flyer.isPinned ? 'fill-amber-400' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(flyer)}
                      className="p-2 rounded-xl border border-zinc-750 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition"
                      title="Editar aviso"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(flyer.id, flyer.title)}
                    className="p-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-red-950/40 hover:border-red-800 text-zinc-500 hover:text-red-400 transition"
                    title="Eliminar permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredFlyers.length === 0 && (
          <div className="col-span-full rounded-2xl border border-zinc-800 bg-zinc-950 p-12 text-center text-zinc-400 space-y-3">
            <Megaphone className="w-12 h-12 mx-auto text-zinc-600" />
            <p className="text-base font-bold text-white">No hay avisos ni flyers publicados con este filtro</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Haz clic en "Publicar Nuevo Aviso" para anunciar eventos, torneos, horarios o noticias en la app.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 text-xs font-bold transition active:scale-95 shadow-md shadow-red-950/60"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Publicar Primer Aviso</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Publicar / Editar Aviso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl relative text-zinc-100 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-600/40 flex items-center justify-center text-red-500">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-xl text-white font-['Teko'] tracking-wide uppercase">
                  {editingFlyer ? 'Editar Aviso / Flyer' : 'Publicar Nuevo Aviso'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Visible de inmediato en el feed de todos los atletas.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Título del Aviso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Torneo Interno de Navidad 2026"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-semibold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Categoría / Etiqueta</label>
                  <select
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none font-semibold"
                  >
                    <option value="AVISO">📢 Aviso General</option>
                    <option value="EVENTO">🔥 Evento Especial</option>
                    <option value="PROMO">🎁 Promoción</option>
                    <option value="TORNEO">🏆 Torneo / Competencia</option>
                    <option value="HORARIO">⏰ Horario / Festivo</option>
                    <option value="COMUNIDAD">🤝 Comunidad</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Fecha de Publicación</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Carga de Imagen desde el Dispositivo (Sin URL ni Plantillas) */}
              <div>
                <label className="block font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Imagen del Flyer o Cartelera *</span>
                  <span className="text-[10px] text-zinc-500 font-normal">
                    Archivos JPG, PNG o WebP desde tu dispositivo
                  </span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="admin-flyer-image-upload"
                />

                {imageError && (
                  <div className="mb-2 p-2.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{imageError}</span>
                  </div>
                )}

                {isCompressingImage ? (
                  <div className="h-44 w-full rounded-2xl border-2 border-dashed border-red-600/50 bg-red-950/20 flex flex-col items-center justify-center text-center p-4">
                    <RefreshCw className="w-8 h-8 text-red-500 animate-spin mb-2" />
                    <p className="text-xs font-bold text-white">Optimizando y procesando imagen...</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Comprimiendo para carga ultra rápida</p>
                  </div>
                ) : formImageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 group">
                    <img
                      src={formImageUrl}
                      alt="Vista previa del flyer"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-3">
                      <div className="flex justify-between items-center">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-600/80 text-white font-bold text-[10px] border border-emerald-500/50">
                          ✓ Imagen cargada
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormImageUrl('')}
                          className="p-1 rounded-lg bg-black/70 hover:bg-red-600 text-zinc-300 hover:text-white transition"
                          title="Eliminar imagen"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <label
                          htmlFor="admin-flyer-image-upload"
                          className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-black/80 hover:bg-red-600 border border-zinc-600 text-white text-xs font-bold transition"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cambiar Imagen</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="admin-flyer-image-upload"
                    className="h-40 w-full rounded-2xl border-2 border-dashed border-zinc-750 hover:border-red-600/80 bg-zinc-900/60 hover:bg-zinc-900 flex flex-col items-center justify-center text-center p-4 cursor-pointer transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 group-hover:bg-red-600/20 border border-zinc-700 group-hover:border-red-500/40 flex items-center justify-center text-zinc-400 group-hover:text-red-400 mb-2 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-zinc-200 group-hover:text-white transition">
                      Toca aquí para seleccionar una foto o afiche
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-1">
                      Carga desde tu teléfono o computador • Se optimiza automáticamente
                    </p>
                  </label>
                )}
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Descripción / Detalles</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre inscripciones, premiación, horarios o recomendaciones..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-white focus:border-red-600 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Toggles: Active and Pinned */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <input
                    type="checkbox"
                    id="flyerIsActiveCheck"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-black text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="flyerIsActiveCheck" className="font-bold text-zinc-200 cursor-pointer">
                    Visible en app
                  </label>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  <input
                    type="checkbox"
                    id="flyerIsPinnedCheck"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 bg-black text-red-600 focus:ring-red-500"
                  />
                  <label htmlFor="flyerIsPinnedCheck" className="font-bold text-zinc-200 cursor-pointer flex items-center gap-1">
                    <Pin className="w-3 h-3 text-amber-400" />
                    Fijar al inicio
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-850">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-red-600 hover:bg-red-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-red-950/60 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingFlyer ? 'Guardar Cambios' : 'Publicar Aviso'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300"
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
