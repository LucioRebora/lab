"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
    Monitor, 
    Search, 
    Settings2, 
    ArrowLeft,
    Loader2,
    Construction
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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

export default function PostanaliticaEquiposPage() {
    const { data: session } = useSession();
    const [equipments, setEquipments] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
        <div className="p-8 max-w-6xl mx-auto pb-24 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-5">
                    <Link 
                        href="/admin/post-analiticas" 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Postanalítica</span>
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">Equipos Disponibles</h1>
                        <p className="text-sm text-zinc-500 font-medium">Consulta de instrumentos activos para el procesamiento de muestras</p>
                    </div>
                </div>
            </div>

            {/* List Section */}
            <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden flex flex-col mb-8">
                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-700">
                            <Settings2 size={20} className="text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Inventario de Equipos</h3>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar equipo..."
                            className="w-full h-11 pl-11 pr-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                    {loading ? (
                       <div className="p-20 text-center flex flex-col items-center gap-3">
                           <Loader2 size={32} className="animate-spin text-zinc-300" />
                           <p className="text-sm text-zinc-400 font-medium">Cargando equipos...</p>
                       </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-zinc-50/95 dark:bg-zinc-800/95 backdrop-blur-sm z-10">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nombre del Instrumento</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Estado</th>
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
                                                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Estado: {equipo.active ? 'Operativo' : 'Mantenimiento'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span 
                                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                                                        equipo.active 
                                                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" 
                                                            : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full ${equipo.active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                    {equipo.active ? "Activado" : "Fuera de Servicio"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="p-20 text-center text-zinc-400 font-medium whitespace-normal">
                                            {search ? "No se encontraron equipos bajo ese nombre" : "No hay equipos registrados actualmente para este laboratorio."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Custom funny banner */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-indigo-500/20"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Construction size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-bounce">
                        <span className="text-3xl">👷‍♂️</span>
                    </div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight mb-1">¡Aviso importante!</h4>
                        <p className="text-indigo-100 font-bold text-lg">
                            Módulo en desarrollo
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
