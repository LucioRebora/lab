"use client";

import React, { useState, useEffect } from "react";
import { Search, History, Filter, User, Calendar, Activity, Database, LogIn, LogOut, FileText, UserPlus, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

interface AuditLog {
    id: string;
    userId: string | null;
    userName: string | null;
    action: string;
    entity: string | null;
    entityId: string | null;
    details: string | null;
    createdAt: string;
}

const actionIcons: Record<string, any> = {
    LOGIN: LogIn,
    LOGOUT: LogOut,
    SELECCION_PACIENTE: User,
    SELECCION_MEDICO: Stethoscope,
    GENERAR_PROTOCOLO: FileText,
    REGISTER_PATIENT: UserPlus,
};

export default function AuditoriaPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const labId = localStorage.getItem("selectedLaboratoryId");
                const res = await fetch(`/api/audit${labId ? `?laboratoryId=${labId}` : ""}`);
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                }
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.userName?.toLowerCase().includes(search.toLowerCase()) ||
        log.action?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase())
    );

    const getActionIcon = (action: string) => {
        const Icon = actionIcons[action] || Activity;
        return <Icon size={16} className={
            action === 'LOGIN' ? 'text-emerald-500' :
                action === 'LOGOUT' ? 'text-rose-500' :
                    action === 'GENERAR_PROTOCOLO' ? 'text-blue-500' :
                        'text-zinc-400'
        } />;
    };

    return (
        <div className="max-w-6xl mx-auto p-8 pt-12">
            <header className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shadow-sm border border-zinc-200 dark:border-zinc-700">
                        <History size={24} className="text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Tabla de Auditoria</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                            Seguimiento de acciones y eventos realizados por los usuarios.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filtrar por usuario o acción..."
                            className="h-10 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none transition-all focus:border-blue-500/50 w-64 shadow-sm"
                        />
                    </div>
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Fecha y Hora</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Acción</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Detalles</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">ID Entidad</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-zinc-50/20 dark:bg-zinc-800/10"></td>
                                    </tr>
                                ))
                            ) : filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-medium">
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                                    {log.userName?.substring(0, 2)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{log.userName}</span>
                                                    <span className="text-[10px] text-zinc-400">ID: {log.userId?.substring(0, 8)}...</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-[10px] font-bold tracking-tight uppercase">
                                                {getActionIcon(log.action)}
                                                {log.action.replace(/_/g, ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400" title={log.details || ""}>
                                                {log.details}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {log.entityId ? (
                                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                                                    {log.entityId.substring(0, 8)}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-300 font-mono">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                                                <Filter size={20} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-800 dark:text-zinc-200">No se encontraron logs</p>
                                                <p className="text-xs text-zinc-500">Intente con otros criterios de búsqueda.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}
