"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Activity, Calendar, X, FileText, ArrowRight, User, Stethoscope, ChevronRight, BookOpen, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InformesPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loadingProtocols, setLoadingProtocols] = useState(false);
    const [activePatientIndex, setActivePatientIndex] = useState(0);
    const [matchedProtocolId, setMatchedProtocolId] = useState<string | null>(null);
    const protocolListRef = React.useRef<HTMLDivElement>(null);

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

    const searchPatients = useCallback(async (q: string, labId: string) => {
        if (!q.trim()) {
            setPatients([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/patients?q=${q}&laboratoryId=${labId}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(Array.isArray(data) ? data.slice(0, 12) : []); 
            }
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => {
            if (search.length >= 2 && !selectedPatient) {
                searchPatients(search, activeLabId);
            } else {
                setPatients([]);
            }
        }, 400);
        return () => clearTimeout(t);
    }, [search, activeLabId, searchPatients, selectedPatient]);

    const fetchPatientProtocols = async (patientId: string, matchedId: string | null = null) => {
        setLoadingProtocols(true);
        try {
            const res = await fetch(`/api/protocols?patientId=${patientId}&laboratoryId=${activeLabId}`);
            if (res.ok) {
                const response = await res.json();
                const fetchedData = Array.isArray(response.data) ? response.data : response;
                setProtocols(fetchedData);
            }
        } catch (error) {
            console.error("Error fetching protocols:", error);
            toast.error("No se pudieron cargar los protocolos del paciente");
        } finally {
            setLoadingProtocols(false);
            // After loading, if we have a matched protocol, scroll to it
            if (matchedId) {
                setTimeout(() => {
                    const element = document.getElementById(`protocol-${matchedId}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        toast.success("Protocolo encontrado y resaltado");
                    }
                }, 500);
            }
        }
    };

    const handleSelectPatient = (patient: any, protocolId: string | null = null) => {
        setSelectedPatient(patient);
        setMatchedProtocolId(protocolId);
        setSearch("");
        setPatients([]);
        fetchPatientProtocols(patient.id, protocolId);
    };

    const handlePatientKeyDown = (e: React.KeyboardEvent) => {
        if (patients.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActivePatientIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActivePatientIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selected = patients[activePatientIndex];
            if (selected) {
                const matchingProtocol = selected.protocols?.find((pr: any) => pr.numeroSecuencial.includes(search) || pr.codigoExterno?.includes(search));
                handleSelectPatient(selected, matchingProtocol?.id);
            }
        }
    };

    const statusConfig: Record<string, { label: string, color: string }> = {
        'NEW': { label: 'Nuevo', color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
        'VALIDATED': { label: 'Validado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
        'SENT': { label: 'Enviado', color: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400' },
        'ERROR': { label: 'Error', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
        'IN_PROGRESS': { label: 'En Proceso', color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
        'PUBLISHED': { label: 'Publicado', color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' },
        'SIGNED': { label: 'Firmado', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400' },
        'LOADED': { label: 'Cargado', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 pt-12">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 ${selectedPatient ? "mb-6" : "mb-10 flex-col text-center"}`}
            >
                <div className={`${selectedPatient ? "w-10 h-10 rounded-xl" : "w-16 h-16 rounded-3xl mb-2"} bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shadow-sm border border-emerald-100 dark:border-emerald-500/20 transition-all duration-500`}>
                    <FileText size={selectedPatient ? 20 : 28} className="text-emerald-500" />
                </div>
                <div className={selectedPatient ? "flex flex-col" : ""}>
                    <h1 className={`${selectedPatient ? "text-xl" : "text-3xl"} font-bold tracking-tight transition-all duration-500`}>
                        {selectedPatient ? "Informes del Paciente" : "Buscador de Informes"}
                    </h1>
                    {!selectedPatient && (
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mt-3 text-sm">
                            Busque un paciente para consultar su historial de protocolos e informes.
                        </p>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-4xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-100 dark:border-zinc-800"
            >
                {selectedPatient ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        {/* Header Paciente */}
                        <div className="flex items-center justify-between p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/30">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-600 shadow-sm text-sm shrink-0 uppercase">
                                    {selectedPatient.apellido.charAt(0)}{selectedPatient.nombre.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg text-emerald-900 dark:text-emerald-100 truncate leading-none mb-1">
                                        {selectedPatient.apellido}, {selectedPatient.nombre}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-emerald-600/70 dark:text-emerald-400/70 font-bold tracking-tight uppercase">
                                        <span>DNI: {selectedPatient.documento}</span>
                                        {selectedPatient.edad && <span>• {selectedPatient.edad} años</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {protocols.length > 0 && (
                                    <Link
                                        href={`/admin/protocolos/${protocols[0].id}/print`}
                                        target="_blank"
                                        className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
                                    >
                                        <Printer size={14} />
                                        Generar Informe
                                    </Link>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedPatient(null);
                                        setProtocols([]);
                                        setSearch("");
                                    }}
                                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all border border-zinc-200 dark:border-zinc-800 shrink-0"
                                >
                                    Cambiar
                                </button>
                            </div>
                        </div>

                        {/* Listado de Protocolos */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                <Activity size={12} className="text-emerald-500" />
                                Historial de Protocolos
                            </h4>

                            {loadingProtocols ? (
                                <div className="py-12 text-center">
                                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                                    <p className="text-zinc-500 font-medium">Buscando protocolos...</p>
                                </div>
                            ) : protocols.length > 0 ? (
                                <div className="grid gap-3">
                                    {protocols.map((protocol) => {
                                        const status = statusConfig[protocol.status] || { label: protocol.status, color: 'bg-zinc-100 text-zinc-600' };
                                        return (
                                            <div
                                                key={protocol.id} 
                                                id={`protocol-${protocol.id}`}
                                                onClick={() => router.push(`/admin/protocolos/${protocol.id}`)}
                                                className={cn(
                                                    "group flex items-center justify-between p-4 rounded-3xl bg-zinc-50/50 dark:bg-zinc-800/30 border transition-all shadow-sm hover:shadow-md cursor-pointer",
                                                    protocol.id === matchedProtocolId 
                                                        ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/5 ring-2 ring-emerald-500/20" 
                                                        : "border-zinc-100 dark:border-zinc-800/50 hover:border-emerald-500/30 hover:bg-white dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center font-mono font-bold text-xs border shadow-sm group-hover:scale-110 transition-transform",
                                                        protocol.id === matchedProtocolId 
                                                            ? "text-emerald-500 border-emerald-500/30" 
                                                            : "text-emerald-500 border-zinc-100 dark:border-zinc-700"
                                                    )}>
                                                        {protocol.numeroSecuencial.slice(-3)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-sm">Protocolo {protocol.numeroSecuencial}</span>
                                                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full", status.color)}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(protocol.createdAt).toLocaleDateString('es-AR')}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <BookOpen size={10} />
                                                                {protocol.results?.length || 0} Determinaciones
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Médico</p>
                                                        <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                            {protocol.doctor ? `${protocol.doctor.apellido}` : 'Particular'}
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/admin/protocolos/${protocol.id}/print`}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                                        title="Imprimir Informe"
                                                    >
                                                        <Printer size={16} />
                                                    </Link>
                                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:translate-x-1 transition-transform">
                                                        <ChevronRight size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem]">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="text-zinc-200" size={32} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-400">Sin protocolos registrados</h3>
                                    <p className="text-xs text-zinc-300 mt-1">Este paciente aún no tiene protocolos en este laboratorio.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto py-4">
                        <div className="relative group">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setActivePatientIndex(0);
                                }}
                                onKeyDown={handlePatientKeyDown}
                                autoFocus
                                placeholder="Escriba apellido, nombre, DNI o nº de protocolo..."
                                className="w-full h-16 pl-16 pr-20 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 rounded-3xl text-sm font-medium outline-none transition-all placeholder:text-zinc-400 shadow-inner"
                            />
                            {loading && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                    <div className="w-5 h-5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {patients.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/50"
                                >
                                    <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-800/50">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sugerencias encontradas</p>
                                    </div>
                                    {patients.map((p, idx) => (
                                        <button
                                            key={p.id}
                                            onClick={() => {
                                                const matchingProtocol = p.protocols?.find((pr: any) => 
                                                    pr.numeroSecuencial.toLowerCase().includes(search.toLowerCase()) || 
                                                    pr.codigoExterno?.toLowerCase().includes(search.toLowerCase())
                                                );
                                                handleSelectPatient(p, matchingProtocol?.id);
                                            }}
                                            onMouseEnter={() => setActivePatientIndex(idx)}
                                            className={cn(
                                                "w-full p-5 flex items-center justify-between transition-all group",
                                                activePatientIndex === idx 
                                                    ? "bg-emerald-50 dark:bg-emerald-900/20" 
                                                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all shadow-sm",
                                                    activePatientIndex === idx 
                                                        ? "bg-emerald-500 text-white" 
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                                                )}>
                                                    {p.apellido.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className={cn(
                                                        "font-bold transition-colors",
                                                        activePatientIndex === idx ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"
                                                    )}>
                                                        {p.apellido}, {p.nombre}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs text-zinc-400 font-mono">DNI: {p.documento || "---"}</p>
                                                        {p.protocols && p.protocols.some((pr: any) => pr.numeroSecuencial.includes(search) || pr.codigoExterno?.includes(search)) && (
                                                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                                                                Protocolo {p.protocols.find((pr: any) => pr.numeroSecuencial.includes(search) || pr.codigoExterno?.includes(search)).numeroSecuencial}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "p-2 rounded-xl transition-all",
                                                activePatientIndex === idx ? "bg-emerald-500 text-white translate-x-1" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300"
                                            )}>
                                                <ArrowRight size={16} />
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {search.length < 2 && (
                            <div className="mt-12 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2.5rem] flex items-center justify-center text-zinc-200 dark:text-zinc-800">
                                    <User size={40} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-400">Empieza por buscar un paciente</h4>
                                    <p className="text-xs text-zinc-300 mt-1">Busca por apellido, nombre o número de documento</p>
                                </div>
                            </div>
                        )}
                        
                        {search.length >= 2 && patients.length === 0 && !loading && (
                           <div className="mt-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
                               <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-200">
                                   <Search size={32} />
                               </div>
                               <div>
                                   <h4 className="text-sm font-bold text-zinc-400">No hay coincidencias</h4>
                                   <p className="text-xs text-zinc-300 mt-1">Revisa que el nombre o DNI sea el correcto</p>
                               </div>
                           </div>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
