"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ListOrdered, Search, Calendar, User, Stethoscope, ArrowRight, FileText, DollarSign, X, Pencil, Zap, Upload, UserPlus, CheckCircle2, Printer, Check, Globe, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { get } from "idb-keyval";

export default function ProtocolosPage() {
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [selectedProtocolForCost, setSelectedProtocolForCost] = useState<any>(null);
    const [importing, setImporting] = useState(false);
    const [importSelectedProtocolNum, setImportSelectedProtocolNum] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Paginación y Lazy Load
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Patient Search logic from Nuevo Ingreso
    const [patients, setPatients] = useState<any[]>([]);
    const [showPatientList, setShowPatientList] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);

    const handleImportCM260 = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeLabId) return;

        const loadingToast = toast.loading("Importando resultados...");
        setImporting(true);

        try {
            const content = await file.text();
            const res = await fetch("/api/protocols/import-cm260", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    content, 
                    laboratoryId: activeLabId,
                    filterProtocolNum: importSelectedProtocolNum
                })
            });

            if (!res.ok) throw new Error("Error en el servidor al importar");
            
            const data = await res.json();
            toast.success("Resultados procesados correctamente", { id: loadingToast });
            loadProtocols(); 
            
            if (data.summary) {
                console.log("Resumen de importación:", data.summary);
            }
        } catch (error: any) {
            toast.error(error.message || "Error al importar resultados", { id: loadingToast });
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setImportSelectedProtocolNum(null);
        }
    };

    const triggerImport = (protocolNum: string) => {
        setImportSelectedProtocolNum(protocolNum);
        fileInputRef.current?.click();
    };

    useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const loadProtocols = useCallback(async (labId = activeLabId, query = "", pageNum = 1, append = false) => {
        if (!labId) return;
        if (append) setIsLoadingMore(true);
        else setLoading(true);
        try {
            const res = await fetch(`/api/protocols?laboratoryId=${labId}&search=${query}&page=${pageNum}`);
            if (res.ok) {
                const response = await res.json();
                const fetchedData = Array.isArray(response.data) ? response.data : response;
                const pagination = response.pagination;
                
                if (append) {
                    setProtocols(prev => [...prev, ...fetchedData]);
                } else {
                    setProtocols(fetchedData);
                }
                
                if (pagination) {
                    setHasMore(pagination.hasMore);
                    setPage(pagination.page);
                }
            }
        } catch (error) {
            console.error("Error loading protocols:", error);
            toast.error("Error al cargar protocolos");
        } finally {
            setLoading(false);
            setIsLoadingMore(false);
        }
    }, [activeLabId]);

    const lastProtocolElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || isLoadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadProtocols(activeLabId, search, page + 1, true);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, isLoadingMore, hasMore, loadProtocols, activeLabId, search, page]);

    const searchPatients = useCallback(async (q: string, labId: string) => {
        if (!q.trim()) {
            setPatients([]);
            return;
        }
        setLoadingPatients(true);
        try {
            const res = await fetch(`/api/patients?q=${q}&laboratoryId=${labId}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(Array.isArray(data) ? data.slice(0, 5) : []); 
            }
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    const ignoreNextSearch = useRef(false);

    useEffect(() => {
        if (ignoreNextSearch.current) {
            ignoreNextSearch.current = false;
            return;
        }
        const t = setTimeout(() => {
            if (search.length >= 2) {
                searchPatients(search, activeLabId);
                setShowPatientList(true);
            } else {
                setPatients([]);
                setShowPatientList(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [search, activeLabId, searchPatients]);

    const handleSelectPatient = (patient: any) => {
        const patientName = `${patient.apellido}, ${patient.nombre}`;
        ignoreNextSearch.current = true;
        setSearch(patientName);
        setShowPatientList(false);
        setPatients([]);
        loadProtocols(activeLabId, patientName);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowPatientList(false);
        loadProtocols(activeLabId, search);
    };

    useEffect(() => {
        loadProtocols(activeLabId, ""); 
    }, [activeLabId]);


    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                        <ListOrdered className="text-blue-500" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Protocolos</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Gestión y consulta de análisis registrados</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => loadProtocols()}
                        className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                        title="Actualizar lista"
                    >
                        <Zap size={18} className="text-zinc-400" />
                    </button>
                    <Link
                        href="/admin/nuevo-ingreso"
                        className="h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        Nuevo Ingreso
                    </Link>
                </div>
            </div>

            {/* Search Bar with Patient Logic */}
            <div className="relative mb-8 z-[50]">
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative group flex items-center gap-4">
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="text-zinc-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por protocolo, paciente o DNI en todo el historial..."
                                className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] py-5 pl-14 pr-6 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-xl shadow-zinc-200/50 dark:shadow-none placeholder:text-zinc-400 font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {loading && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-16 px-8 bg-black dark:bg-white text-white dark:text-black font-bold rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:scale-100"
                        >
                            Buscar
                        </button>
                    </div>
                </form>



                {/* Floating Patient Suggestions */}
                <AnimatePresence>
                    {showPatientList && patients.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-3 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Sugerencias de Pacientes</p>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {patients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        onClick={() => handleSelectPatient(patient)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
                                                {patient.apellido[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-zinc-900 dark:text-zinc-100">{patient.apellido}, {patient.nombre}</p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono">{patient.documento}</span>
                                                    <span>•</span>
                                                    <span>{new Date().getFullYear() - (patient.fechaNacimiento ? new Date(patient.fechaNacimiento).getFullYear() : 0)} años</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight size={18} className="text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Hidden File Input for CM260 Import */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".txt"
                onChange={handleImportCM260}
            />

            {/* Protocol Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden">
                {loading && protocols.length === 0 ? (
                    <div className="p-20 text-center">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">Buscando protocolos...</p>
                    </div>
                ) : protocols.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Protocolo</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Paciente / DNI</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {protocols.map((protocol) => (
                                    <tr key={protocol.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                                                    {protocol.numeroSecuencial}
                                                </span>
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                                                    {protocol.firmado && (
                                                        <span title="Firmado"><CheckCircle2 size={12} className="text-emerald-500" /></span>
                                                    )}
                                                    {protocol.impreso && (
                                                        <span title="Impreso"><Printer size={12} className="text-blue-500" /></span>
                                                    )}
                                                    {protocol.publicado && (
                                                        <span title="Publicado"><Globe size={12} className="text-purple-500" /></span>
                                                    )}
                                                    {protocol.completo && (
                                                        <span title="Completo"><Check size={12} className="text-emerald-400" /></span>
                                                    )}
                                                    {protocol.etiquetaImpresa && (
                                                        <span title="Etiqueta Impresa"><Tag size={12} className="text-amber-500" /></span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                    {protocol.patient?.apellido}, {protocol.patient?.nombre}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-medium tracking-tight">DNI: {protocol.patient?.documento}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-zinc-500 font-mono">
                                                {(() => {
                                                    const d = new Date(protocol.createdAt);
                                                    const day = d.getUTCDate().toString().padStart(2, '0');
                                                    const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
                                                    const yr = d.getUTCFullYear();
                                                    const hr = d.getUTCHours().toString().padStart(2, '0');
                                                    const min = d.getUTCMinutes().toString().padStart(2, '0');
                                                    return `${day}/${mon}/${yr} ${hr}:${min}`;
                                                })()}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={() => triggerImport(protocol.numeroSecuencial)}
                                                    className="p-2 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    title="Importar resultados CM260"
                                                >
                                                    <Upload size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedProtocolForCost(protocol)}
                                                    className="p-2 rounded-xl text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                                    title="Gastos de Reactivos"
                                                >
                                                    <DollarSign size={18} />
                                                </button>
                                                <Link
                                                    href={`/admin/protocolos/${protocol.id}`}
                                                    className="p-2 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    title="Ver Protocolo"
                                                >
                                                    <ArrowRight size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {hasMore && (
                            <div ref={lastProtocolElementRef} className="py-8 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                                    <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cargando más protocolos...</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem] m-4">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-zinc-200" size={32} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400">No se encontraron protocolos</h3>
                        <p className="text-xs text-zinc-300 mt-1">Intenta con otros términos de búsqueda</p>
                    </div>
                )}
            </div>
            
            {/* Gastos Reactivos Modal (Placeholder logic) */}
            <AnimatePresence>
                {selectedProtocolForCost && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProtocolForCost(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                        >
                            <h2 className="text-xl font-bold mb-4">Gastos de Reactivos</h2>
                            <p className="text-sm text-zinc-500 mb-6 font-medium uppercase tracking-widest">Protocolo {selectedProtocolForCost.numeroSecuencial}</p>
                            
                            <div className="space-y-4 mb-8">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-between">
                                    <span className="text-sm font-bold">Total Insumos</span>
                                    <span className="text-sm font-bold text-emerald-500">$ {selectedProtocolForCost.totalReactivos || 0}</span>
                                </div>
                                <p className="text-xs text-zinc-400 text-center italic">Próximamente detallado por determinación</p>
                            </div>

                            <button
                                onClick={() => setSelectedProtocolForCost(null)}
                                className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-bold rounded-2xl active:scale-95 transition-all shadow-xl"
                            >
                                Cerrar Ventana
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
