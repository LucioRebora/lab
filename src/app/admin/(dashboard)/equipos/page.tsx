"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Monitor, 
    Plus, 
    Search, 
    Settings2, 
    Cpu, 
    Activity, 
    ShieldCheck, 
    ChevronRight,
    ArrowLeft,
    Trash2,
    Edit2,
    ToggleLeft,
    ToggleRight,
    Loader2,
    X,
    Save,
    Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface Equipment {
    id: string;
    nombre: string;
    active: boolean;
    createdAt: string;
    laboratories: {
        id: string;
        nombre: string;
    }[];
}

interface Laboratory {
    id: string;
    nombre: string;
}

export default function EquiposPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [formData, setFormData] = useState<{ nombre: string; laboratoryIds: string[] }>({ 
        nombre: "", 
        laboratoryIds: [] 
    });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<Equipment | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchEquipments = useCallback(async () => {
        setLoading(true);
        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || session?.user?.laboratoryId;
            const url = labId ? `/api/equipments?labId=${labId}` : "/api/equipments";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setEquipments(data);
            }
        } catch (error) {
            toast.error("Error al cargar los equipos");
        } finally {
            setLoading(false);
        }
    }, [session]);

    const fetchLaboratories = async () => {
        try {
            const res = await fetch("/api/laboratories");
            if (res.ok) {
                const data = await res.json();
                setLaboratories(data);
            }
        } catch (error) {
            console.error("Error fetching laboratories:", error);
        }
    };

    useEffect(() => {
        fetchEquipments();
        fetchLaboratories();
    }, [fetchEquipments]);

    const handleOpenModal = (equipment: Equipment | null = null) => {
        const labId = localStorage.getItem('selectedLaboratoryId') || session?.user?.laboratoryId || '';
        if (equipment) {
            setEditingEquipment(equipment);
            setFormData({ 
                nombre: equipment.nombre, 
                laboratoryIds: equipment.laboratories.map(l => l.id)
            });
        } else {
            setEditingEquipment(null);
            setFormData({ 
                nombre: "", 
                laboratoryIds: labId ? [labId] : []
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nombre.trim() || formData.laboratoryIds.length === 0) {
            toast.error("Por favor completa todos los campos (al menos un laboratorio)");
            return;
        }

        setSaving(true);
        
        try {
            const url = editingEquipment ? `/api/equipments/${editingEquipment.id}` : "/api/equipments";
            const method = editingEquipment ? "PATCH" : "POST";
            
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingEquipment ? "Equipo actualizado" : "Equipo creado");
                setIsModalOpen(false);
                fetchEquipments();
            } else {
                toast.error("Error al guardar el equipo");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (equipment: Equipment) => {
        try {
            const res = await fetch(`/api/equipments/${equipment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ active: !equipment.active })
            });

            if (res.ok) {
                setEquipments(prev => prev.map(e => e.id === equipment.id ? { ...e, active: !e.active } : e));
                toast.success(equipment.active ? "Equipo deshabilitado" : "Equipo habilitado");
            }
        } catch (error) {
            toast.error("Error al cambiar el estado");
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);

        try {
            const res = await fetch(`/api/equipments/${confirmDelete.id}`, { method: "DELETE" });
            if (res.ok) {
                setEquipments(prev => prev.filter(e => e.id !== confirmDelete.id));
                toast.success("Equipo eliminado");
                setConfirmDelete(null);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filteredEquipments = equipments.filter(e => 
        e.nombre.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-5">
                    <Link 
                        href="/admin" 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Configuración</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Equipos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Gestión de instrumentos y equipos de medición</p>
                    </div>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    Nuevo Equipo
                </button>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                            <Settings2 size={20} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Equipos del Laboratorio</h3>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar equipo..."
                            className="w-full h-11 pl-11 pr-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                       <div className="p-20 text-center flex flex-col items-center gap-3">
                           <Loader2 size={32} className="animate-spin text-zinc-300" />
                           <p className="text-sm text-zinc-400 font-medium">Cargando equipos...</p>
                       </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20">
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nombre</th>
                                    {isAdmin && <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Laboratorios Asignados</th>}
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Estado</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {filteredEquipments.length > 0 ? (
                                    filteredEquipments.map((equipo) => (
                                        <tr key={equipo.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-inner group-hover:scale-110 transition-transform">
                                                        <Monitor size={22} className="text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{equipo.nombre}</div>
                                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">ID: {equipo.id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-8 py-5">
                                                    <div className="flex flex-wrap gap-2">
                                                        {equipo.laboratories.map(lab => (
                                                            <div key={lab.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700">
                                                                <Building2 size={12} className="text-zinc-400" />
                                                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tight">
                                                                    {lab.nombre}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {equipo.laboratories.length === 0 && (
                                                            <span className="text-xs text-zinc-400 italic">Ninguno</span>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                            <td className="px-8 py-5 text-center">
                                                <button 
                                                    onClick={() => handleToggleActive(equipo)}
                                                    className={cn(
                                                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                        equipo.active 
                                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" 
                                                            : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"
                                                    )}
                                                >
                                                    {equipo.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                    {equipo.active ? "Activado" : "Deshabilitado"}
                                                </button>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleOpenModal(equipo)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setConfirmDelete(equipo)}
                                                        className="w-9 h-9 flex items-center justify-center rounded-xl border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isAdmin ? 4 : 3} className="p-20 text-center text-zinc-400 font-medium">
                                            {search ? "No se encontraron equipos" : "No hay equipos configurados"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 text-center">
                    <p className="text-xs text-zinc-400 font-medium italic">
                        Mostrando {filteredEquipments.length} equipos configurados para el laboratorio actual.
                    </p>
                </div>
            </div>

            {/* Modal ABM */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-50">
                                    {editingEquipment ? "Editar Equipo" : "Nuevo Equipo"}
                                </h3>
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nombre del Equipo</label>
                                    <input 
                                        autoFocus
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        placeholder="Ej: Siemens Advia 2120i"
                                        className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-3xl text-sm outline-none transition-all font-bold"
                                    />
                                </div>

                                {isAdmin && (
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Laboratorios Asignados</label>
                                        <div className="max-h-48 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                            {laboratories.map(lab => (
                                                <label 
                                                    key={lab.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group",
                                                        formData.laboratoryIds.includes(lab.id)
                                                            ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-500/50"
                                                            : "bg-zinc-50 dark:bg-zinc-800 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center border",
                                                            formData.laboratoryIds.includes(lab.id)
                                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400"
                                                        )}>
                                                            <Building2 size={14} />
                                                        </div>
                                                        <span className={cn(
                                                            "text-sm font-bold transition-colors",
                                                            formData.laboratoryIds.includes(lab.id)
                                                                ? "text-emerald-700 dark:text-emerald-400"
                                                                : "text-zinc-600 dark:text-zinc-400"
                                                        )}>
                                                            {lab.nombre}
                                                        </span>
                                                    </div>
                                                    <input 
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.laboratoryIds.includes(lab.id)}
                                                        onChange={(e) => {
                                                            const ids = e.target.checked 
                                                                ? [...formData.laboratoryIds, lab.id]
                                                                : formData.laboratoryIds.filter(id => id !== lab.id);
                                                            setFormData({ ...formData, laboratoryIds: ids });
                                                        }}
                                                    />
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                        formData.laboratoryIds.includes(lab.id)
                                                            ? "bg-emerald-500 border-emerald-500"
                                                            : "border-zinc-300 dark:border-zinc-600"
                                                    )}>
                                                        {formData.laboratoryIds.includes(lab.id) && <Plus size={12} className="text-white rotate-45" />}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 h-14 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-100 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={saving || !formData.nombre.trim()}
                                        className="flex-1 h-14 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                        {editingEquipment ? "Guardar" : "Crear"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="¿Eliminar Equipo?"
                description={`¿Está seguro de que desea eliminar el equipo <b>${confirmDelete?.nombre}</b>? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
