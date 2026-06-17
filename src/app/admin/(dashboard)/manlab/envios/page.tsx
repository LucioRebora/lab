"use client";

import React, { useState, useEffect } from "react";
import { History, Search, Calendar, FileText, Download, User, ArrowLeft, RefreshCw, Send, ListCheck, Eye, RotateCw, Check, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ManlabExportsPage() {
    const [exports, setExports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isDownloadingId, setIsDownloadingId] = useState<string | null>(null);
    const [isSendingId, setIsSendingId] = useState<string | null>(null);
    const [manlabUsers, setManlabUsers] = useState<any[]>([]);

    const loadExports = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/manlab-exports");
            if (res.ok) {
                const data = await res.json();
                setExports(data);
            } else {
                toast.error("Error al cargar historial");
            }
        } catch (error) {
            console.error("Error loading exports:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (exportId: string, filename: string) => {
        setIsDownloadingId(exportId);
        try {
            const res = await fetch(`/api/manlab-exports/${exportId}`);
            if (!res.ok) throw new Error("Failed to fetch details");
            
            const data = await res.json();
            const rawOrders = data.orders || [];

            // Sort orders to maintain consistent output if possible, 
            // though originally they were sent as they came.
            // ManlabOrders are 1:1 with Result.
            
            let txtContent = "";
            const clean = (str: any) => (str || "").toString().trim();

            rawOrders.forEach((orderData: any) => {
                const o = orderData; // This is the ManlabOrder object
                const line = [
                    clean(o.barcode),
                    clean(o.rotulo),
                    clean(data.cliente), 
                    clean(o.codPrestacion),
                    clean(o.iva),
                    clean(o.comentario),
                    clean(o.diuresis?.toString().replace('.', ',')),
                    clean(o.tipoDocumento),
                    clean(o.numeroDocumento)
                ].join(";");
                txtContent += line + "\n";
            });

            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            
            toast.success("Archivo regenerado con éxito");
        } catch (error) {
            console.error(error);
            toast.error("Error al descargar archivo");
        } finally {
            setIsDownloadingId(null);
        }
    };

    const handleResend = async (exportId: string) => {
        setIsSendingId(exportId);
        try {
            const res = await fetch("/api/manlab-ftp/upload", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exportId })
            });

            if (res.ok) {
                toast.success("Archivo enviado vía FTP a Manlab");
            } else {
                const error = await res.json();
                toast.error("Error FTP: " + (error.error || "Desconocido"));
            }
            // Always refresh to show status change (SENT or FAILED)
            loadExports();
        } catch (error) {
            console.error("FTP Error:", error);
            toast.error("Error de conexión al servidor FTP");
        } finally {
            setIsSendingId(null);
        }
    };

    const loadUsers = async () => {
        try {
            const res = await fetch("/api/manlab-settings");
            if (res.ok) {
                const data = await res.json();
                if (data.config?.manlab_users) {
                    setManlabUsers(JSON.parse(data.config.manlab_users));
                }
            }
        } catch (error) {
            console.error("Error loading users:", error);
        }
    };

    useEffect(() => {
        loadExports();
        loadUsers();
    }, []);

    const filteredExports = exports.filter(e => 
        e.filename.toLowerCase().includes(search.toLowerCase()) ||
        e.cliente.toString().includes(search)
    );

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/admin/manlab"
                        className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-indigo-600 transition-all hover:scale-105"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Historial de Envíos</h1>
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-black tracking-widest uppercase">
                                Manlab
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">Auditoría de archivos generados y procesados</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search size={16} className="text-zinc-400 ml-2" />
                        <input 
                            type="text"
                            placeholder="Buscar por archivo o cliente..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none w-40 sm:w-60 px-1"
                        />
                    </div>
                    <button 
                        onClick={loadExports}
                        className="w-11 h-11 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {/* Content Container */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-24 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">Cargando Historial...</p>
                    </div>
                ) : filteredExports.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-zinc-800/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Archivo Exportado</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Registros</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Fecha y Hora</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Estado FTP</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {filteredExports.map((exp: any) => (
                                    <motion.tr 
                                        key={exp.id} 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-zinc-900 dark:text-zinc-100 font-mono text-sm tracking-tight lowercase">
                                                        {exp.filename}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">TXT Delimitado</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/20">
                                                {manlabUsers.find(u => u.manlabId === exp.cliente.toString()) 
                                                    ? `${manlabUsers.find(u => u.manlabId === exp.cliente.toString()).nombre} (${exp.cliente})` 
                                                    : `Manlab ID: ${exp.cliente}`}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <ListCheck size={14} className="text-emerald-500" />
                                                <span className="font-black text-zinc-900 dark:text-zinc-100">{exp.count} estudios</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-zinc-600 dark:text-zinc-400">
                                                    {new Date(exp.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })}
                                                </span>
                                                <span className="text-[10px] font-bold text-zinc-400 mt-0.5">
                                                    {new Date(exp.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })}hs
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {exp.status === 'SENT' ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                                                    <Check size={12} strokeWidth={3} />
                                                    Enviado
                                                </div>
                                            ) : exp.status === 'FAILED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20">
                                                    <X size={12} strokeWidth={3} />
                                                    Fallido
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                                                    <Clock size={12} strokeWidth={3} />
                                                    Pendiente
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleDownload(exp.id, exp.filename)}
                                                    disabled={isDownloadingId === exp.id}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl border flex items-center justify-center transition-all group-hover:opacity-100",
                                                        isDownloadingId === exp.id
                                                        ? "bg-zinc-100 border-zinc-200 text-zinc-400 cursor-wait"
                                                        : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:scale-110 active:scale-95 shadow-sm opacity-0"
                                                    )}
                                                    title="Re-descargar Archivo"
                                                >
                                                    {isDownloadingId === exp.id ? (
                                                        <RefreshCw size={18} className="animate-spin" />
                                                    ) : (
                                                        <Download size={18} />
                                                    )}
                                                </button>

                                                <button 
                                                    onClick={() => handleResend(exp.id)}
                                                    disabled={isSendingId === exp.id}
                                                    className={cn(
                                                        "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all hover:scale-110 active:scale-95 shadow-sm group-hover:opacity-100 flex items-center justify-center",
                                                        isSendingId === exp.id ? "opacity-100 cursor-wait" : "opacity-0"
                                                    )}
                                                    title="Reenviar a Manlab vía FTP"
                                                >
                                                    {isSendingId === exp.id ? (
                                                        <RefreshCw size={18} className="animate-spin" />
                                                    ) : (
                                                        <Send size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-32 text-center">
                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-200 dark:text-zinc-700">
                            <History size={40} />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">Sin envíos registrados</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto font-medium">Los archivos exportados a Manlab aparecerán aquí para control y auditoría.</p>
                    </div>
                )}
            </div>

            {/* Footer info */}
            <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-full border border-indigo-100 dark:border-indigo-500/10">
                    <Send size={12} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Historial sincronizado en tiempo real</span>
                </div>
            </div>
        </div>
    );
}
