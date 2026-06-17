"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Microscope,
    Search, 
    Settings2, 
    ArrowLeft,
    Loader2,
    Database,
    Zap,
    FolderOpen
} from "lucide-react";
import { get, set } from "idb-keyval";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { CM260ConfigModal } from "@/components/admin/equipos/CM260ConfigModal";
import { EquipmentConfigModal } from "@/components/admin/equipos/EquipmentConfigModal";

interface Equipment {
    id: string;
    nombre: string;
    active: boolean;
}

export default function ConfiguracionEquiposPage() {
    const { data: session } = useSession();
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<{ id: string, nombre: string } | null>(null);
    const [directories, setDirectories] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const checkDirs = async () => {
            const mapped: Record<string, boolean> = {};
            for (const eq of equipments) {
                const handle = await get(`directory_handle_${eq.id}`);
                if (handle) mapped[eq.id] = true;
            }
            setDirectories(mapped);
        };
        if (equipments.length > 0) checkDirs();
    }, [equipments]);

    const handleSelectDirectory = async (equipmentId: string) => {
        try {
            // @ts-ignore
            const handle = await window.showDirectoryPicker();
            await set(`directory_handle_${equipmentId}`, handle);
            setDirectories(prev => ({ ...prev, [equipmentId]: true }));
            toast.success("Directorio configurado correctamente");
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                toast.error("Error al seleccionar el directorio");
            }
        }
    };

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

    useEffect(() => {
        fetchEquipments();
    }, [fetchEquipments]);

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
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Configuración de Equipos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Parametrización y protocolos de comunicación</p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                            <Settings2 size={20} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Equipos Asignados</h3>
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
                                                        <Microscope size={22} className="text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{equipo.nombre}</div>
                                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">ID: {equipo.id.slice(-6)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                                    equipo.active 
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" 
                                                        : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"
                                                )}>
                                                    {equipo.active ? "Activo" : "Inactivo"}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleSelectDirectory(equipo.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm active:scale-95",
                                                            directories[equipo.id]
                                                                ? "bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100"
                                                                : "bg-white text-zinc-500 border-zinc-100 hover:bg-zinc-50"
                                                        )}
                                                        title={directories[equipo.id] ? "Cambiar Directorio PC" : "Configurar Directorio PC"}
                                                    >
                                                        <FolderOpen size={14} />
                                                        {directories[equipo.id] ? "PC" : "Dir"}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedEquipment({ id: equipo.id, nombre: equipo.nombre });
                                                            setIsGenericModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-xs font-bold border border-zinc-100 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 transition-all shadow-sm"
                                                    >
                                                        <Settings2 size={14} />
                                                        Configurar
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedEquipment({ id: equipo.id, nombre: equipo.nombre });
                                                            setIsModalOpen(true);
                                                        }}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-800/50 text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-zinc-200 dark:shadow-none"
                                                    >
                                                        <Zap size={14} />
                                                        Parametrizar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="p-20 text-center text-zinc-400 font-medium">
                                            {search ? "No se encontraron equipos" : "No hay equipos asignados a este laboratorio"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 text-center">
                    <p className="text-xs text-zinc-400 font-medium italic">
                        Seleccione un equipo para configurar sus parámetros de comunicación y mapeo de pruebas.
                    </p>
                </div>
            </div>

            {selectedEquipment && (
                <CM260ConfigModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    equipmentId={selectedEquipment.id}
                    equipmentNombre={selectedEquipment.nombre}
                    laboratoryId={session?.user?.laboratoryId || localStorage.getItem('selectedLaboratoryId') || ""}
                />
            )}

            {selectedEquipment && (
                <EquipmentConfigModal 
                    isOpen={isGenericModalOpen}
                    onClose={() => setIsGenericModalOpen(false)}
                    equipmentId={selectedEquipment.id}
                    equipmentNombre={selectedEquipment.nombre}
                    laboratoryId={session?.user?.laboratoryId || localStorage.getItem('selectedLaboratoryId') || ""}
                />
            )}
        </div>
    );
}
