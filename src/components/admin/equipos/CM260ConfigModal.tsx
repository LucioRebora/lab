"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
    X, 
    Save, 
    Loader2, 
    Plus, 
    Trash2,
    Settings2,
    Search,
    Beaker,
    Edit2,
    Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Alert } from "@/components/ui/Alert";

interface MapperCM260 {
    id: string;
    codigoExterno: string;
    subDeterminationId: string;
    tecnica: string;
    subDetermination?: {
        nombre: string;
        codigoExterno: string;
        determination?: {
            id: string;
            nombre: string;
            codigo?: string;
        };
    };
}

interface Determination {
    id: string;
    nombre: string;
}

interface SubDetermination {
    id: string;
    nombre: string;
    codigoExterno: string;
    determinationId: string;
}

interface CM260ModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentId: string;
    equipmentNombre: string;
    laboratoryId: string;
}

export function CM260ConfigModal({ 
    isOpen, 
    onClose, 
    equipmentId, 
    equipmentNombre,
    laboratoryId 
}: CM260ModalProps) {
    const [configs, setConfigs] = useState<MapperCM260[]>([]);
    const [determinations, setDeterminations] = useState<Determination[]>([]);
    const [subDeterminations, setSubDeterminations] = useState<SubDetermination[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Partial<MapperCM260>>({});
    const [confirmDelete, setConfirmDelete] = useState<{ id: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // States for adding
    const [selectedDetId, setSelectedDetId] = useState("");
    const [newConfig, setNewConfig] = useState<Partial<MapperCM260>>({
        codigoExterno: "",
        subDeterminationId: "",
        tecnica: ""
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfigs();
            fetchDeterminations();
            fetchSubDeterminations();
        }
    }, [isOpen, equipmentId, laboratoryId]);

    const fetchConfigs = async () => {
        try {
            const res = await fetch(`/api/equipments/${equipmentId}/config?labId=${laboratoryId}`);
            if (res.ok) {
                const data = await res.ok ? await res.json() : [];
                setConfigs(data);
            }
        } catch (error) {
            toast.error("Error al cargar configuraciones");
        } finally {
            setLoading(false);
        }
    };

    const fetchDeterminations = async () => {
        try {
            const res = await fetch(`/api/determinations`);
            if (res.ok) {
                const data = await res.json();
                setDeterminations(data);
            }
        } catch (error) {
            console.error("Error fetching determinations");
        }
    };

    const fetchSubDeterminations = async () => {
        try {
            const res = await fetch(`/api/sub-determinations?laboratoryId=${laboratoryId}`);
            if (res.ok) {
                const data = await res.json();
                setSubDeterminations(data);
            }
        } catch (error) {
            console.error("Error fetching subdeterminations");
        }
    };

    const handleSave = async (config: Partial<MapperCM260>) => {
        if (!config.subDeterminationId || !config.tecnica) {
            toast.error("Complete todos los campos");
            return;
        }

        setSaving(true);
        setError(null);
        try {
            const res = await fetch(`/api/equipments/${equipmentId}/config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...config, laboratoryId })
            });

            if (res.ok) {
                toast.success(config.id ? "Actualizado" : "Guardado");
                fetchConfigs();
                setIsAdding(false);
                setEditingId(null);
                setNewConfig({ codigoExterno: "", subDeterminationId: "", tecnica: "" });
            } else {
                const err = await res.json();
                setError(err.error || "Error al guardar");
            }
        } catch (error) {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/equipments/${equipmentId}/config/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Eliminado");
                fetchConfigs();
                setConfirmDelete(null);
            } else {
                toast.error("Error al eliminar");
            }
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeleteLoading(false);
        }
    };

    const startEditing = (config: MapperCM260) => {
        setEditingId(config.id);
        setEditValues(config);
    };

    const filteredConfigs = configs.filter(c => 
        c.subDetermination?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.tecnica.toLowerCase().includes(search.toLowerCase()) ||
        c.subDetermination?.determination?.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (c.subDetermination?.determination as any)?.codigo?.toLowerCase().includes(search.toLowerCase())
    );

    const availableSubDeterminations = useMemo(() => {
        if (!selectedDetId) return [];
        return subDeterminations.filter(sd => sd.determinationId === selectedDetId);
    }, [selectedDetId, subDeterminations]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-900 z-10">
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                                    Parametrización: {equipmentNombre}
                                </h3>
                                <p className="text-xs text-zinc-500 font-medium mt-1">Gestión de técnicas y protocolos LIS</p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Add Bar */}
                        <div className="p-6 border-b border-zinc-50 dark:border-zinc-800/50 flex flex-col md:flex-row gap-4 shrink-0 bg-zinc-50/30 dark:bg-zinc-800/20">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input 
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar por técnica o determinación..."
                                    className="w-full h-11 pl-11 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                                />
                            </div>
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="h-11 px-6 bg-emerald-500 text-white rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <Plus size={16} />
                                Agregar Técnica
                            </button>
                        </div>

                        {/* Content Header (Sticky) */}
                        <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-zinc-50 dark:bg-zinc-800/40 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <div className="col-span-3">Determinación</div>
                            <div className="col-span-3">Sub-Determinación</div>
                            <div className="col-span-3 text-center">Técnica</div>
                            <div className="col-span-3 text-right">Acciones</div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {error && (
                                <div className="px-8 pt-4">
                                    <Alert 
                                        message={error}
                                        variant="error"
                                        onClose={() => setError(null)}
                                    />
                                </div>
                            )}
                            <AnimatePresence mode="popLayout">
                                {isAdding && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="border-b border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-500/5"
                                    >
                                        <div className="grid grid-cols-12 gap-3 p-4 px-8 items-center">
                                            <div className="col-span-3">
                                                <select 
                                                    value={selectedDetId}
                                                    onChange={(e) => {
                                                        setSelectedDetId(e.target.value);
                                                        setNewConfig({ ...newConfig, subDeterminationId: "" });
                                                    }}
                                                    className="w-full h-9 px-3 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all appearance-none"
                                                >
                                                    <option value="">Determinación...</option>
                                                    {determinations.map(d => (
                                                        <option key={d.id} value={d.id}>
                                                            {(d as any).codigo ? `[${(d as any).codigo}] ` : ""}{d.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <select 
                                                    disabled={!selectedDetId}
                                                    value={newConfig.subDeterminationId}
                                                    onChange={(e) => setNewConfig({ ...newConfig, subDeterminationId: e.target.value })}
                                                    className="w-full h-9 px-3 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold outline-none border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all disabled:opacity-50 appearance-none"
                                                >
                                                    <option value="">Sub-Det...</option>
                                                    {availableSubDeterminations.map(sd => (
                                                        <option key={sd.id} value={sd.id}>{sd.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input 
                                                    value={newConfig.tecnica}
                                                    onChange={(e) => setNewConfig({ ...newConfig, tecnica: e.target.value })}
                                                    placeholder="Técnica"
                                                    className="w-full h-9 px-3 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold text-center outline-none border border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 transition-all"
                                                />
                                            </div>
                                            <div className="col-span-3 flex justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleSave(newConfig)}
                                                    className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                                </button>
                                                <button 
                                                    onClick={() => setIsAdding(false)}
                                                    className="w-9 h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50 px-4">
                                {loading ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-3">
                                        <Loader2 size={32} className="animate-spin text-zinc-300" />
                                        <p className="text-sm text-zinc-400 font-medium tracking-tight">Cargando parámetros...</p>
                                    </div>
                                ) : filteredConfigs.length > 0 ? (
                                    filteredConfigs.map((config) => (
                                        <div key={config.id} className={cn(
                                            "grid grid-cols-12 gap-4 p-3 px-4 items-center group transition-all",
                                            editingId === config.id ? "bg-emerald-50/30 dark:bg-emerald-500/5 rounded-2xl" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 rounded-2xl"
                                        )}>
                                            <div className="col-span-3 flex items-center gap-2">
                                                {(config.subDetermination as any)?.determination?.codigo && (
                                                    <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded text-[10px] font-black uppercase tracking-widest shrink-0">
                                                        {(config.subDetermination as any).determination.codigo}
                                                    </span>
                                                )}
                                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                                    {(config.subDetermination as any)?.determination?.nombre}
                                                </span>
                                            </div>
                                            
                                            <div className="col-span-3 flex items-center gap-2">
                                                <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                    <Beaker size={12} />
                                                </div>
                                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 line-clamp-1">
                                                    {config.subDetermination?.nombre}
                                                </span>
                                            </div>

                                            <div className="col-span-3 text-center">
                                                {editingId === config.id ? (
                                                    <input 
                                                        value={editValues.tecnica}
                                                        onChange={(e) => setEditValues({ ...editValues, tecnica: e.target.value })}
                                                        className="w-full h-9 bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-lg text-xs font-black text-center outline-none focus:ring-2 focus:ring-emerald-500/20"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-lg">
                                                        {config.tecnica}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="col-span-3 flex justify-end gap-2">
                                                {editingId === config.id ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleSave(editValues)}
                                                            className="w-9 h-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
                                                        >
                                                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={16} />}
                                                        </button>
                                                        <button 
                                                            onClick={() => setEditingId(null)}
                                                            className="w-9 h-9 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => startEditing(config)}
                                                            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setConfirmDelete({ id: config.id })}
                                                            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-200 dark:text-zinc-700">
                                            <Settings2 size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-zinc-500 font-bold">No se encontraron configuraciones</p>
                                            <p className="text-xs text-zinc-400">Intente con otro término de búsqueda o agregue una nueva técnica.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 shrink-0">
                            <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Mapeo activo: LIS Comunicaciones
                                </div>
                                <div>Total: {filteredConfigs.length} Registros</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
            <ConfirmModal 
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete.id)}
                title="¿Eliminar Configuración?"
                description="Se eliminará el mapeo de esta técnica para este equipo. Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleteLoading}
                variant="danger"
            />
        </AnimatePresence>
    );
}
