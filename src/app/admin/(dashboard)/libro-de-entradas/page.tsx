"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookOpen, Search, Calendar, User, Stethoscope, FileText, ArrowRight, Download, FilePlus, Eye, X, Pencil, ArrowUpDown, Beaker, ChevronDown, CheckCircle2, Printer, Check, Globe, Tag } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function LibroEntradasPage() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>(todayStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [search, setSearch] = useState("");
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchPatientId, setSearchPatientId] = useState("");
    const [searchProtocolNum, setSearchProtocolNum] = useState("");
    const [highlightedPatientIndex, setHighlightedPatientIndex] = useState(-1);

    // Patient Search logic from Nuevo Ingreso
    const [patients, setPatients] = useState<any[]>([]);
    const [showPatientList, setShowPatientList] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date()); 

    useEffect(() => {
        console.log("LOG [LibroEntradasPage]: Componente montado. Inicializando filtros y carga...");
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            console.log("LOG [LibroEntradasPage]: Laboratorio recuperado de localStorage:", savedLab);
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const loadProtocols = useCallback(async (
        labId = activeLabId, 
        start = startDate, 
        end = endDate, 
        query = searchProtocolNum || search, 
        patientId = searchPatientId, 
        currentPage = 1,
        append = false,
        searchField = searchProtocolNum ? "numeroSecuencial" : ""
    ) => {
        const status = "ALL";
        
        const finalLabId = labId || activeLabId;
        const finalStartDate = start;
        const finalEndDate = end;

        if (!finalLabId) {
            setLoading(false);
            return;
        }

        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setPage(1);
        }
        
        try {
            // Build query params
            const params = new URLSearchParams();
            if (finalLabId) params.set("laboratoryId", finalLabId);
            
            // Si el campo de búsqueda es numeroSecuencial, omitimos las fechas para permitir buscar en todo el historial
            if (searchField !== "numeroSecuencial") {
                if (finalStartDate) params.set("startDate", finalStartDate);
                if (finalEndDate) params.set("endDate", finalEndDate);
            }
            if (query) params.set("search", query);
            if (patientId) params.set("patientId", patientId);
            if (status) params.set("status", status);
            if (searchField) params.set("searchField", searchField);
            params.set("page", currentPage.toString());
            params.set("pageSize", "50");

            const res = await fetch(`/api/protocols?${params.toString()}`);
            if (res.ok) {
                const response = await res.json();
                console.log("LOG [LibroEntradasPage]: API respondió con éxito. Registros encontrados:", response.data?.length || 0);
                const fetchedData = response.data || [];
                const pagination = response.pagination || { total: 0, hasMore: false };

                if (append) {
                    setProtocols(prev => [...prev, ...fetchedData]);
                } else {
                    setProtocols(fetchedData);
                }
                
                setHasMore(pagination.hasMore);
                setTotalResults(pagination.total);
                setPage(currentPage);
            } else {
                console.error("LOG [LibroEntradasPage]: Error en respuesta de API:", res.status);
            }
        } catch (error) {
            console.error("LOG [LibroEntradasPage]: Excepción en loadProtocols:", error);
            toast.error("Error al cargar el libro de entradas");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeLabId, startDate, endDate, search, searchProtocolNum, searchPatientId, todayStr, setProtocols, setHasMore, setTotalResults, setPage, setLoading, setLoadingMore]);

    const lastProtocolElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadProtocols(activeLabId, startDate, endDate, search, "", page + 1, true);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, hasMore, loadProtocols, activeLabId, startDate, endDate, search, page]);

    useEffect(() => {
        if (activeLabId) {
            loadProtocols(activeLabId);
        }
        // Desactivamos la búsqueda automática al escribir para evitar carga innecesaria.
        // La búsqueda solo se dispara por acciones explícitas.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeLabId]);

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
                setHighlightedPatientIndex(-1);
            }
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    const ignoreNextSearch = useRef(false);

    useEffect(() => {
        const t = setTimeout(() => {
            if (ignoreNextSearch.current) {
                ignoreNextSearch.current = false;
                return;
            }

            if (search.length >= 2) {
                searchPatients(search, activeLabId);
                setShowPatientList(true);
            } else {
                setPatients([]);
                setShowPatientList(false);
                setHighlightedPatientIndex(-1);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [search, activeLabId, searchPatients]);

    const handleSelectPatient = (patient: any) => {
        const patientName = `${patient.apellido}, ${patient.nombre}`;
        ignoreNextSearch.current = true;
        setSearch(patientName);
        setSearchPatientId(patient.id);
        setSearchProtocolNum("");
        setShowPatientList(false);
        setPatients([]);
        // Clear date range to search in full history
        setStartDate("");
        setEndDate("");
        loadProtocols(activeLabId, "", "", patientName, patient.id);
    };



    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showPatientList || patients.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedPatientIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedPatientIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === "Enter" && highlightedPatientIndex >= 0) {
            e.preventDefault();
            handleSelectPatient(patients[highlightedPatientIndex]);
        } else if (e.key === "Escape") {
            setShowPatientList(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowPatientList(false);
        loadProtocols(activeLabId, startDate, endDate, searchProtocolNum || search);
    };

    const filteredProtocols = useMemo(() => {
        let result = [...protocols];
        
        return result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            if (sortOrder === 'asc') {
                return timeA - timeB;
            } else {
                return timeB - timeA;
            }
        });

    }, [protocols, sortOrder]);

    return (
        <div className="p-1 sm:p-2 max-w-7xl mx-auto w-full print:p-0">
            {/* Header */}
            <div className="relative z-[70] flex flex-nowrap items-center justify-between mb-2 gap-2 overflow-visible print:hidden">
                <div className="flex items-center gap-2 shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                        < BookOpen className="text-blue-500" size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-lg font-bold tracking-tighter">Libro de Entradas</h1>
                            <span className="text-[9px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded font-black tracking-widest leading-none">
                                {totalResults}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Protocol Search (Exact) */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all h-8">
                        <Tag size={12} className="text-zinc-400 ml-1" />
                        <input 
                            type="text"
                            placeholder="N° PROTOCOLO"
                            value={searchProtocolNum}
                            onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setSearchProtocolNum(val);
                                if (val) {
                                    setSearch("");
                                    setSearchPatientId("");
                                    setStartDate("");
                                    setEndDate("");
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSearchSubmit(e as any);
                            }}
                            className="bg-transparent text-[12px] font-black outline-none w-16 sm:w-20 uppercase font-mono px-0.5 placeholder:tracking-tighter"
                        />
                        <button 
                            disabled={!searchProtocolNum}
                            onClick={() => {
                                setSearchProtocolNum("");
                                loadProtocols(activeLabId, startDate, endDate, "");
                            }}
                            className={cn(
                                "p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-all mr-0.5 shrink-0",
                                !searchProtocolNum ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible"
                            )}
                            title="Limpiar protocolo"
                        >
                            <X size={12} />
                        </button>
                    </div>

                    {/* Search Bar with Patient Logic */}
                    <div className="relative group z-[60]">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all h-8">
                            <Search size={12} className="text-zinc-400 ml-1" />
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1">
                                <input 
                                    type="text"
                                    placeholder="PACIENTE / DNI..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    className="bg-transparent text-[12px] font-black outline-none w-28 sm:w-32 uppercase px-0.5 placeholder:tracking-tighter"
                                />
                            </form>
                            {loadingPatients && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin w-2.5 h-2.5 border-2 border-blue-500/20 border-t-blue-500 rounded-full" />
                            )}
                            <button 
                                disabled={!search && !searchPatientId}
                                onClick={() => {
                                    setSearch("");
                                    setSearchPatientId("");
                                    setShowPatientList(false);
                                    loadProtocols(activeLabId, startDate, endDate, "");
                                }}
                                className={cn(
                                    "p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-all mr-0.5",
                                    (!search && !searchPatientId) ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible"
                                )}
                                title="Limpiar búsqueda"
                            >
                                <X size={12} />
                            </button>
                        </div>



                        {/* Floating Patient Suggestions */}
                        <AnimatePresence>
                            {showPatientList && patients.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-w-[300px]"
                                >
                                    <div className="p-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2">Sugerencias de Pacientes</p>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        {patients.map((patient, index) => (
                                            <button
                                                key={patient.id}
                                                onClick={() => handleSelectPatient(patient)}
                                                onMouseEnter={() => setHighlightedPatientIndex(index)}
                                                className={cn(
                                                    "w-full p-3 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group border-b border-zinc-50 dark:border-zinc-800 last:border-0 text-left",
                                                    highlightedPatientIndex === index && "bg-blue-50 dark:bg-blue-800/40"
                                                )}
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                        {patient.apellido[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{patient.apellido}, {patient.nombre}</p>
                                                        <p className="text-[10px] text-zinc-500">DNI: {patient.documento}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-zinc-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative z-[60]">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 flex items-center gap-1.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all select-none h-8">
                            <Calendar size={12} className="text-zinc-400 ml-1" />
                            <div className="flex items-center gap-1">
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[12px] font-black outline-none px-0.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter"
                                />
                                <span className="text-[9px] text-zinc-400 font-black px-0.5">AL</span>
                                <input 
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[12px] font-black outline-none px-0.5 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                        loadProtocols(activeLabId, "", "", searchProtocolNum || search);
                                    }}
                                    className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors mr-0.5"
                                    title="Limpiar rango"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>



                    <Link
                        href="/admin/nuevo-ingreso"
                        className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
                        title="Nuevo Ingreso"
                    >
                        <FilePlus size={16} />
                    </Link>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-4 border-b pb-2">
                <h1 className="text-lg font-bold uppercase">Libro de Entradas - Bio.itia</h1>
                <p className="text-xs text-zinc-600">
                    {startDate && endDate 
                        ? (startDate === endDate 
                            ? `Fecha: ${new Date(startDate + 'T12:00:00').toLocaleDateString('es-AR', { dateStyle: 'long' })}`
                            : `Desde: ${startDate} Hasta: ${endDate}`)
                        : "Historial Completo"}
                </p>
                <div className="text-[10px] mt-1 font-mono">Total Registros: {filteredProtocols.length}</div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden print:shadow-none print:border-zinc-200 print:rounded-none">
                {loading ? (
                    <div className="p-20 text-center print:hidden">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">Cargando datos...</p>
                    </div>
                ) : filteredProtocols.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 print:bg-zinc-50">
                                    <th className="px-2 py-2 print:text-black min-w-[120px]">
                                        <button 
                                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                            className="flex items-center gap-1 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:text-blue-500 transition-colors group/sort"
                                        >
                                            Protocolo
                                            <ArrowUpDown size={8} className={cn(
                                                "transition-colors",
                                                sortOrder === 'asc' ? "text-blue-500" : "text-zinc-300 group-hover/sort:text-blue-400"
                                            )} />
                                        </button>
                                    </th>
                                    <th className="px-2 py-2 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Paciente</th>
                                    <th className="px-2 py-2 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Fecha</th>

                                    <th className="px-2 py-2 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">OS</th>



                                    <th className="px-2 py-2 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Médico</th>
                                    <th className="px-2 py-2 text-[12px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:hidden text-right">Acc.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50 print:divide-zinc-200">
                                {filteredProtocols.map((protocol, idx) => {
                                    const defaultHI = protocol.results?.find((r: any) => r.healthInsurance)?.healthInsurance?.nombre 
                                                   || protocol.patient?.healthInsurances?.find((h: any) => h.isDefault)?.healthInsurance?.nombre
                                                   || "Particular";

                                    return (
                                        <tr key={protocol.id} className={cn(
                                            "group transition-colors print:hover:bg-transparent leading-none",
                                            idx % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50/40 dark:bg-zinc-800/20",
                                            "hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                        )}>
                                            <td className="px-2 py-3 h-12 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black font-mono text-blue-600 dark:text-blue-400 text-[13px] tracking-tighter">
                                                        {protocol.numeroSecuencial}
                                                    </span>
                                                    <div className="flex items-center gap-0.5">
                                                        {protocol.firmado && (
                                                            <span title="Firmado"><CheckCircle2 size={10} className="text-emerald-500" /></span>
                                                        )}
                                                        {protocol.impreso && (
                                                            <span title="Impreso"><Printer size={10} className="text-blue-500" /></span>
                                                        )}
                                                        {protocol.publicado && (
                                                            <span title="Publicado"><Globe size={10} className="text-purple-500" /></span>
                                                        )}
                                                        {protocol.completo && (
                                                            <span title="Completo"><Check size={10} className="text-emerald-400" /></span>
                                                        )}
                                                        {protocol.etiquetaImpresa && (
                                                            <span title="Etiqueta Impresa"><Tag size={8} className="text-amber-500" /></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 h-12 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                <div className="flex flex-col gap-0 leading-[1]">
                                                    <span className="font-black text-zinc-900 dark:text-zinc-100 text-[13px] tracking-tight uppercase truncate max-w-[140px]">
                                                        {protocol.patient?.apellido}, {protocol.patient?.nombre}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 h-12 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                <div className="flex items-center gap-1 leading-[1]">
                                                    <span className="text-[12px] font-black text-zinc-500 font-mono">
                                                        {(() => {
                                                            const d = new Date(protocol.createdAt);
                                                            const day = d.getUTCDate().toString().padStart(2, '0');
                                                            const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
                                                            return `${day}/${mon}`;
                                                        })()}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-zinc-400 font-mono italic opacity-60">
                                                        {(() => {
                                                            const d = new Date(protocol.createdAt);
                                                            const hr = d.getUTCHours().toString().padStart(2, '0');
                                                            const min = d.getUTCMinutes().toString().padStart(2, '0');
                                                            return `${hr}:${min}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-2 py-3 h-12 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                <span className="text-[11px] font-black text-zinc-500 uppercase tracking-tighter truncate max-w-[60px] block leading-none">
                                                    {defaultHI}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 h-12 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                <span className="text-[12px] text-zinc-400 font-black uppercase tracking-tighter truncate max-w-[80px] block">
                                                    {protocol.doctor ? `${protocol.doctor.apellido}` : '---'}
                                                </span>
                                            </td>
                                            <td className="px-2 py-3 h-12 align-middle text-right print:hidden border-b border-zinc-50 dark:border-zinc-800">
                                                <div className="flex items-center justify-end gap-0">
                                                    <button
                                                        onClick={() => setSelectedProtocol(protocol)}
                                                        className="p-1 rounded text-zinc-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Ver"
                                                    >
                                                        <Eye size={12} />
                                                    </button>
                                                    <Link
                                                        href={`/admin/nuevo-ingreso?edit=${protocol.id}`}
                                                        className="p-1 rounded text-zinc-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Editar"
                                                    >
                                                        <Pencil size={12} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-[2rem] m-4">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="text-zinc-200" size={32} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400">
                            {search 
                                ? "No se encontraron resultados para tu búsqueda" 
                                : startDate 
                                    ? "No se encontraron protocolos para el rango seleccionado" 
                                    : "No hay protocolos registrados en el historial"}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1">
                            {search 
                                ? "Prueba con otros términos de búsqueda" 
                                : startDate 
                                    ? "Selecciona otra fecha o limpia el filtro para ver todo" 
                                    : "Comienza registrando un nuevo protocolo"}
                        </p>
                    </div>
                )}

                {/* Pagination Footer */}
                {protocols.length > 0 && (
                    <div className="p-6 border-t border-zinc-50 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col items-center gap-4">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Mostrando {protocols.length} de {totalResults} registros
                        </p>
                        
                        {hasMore && (
                            <div ref={lastProtocolElementRef} className="py-4 text-center">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                                    <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cargando más protocolos...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Protocol Detail Modal */}
            <AnimatePresence>
                {selectedProtocol && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProtocol(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-800/30">
                                        <FileText className="text-blue-500" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Detalle Rápido</h2>
                                        <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Protocolo {selectedProtocol.numeroSecuencial}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedProtocol(null)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Paciente</p>
                                            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                {selectedProtocol.patient?.apellido}, {selectedProtocol.patient?.nombre}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">DNI: {selectedProtocol.patient?.documento}</p>
                                        </div>
                                         <div className="bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-2xl">
                                             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Médico</p>
                                             <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                 {selectedProtocol.doctor ? `${selectedProtocol.doctor.apellido},, ${selectedProtocol.doctor.nombre}` : 'Particular'}
                                             </p>
                                         </div>
                                     </div>

                                     <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                             <Beaker size={12} className="text-blue-500" />
                                             Determinaciones
                                         </p>
                                         <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                             {selectedProtocol.results?.length > 0 ? (
                                                 selectedProtocol.results.map((res: any) => (
                                                     <div key={res.id} className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                         <div className="flex-1 min-w-0">
                                                             <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                                                 {res.determination?.nombre}
                                                             </p>
                                                             <p className="text-[10px] text-zinc-400 font-medium">
                                                                 Sección: {res.determination?.section?.nombre || "SIN SECCIÓN"}
                                                             </p>
                                                         </div>
                                                         <div className="text-right shrink-0">
                                                             <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-bold text-zinc-500 uppercase tracking-tight">
                                                                 {res.healthInsurance?.nombre || "Particular"}
                                                             </span>
                                                         </div>
                                                     </div>
                                                 ))
                                             ) : (
                                                 <p className="text-xs text-zinc-400 font-medium italic text-center py-4">Sin determinaciones registradas</p>
                                             )}
                                         </div>
                                     </div>


                                    <div className="pt-4 flex justify-end gap-3">
                                        <Link
                                            href={`/admin/nuevo-ingreso?edit=${selectedProtocol.id}`}
                                            className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                                        >
                                            <Pencil size={14} />
                                            Editar Protocolo
                                        </Link>
                                        <Link
                                            href={`/admin/protocolos/${selectedProtocol.id}`}
                                            className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
                                        >
                                            Ver Ficha Completa
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Print Footer */}
            <div className="hidden print:flex justify-between mt-12 px-8">
                <div className="text-center w-48 border-t pt-2">
                    <p className="text-[10px] font-bold uppercase">Firma del Profesional</p>
                </div>
                <div className="text-center w-48 border-t pt-2">
                    <p className="text-[10px] font-bold uppercase">Sello Lab.</p>
                </div>
            </div>
        </div>
    );
}
