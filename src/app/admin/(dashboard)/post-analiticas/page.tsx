"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Microscope, Search, Calendar, User, Stethoscope, FileText, ArrowRight, Download, FilePlus, Eye, X, Pencil, ArrowUpDown, Beaker, ChevronDown, CheckCircle2, Printer, Check, Globe, Tag, TableProperties, Zap, Save } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function PostAnaliticasPage() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>(todayStr);
    const [endDate, setEndDate] = useState<string>(todayStr);
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [selectedProtocol, setSelectedProtocol] = useState<any>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchProtocol, setSearchProtocol] = useState("");
    const [searchPatient, setSearchPatient] = useState("");
    const [abbreviations, setAbbreviations] = useState<any[]>([]);

    const fetchAbbreviations = useCallback(async (labId: string) => {
        if (!labId) return;
        try {
            const res = await fetch(`/api/abbreviations?laboratoryId=${labId}`);
            if (res.ok) setAbbreviations(await res.json());
        } catch (error) {
            console.error("Error fetching abbreviations:", error);
        }
    }, []);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [resultsProtocol, setResultsProtocol] = useState<any>(null);
    const [loadProtocol, setLoadProtocol] = useState<any>(null);
    const [savingResults, setSavingResults] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // Protocol Search suggestions
    const [protocolSuggestions, setProtocolSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
                fetchAbbreviations(savedLab);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, [fetchAbbreviations]);

    const loadProtocols = useCallback(async (
        labId: string = activeLabId,
        start: string = startDate,
        end: string = endDate,
        query = "",
        patientId = "",
        currentPage = 1,
        append = false,
        searchField = ""
    ) => {
        const status = "ALL";
        if (!labId) return;
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
            setPage(1);
        }

        try {
            // Build query params
            const params = new URLSearchParams();
            params.set("laboratoryId", labId);
            if (start) params.set("startDate", start);
            if (end) params.set("endDate", end);
            if (query) params.set("search", query);
            if (patientId) params.set("patientId", patientId);
            if (status) params.set("status", status);
            if (searchField) params.set("searchField", searchField);
            params.set("page", currentPage.toString());
            params.set("pageSize", "50");

            const res = await fetch(`/api/protocols?${params.toString()}`);
            if (res.ok) {
                const response = await res.json();
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
            }
        } catch (error) {
            console.error("Error loading protocols:", error);
            toast.error("Error al cargar las post-analíticas");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeLabId, startDate, endDate]);

    const lastProtocolElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadProtocols(activeLabId, startDate, endDate, searchProtocol || searchPatient, "", page + 1, true);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, hasMore, loadProtocols, activeLabId, startDate, endDate, searchProtocol, searchPatient, page]);

    useEffect(() => {
        loadProtocols();
    }, [loadProtocols]);

    const [patientSuggestions, setPatientSuggestions] = useState<any[]>([]);
    const [loadingProtocolSuggestions, setLoadingProtocolSuggestions] = useState(false);
    const [loadingPatientSuggestions, setLoadingPatientSuggestions] = useState(false);
    const [showProtocolSuggestions, setShowProtocolSuggestions] = useState(false);
    const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
    const ignoreNextProtocolSearch = useRef(false);
    const ignoreNextPatientSearch = useRef(false);

    const fetchProtocolSuggestions = useCallback(async (q: string, labId: string) => {
        if (!q.trim()) {
            setProtocolSuggestions([]);
            return;
        }
        setLoadingProtocolSuggestions(true);
        try {
            const res = await fetch(`/api/protocols?search=${encodeURIComponent(q)}&laboratoryId=${labId}&limit=8&status=ALL&searchField=numeroSecuencial`);
            const data = await res.json();
            setProtocolSuggestions(data.protocols || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingProtocolSuggestions(false);
        }
    }, []);

    const fetchPatientSuggestions = useCallback(async (q: string, labId: string) => {
        if (!q.trim()) {
            setPatientSuggestions([]);
            return;
        }
        setLoadingPatientSuggestions(true);
        try {
            const res = await fetch(`/api/patients?q=${q}&laboratoryId=${labId}`);
            if (res.ok) {
                const data = await res.json();
                setPatientSuggestions(Array.isArray(data) ? data.slice(0, 5) : []);
            }
        } catch (error) {
            console.error("Error searching patient suggestions:", error);
        } finally {
            setLoadingPatientSuggestions(false);
        }
    }, []);

    const openResultsModal = async (id: string) => {
        setLoadingResults(true);
        try {
            const res = await fetch(`/api/protocols/${id}`);
            if (res.ok) {
                const data = await res.json();
                setResultsProtocol(data);
            } else {
                toast.error("Error al cargar los resultados del protocolo");
            }
        } catch (error) {
            console.error("Error loading protocol for results:", error);
            toast.error("Error al cargar los resultados");
        } finally {
            setLoadingResults(false);
        }
    };

    const openLoadModal = async (id: string) => {
        setLoadingResults(true);
        try {
            const res = await fetch(`/api/protocols/${id}`);
            if (res.ok) {
                const data = await res.json();
                setLoadProtocol(data);
            } else {
                toast.error("Error al cargar para edición");
            }
        } catch (error) {
            console.error("Error loading protocol for edit:", error);
            toast.error("Error al cargar");
        } finally {
            setLoadingResults(false);
        }
    };

    const handleSaveResults = async () => {
        if (!loadProtocol) return;
        setSavingResults(true);
        const loadingToast = toast.loading("Guardando resultados...");

        try {
            const allSubResults: any[] = [];
            loadProtocol.results?.forEach((res: any) => {
                res.subResults?.forEach((sub: any) => {
                    allSubResults.push({ id: sub.id, valor: sub.valor });
                });
            });

            const res = await fetch(`/api/protocols/${loadProtocol.id}/sub-results`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subResults: allSubResults })
            });

            if (res.ok) {
                toast.success("Resultados guardados correctamente", { id: loadingToast });
                setLoadProtocol(null);
                loadProtocols();
            } else {
                throw new Error("Error al guardar");
            }
        } catch (error) {
            console.error("Error saving results:", error);
            toast.error("Error al guardar resultados", { id: loadingToast });
        } finally {
            setSavingResults(false);
        }
    };

    const handleSubResultChange = (resultId: string, subId: string, value: string) => {
        // Precargar 0 si se presiona punto o coma sin dígitos previos
        if (value === "." || value === ",") {
            value = "0,";
        }

        // Limpiar puntos de miles automáticos para procesar el valor real
        let rawContent = value.replace(/\./g, "");

        // Si el valor termina en punto, el usuario intenta poner una coma decimal (teclado numérico)
        if (value.endsWith(".")) {
            rawContent = rawContent + ",";
        }

        // Evitar que haya más de una coma
        const parts = rawContent.split(",");
        let formattedValue = "";

        if (parts.length > 0) {
            const integerPart = parts[0];
            const decimalPart = parts.length > 1 ? "," + parts.slice(1).join("").replace(/,/g, "") : "";

            // Aplicar puntos de miles al entero
            const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            formattedValue = withThousands + decimalPart;
        }

        setLoadProtocol((prev: any) => {
            if (!prev) return prev;

            // Initial update
            let nextProtocol = { ...prev };
            nextProtocol.results = nextProtocol.results.map((r: any) => {
                if (r.id !== resultId) return r;
                return {
                    ...r,
                    subResults: r.subResults.map((s: any) => {
                        if (s.id !== subId) return s;
                        return { ...s, valor: formattedValue };
                    })
                };
            });

            // Run calculations (Stack-based / RPN)
            let changed = true;
            let iterations = 0;
            const parseValue = (v: any) => {
                if (!v) return 0;
                // Primero quitar puntos de miles y luego pasar coma decimal a punto
                return parseFloat(v.toString().replace(/\./g, "").replace(",", ".")) || 0;
            };

            while (changed && iterations < 3) {
                changed = false;
                iterations++;

                // Build values map for the entire protocol scope
                const valMap: Record<string, string> = {};
                nextProtocol.results?.forEach((r: any) => {
                    r.subResults?.forEach((s: any) => {
                        valMap[s.subDetermination?.codigoExterno || ""] = s.valor || "";
                    });
                });

                // Update all calculated fields
                nextProtocol.results = nextProtocol.results.map((r: any) => {
                    return {
                        ...r,
                        subResults: r.subResults.map((s: any) => {
                            const subDet = s.subDetermination;
                            if (subDet?.calcular && subDet?.calculatorSteps?.length > 0) {
                                const stack: number[] = [];
                                const steps = [...subDet.calculatorSteps].sort((a: any, b: any) =>
                                    Number(a.codigoExterno || 0) - Number(b.codigoExterno || 0)
                                );

                                let skipCalculation = false;
                                steps.forEach((step: any) => {
                                    if (skipCalculation) return;
                                    const op = (step.tipoOperacion || "").toUpperCase();

                                    switch (op) {
                                        case 'INGRESAR SUBDET': {
                                            const argId = step.argumentoIDSubDete || "";
                                            const rawVal = valMap[argId] || "";
                                            if (!rawVal.trim()) {
                                                skipCalculation = true;
                                                return;
                                            }
                                            stack.push(parseValue(rawVal));
                                            break;
                                        }
                                        case 'INGRESAR NUMERO': {
                                            stack.push(step.argumentoNumerico || 0);
                                            break;
                                        }
                                        case 'SUMAR': case '+': {
                                            const v2 = stack.pop() || 0;
                                            const v1 = stack.pop() || 0;
                                            stack.push(v1 + v2);
                                            break;
                                        }
                                        case 'RESTAR': case '-': {
                                            const v2 = stack.pop() || 0;
                                            const v1 = stack.pop() || 0;
                                            stack.push(v1 - v2);
                                            break;
                                        }
                                        case 'MULTIPLICAR': case '*': {
                                            const v2 = stack.pop() || 0;
                                            const v1 = stack.pop() || 0;
                                            stack.push(v1 * v2);
                                            break;
                                        }
                                        case 'DIVIDIR': case '/': {
                                            const v2 = stack.pop() || 0;
                                            const v1 = stack.pop() || 0;
                                            stack.push(v2 !== 0 ? v1 / v2 : 0);
                                            break;
                                        }
                                        default: {
                                            // Assignment fallbacks
                                            if (['S', 'SET', '=', 'C'].includes(op)) {
                                                const argId = step.argumentoIDSubDete || "";
                                                if (argId) {
                                                    const rawVal = valMap[argId] || "";
                                                    if (!rawVal.trim()) {
                                                        skipCalculation = true;
                                                        return;
                                                    }
                                                    stack.push(parseValue(rawVal));
                                                } else {
                                                    stack.push(step.argumentoNumerico || 0);
                                                }
                                            }
                                            break;
                                        }
                                    }
                                });

                                if (skipCalculation) {
                                    if (s.valor !== "") {
                                        changed = true;
                                        return { ...s, valor: "" };
                                    }
                                    return s;
                                }

                                const resultNum = stack.pop() || 0;

                                // Precision formatting based on subdet.formato
                                let decimals = 2;
                                const fmt = subDet.formato;
                                if (fmt === 'INTEGER') decimals = 0;
                                else if (fmt === 'DECIMAL_1') decimals = 1;
                                else if (fmt === 'DECIMAL_2') decimals = 2;
                                else if (fmt === 'DECIMAL_3') decimals = 3;

                                // Formatear resultado con miles y decimales
                                const parts = resultNum.toFixed(decimals).replace(".", ",").split(",");
                                const withThousands = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                                const formattedResult = withThousands + (parts.length > 1 ? "," + parts[1] : "");

                                if (s.valor !== formattedResult) {
                                    changed = true;
                                    return { ...s, valor: formattedResult };
                                }
                            }
                            return s;
                        })
                    };
                });
            }

            return nextProtocol;
        });
    };

    const handleSubResultBlur = (resultId: string, subId: string, value: string) => {
        const abbrev = abbreviations.find(a => a.abreviatura.toLowerCase() === value.trim().toLowerCase());
        if (abbrev) {
            handleSubResultChange(resultId, subId, abbrev.resultado);
        }
    };


    useEffect(() => {
        if (ignoreNextProtocolSearch.current) {
            ignoreNextProtocolSearch.current = false;
            return;
        }
        const t = setTimeout(() => {
            if (searchProtocol.length >= 2) {
                fetchProtocolSuggestions(searchProtocol, activeLabId);
                setShowProtocolSuggestions(true);
            } else {
                setProtocolSuggestions([]);
                setShowProtocolSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchProtocol, activeLabId, fetchProtocolSuggestions]);

    const handleProtocolSearchChange = (val: string) => {
        const upperVal = val.toUpperCase();
        setSearchProtocol(upperVal);
        if (upperVal) {
            setSearchPatient("");
            setStartDate("");
            setEndDate("");
            setProtocolSuggestions([]);
        }
    };

    useEffect(() => {
        if (ignoreNextPatientSearch.current) {
            ignoreNextPatientSearch.current = false;
            return;
        }
        const t = setTimeout(() => {
            if (searchPatient.length >= 2) {
                fetchPatientSuggestions(searchPatient, activeLabId);
                setShowPatientSuggestions(true);
            } else {
                setPatientSuggestions([]);
                setShowPatientSuggestions(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [searchPatient, activeLabId, fetchPatientSuggestions]);

    const handleSelectProtocolSuggestion = (protocol: any) => {
        ignoreNextProtocolSearch.current = true;
        setSearchProtocol(protocol.numeroSecuencial);
        setProtocolSuggestions([]);
        setShowProtocolSuggestions(false);
        setSearchPatient("");
        setStartDate(""); // Logic from Libro de Entradas
        setEndDate("");
        loadProtocols(activeLabId, "", "", protocol.numeroSecuencial, "", 1, false, "numeroSecuencial");
    };

    const handleSelectPatientSuggestion = (patient: any) => {
        ignoreNextPatientSearch.current = true;
        const patientName = `${patient.apellido}, ${patient.nombre}`;
        setSearchPatient(patientName);
        setPatientSuggestions([]);
        setShowPatientSuggestions(false);
        setSearchProtocol("");
        setStartDate("");
        setEndDate("");
        loadProtocols(activeLabId, "", "", patientName, patient.id);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowProtocolSuggestions(false);
        setShowPatientSuggestions(false);
        
        let searchField = "";
        let query = "";
        
        if (searchProtocol.trim()) {
            query = searchProtocol.trim();
            searchField = "numeroSecuencial";
        } else if (searchPatient.trim()) {
            query = searchPatient.trim();
        }
        
        loadProtocols(activeLabId, startDate, endDate, query, "", 1, false, searchField);
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
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden print:p-0">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                        <Microscope className="text-purple-500" size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">Postanalítica</h1>
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-black tracking-widest uppercase">
                                {totalResults} Registros
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Seguimiento y validación post-analítica de protocolos</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Protocol Search */}
                    <div className="relative group z-[60]">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                            <Tag size={16} className="text-zinc-400 ml-2" />
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="N° PROTOCOLO"
                                    value={searchProtocol}
                                    onChange={(e) => handleProtocolSearchChange(e.target.value)}
                                    className="bg-transparent text-[10px] font-black outline-none w-20 sm:w-24 uppercase font-mono px-1 placeholder:tracking-tighter"
                                />
                            </form>
                            {searchProtocol && (
                                <button
                                    onClick={() => {
                                        setSearchProtocol("");
                                        loadProtocols(activeLabId, startDate, endDate, "");
                                    }}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                                    title="Limpiar búsqueda de protocolo"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {loadingProtocolSuggestions && (
                                <div className="animate-spin w-3 h-3 border-2 border-purple-500/20 border-t-purple-500 rounded-full mr-1" />
                            )}
                        </div>

                        {/* Floating Protocol Suggestions */}
                        <AnimatePresence>
                            {showProtocolSuggestions && protocolSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-w-[300px]"
                                >
                                    <div className="p-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2">Sugerencias de Protocolos</p>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        {protocolSuggestions.map((p) => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleSelectProtocolSuggestion(p)}
                                                className="w-full p-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-[10px]">
                                                        P
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                            {p.numeroSecuencial}
                                                        </p>
                                                        <p className="text-[10px] text-zinc-500 uppercase font-medium">
                                                            {p.patient?.apellido}, {p.patient?.nombre}
                                                        </p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-zinc-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Patient Search */}
                    <div className="relative group z-[60]">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                            <Search size={16} className="text-zinc-400 ml-2" />
                            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="PACIENTE / DNI..."
                                    value={searchPatient}
                                    onChange={(e) => setSearchPatient(e.target.value)}
                                    className="bg-transparent text-[10px] font-black outline-none w-32 sm:w-40 uppercase px-1 placeholder:tracking-tighter"
                                />
                            </form>
                            {searchPatient && (
                                <button
                                    onClick={() => {
                                        setSearchPatient("");
                                        loadProtocols(activeLabId, startDate, endDate, "");
                                    }}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                                    title="Limpiar búsqueda de paciente"
                                >
                                    <X size={14} />
                                </button>
                            )}
                            {loadingPatientSuggestions && (
                                <div className="animate-spin w-3 h-3 border-2 border-purple-500/20 border-t-purple-500 rounded-full mr-1" />
                            )}
                        </div>

                        {/* Floating Patient Suggestions */}
                        <AnimatePresence>
                            {showPatientSuggestions && patientSuggestions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-w-[280px]"
                                >
                                    <div className="p-2 border-b border-zinc-50 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-2">Sugerencias de Pacientes</p>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                        {patientSuggestions.map((pa) => (
                                            <button
                                                key={pa.id}
                                                onClick={() => handleSelectPatientSuggestion(pa)}
                                                className="w-full p-3 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                                            >
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                                                        {pa.apellido[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{pa.apellido}, {pa.nombre}</p>
                                                        <p className="text-[10px] text-zinc-500">DNI: {pa.documento}</p>
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-zinc-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative z-[60]">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-purple-500/20 transition-all select-none">
                            <Calendar size={16} className="text-zinc-400 ml-2" />
                            <div className="flex items-center gap-1">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold outline-none px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter"
                                />
                                <span className="text-[10px] text-zinc-400 font-black px-0.5">AL</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-[10px] font-bold outline-none px-1 py-1 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-600 dark:text-zinc-300 uppercase tracking-tighter"
                                />
                            </div>
                            {(startDate || endDate) && (
                                <button
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-red-500 transition-colors mr-1"
                                    title="Limpiar rango para buscar en todo el historial"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>



                    <Link
                        href="/admin/nuevo-ingreso"
                        className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
                        title="Nuevo Ingreso"
                    >
                        <FilePlus size={20} />
                    </Link>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:block mb-8 border-b pb-4">
                <h1 className="text-xl font-bold uppercase">Postanalítica - Bio.itia</h1>
                <p className="text-sm text-zinc-600">
                    {startDate && endDate
                        ? (startDate === endDate
                            ? `Fecha: ${new Date(startDate + 'T12:00:00').toLocaleDateString('es-AR', { dateStyle: 'long' })}`
                            : `Desde: ${startDate} Hasta: ${endDate}`)
                        : "Historial Completo"}
                </p>
                <div className="text-xs mt-2 font-mono">Total Registros: {filteredProtocols.length}</div>
            </div>

            {/* Content Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden print:shadow-none print:border-zinc-200 print:rounded-none">
                {loading ? (
                    <div className="p-20 text-center print:hidden">
                        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-500 font-medium">Cargando datos...</p>
                    </div>
                ) : filteredProtocols.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800 print:bg-zinc-50">
                                    <th className="px-6 py-4 print:text-black min-w-[140px]">
                                        <button
                                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest hover:text-purple-500 transition-colors group/sort"
                                        >
                                            Protocolo
                                            <ArrowUpDown size={12} className={cn(
                                                "transition-colors",
                                                sortOrder === 'asc' ? "text-purple-500" : "text-zinc-300 group-hover/sort:text-purple-400"
                                            )} />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Paciente / DNI</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Fecha/Hora</th>

                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">OS / Prepaga</th>



                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:text-black">Médico</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest print:hidden text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50 print:divide-zinc-200">
                                {filteredProtocols.map((protocol) => {
                                    const defaultHI = protocol.results?.find((r: any) => r.healthInsurance)?.healthInsurance?.nombre
                                        || protocol.patient?.healthInsurances?.find((h: any) => h.isDefault)?.healthInsurance?.nombre
                                        || "Particular";

                                    return (
                                        <tr key={protocol.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors print:hover:bg-transparent">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold font-mono text-purple-600 dark:text-purple-400">
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
                                                    <span className="text-[10px] text-zinc-400 font-medium">DNI: {protocol.patient?.documento}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-zinc-500 font-mono block">
                                                    {(() => {
                                                        const d = new Date(protocol.createdAt);
                                                        const day = d.getUTCDate().toString().padStart(2, '0');
                                                        const mon = (d.getUTCMonth() + 1).toString().padStart(2, '0');
                                                        const yr = d.getUTCFullYear();
                                                        return `${day}/${mon}/${yr}`;
                                                    })()}
                                                </span>
                                                <span className="text-[10px] font-medium text-zinc-400 font-mono block italic">
                                                    {(() => {
                                                        const d = new Date(protocol.createdAt);
                                                        const hr = d.getUTCHours().toString().padStart(2, '0');
                                                        const min = d.getUTCMinutes().toString().padStart(2, '0');
                                                        return `${hr}:${min}`;
                                                    })()}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                                                    {defaultHI}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                 <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                                     {protocol.doctor ? `${protocol.doctor.apellido}, ${protocol.doctor.nombre}` : 'Particular'}
                                                 </span>
                                            </td>
                                            <td className="px-6 py-4 text-right print:hidden">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedProtocol(protocol)}
                                                        className="p-2 rounded-xl text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Ver detalle rápido"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openResultsModal(protocol.id)}
                                                        className="p-2 rounded-xl text-zinc-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                        title="Ver resultados"
                                                    >
                                                        <TableProperties size={18} />
                                                    </button>
                                                    {!protocol.firmado && (
                                                        <>
                                                            <button
                                                                onClick={() => openLoadModal(protocol.id)}
                                                                className="p-2 rounded-xl text-blue-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Cargar resultados"
                                                            >
                                                                <Zap size={18} />
                                                            </button>
                                                            <Link
                                                                href={`/admin/nuevo-ingreso?edit=${protocol.id}`}
                                                                className="p-2 rounded-xl text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Editar protocolo"
                                                            >
                                                                <Pencil size={18} />
                                                            </Link>
                                                        </>
                                                    )}
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
                            <Microscope className="text-zinc-200" size={32} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-400">
                            {(searchProtocol || searchPatient)
                                ? "No se encontraron resultados para tu búsqueda"
                                : startDate
                                    ? "No se encontraron protocolos para el rango seleccionado"
                                    : "No hay protocolos registrados en el historial"}
                        </h3>
                        <p className="text-xs text-zinc-300 mt-1">
                            {(searchProtocol || searchPatient)
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
                                    <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
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
                                    <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center border border-purple-100 dark:border-purple-800/30">
                                        <FileText className="text-purple-500" size={24} />
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
                                                 {selectedProtocol.doctor ? `${selectedProtocol.doctor.apellido}, ${selectedProtocol.doctor.nombre}` : 'Particular'}
                                             </p>
                                         </div>
                                    </div>

                                    <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800/50">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Beaker size={12} className="text-purple-500" />
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

            {/* Results Modal */}
            <AnimatePresence>
                {resultsProtocol && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setResultsProtocol(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-8 pb-6 flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                                        <TableProperties className="text-indigo-500" size={32} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-2xl font-black tracking-tight">Carga de Resultados</h2>
                                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-black tracking-widest uppercase">
                                                Protocolo {resultsProtocol.numeroSecuencial}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 font-medium">
                                            Paciente: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{resultsProtocol.patient?.apellido}, {resultsProtocol.patient?.nombre}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setResultsProtocol(null)}
                                    className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                                <div className="space-y-8">
                                    {resultsProtocol.results?.map((res: any) => (
                                        <div key={res.id} className="bg-zinc-50/50 dark:bg-zinc-800/20 rounded-3xl border border-zinc-100 dark:border-zinc-800/50 overflow-hidden">
                                            <div className="px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                                                        <Beaker size={16} className="text-indigo-500" />
                                                    </div>
                                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight text-sm">{res.determination?.nombre}</h3>
                                                </div>
                                                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest bg-zinc-50 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                                                    {res.determination?.section?.nombre || "SIN SECCIÓN"}
                                                </span>
                                            </div>

                                            <div className="p-2">
                                                <table className="w-full">
                                                    <thead>
                                                        <tr className="text-left">
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Subdeterminación</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Valor</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Unidad</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">V. Referencia</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                                        {res.subResults?.map((sub: any) => (
                                                            <tr key={sub.id} className="group hover:bg-white dark:hover:bg-zinc-900/50 transition-colors">
                                                                <td className="px-4 py-4">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                                            {sub.subDetermination?.nombre}
                                                                        </span>
                                                                     </div>
                                                                 </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 shadow-sm">
                                                                        {sub.valor || "-"}
                                                                    </div>
                                                                </td>
                                                                 <td className="px-4 py-4">
                                                                     <span className="text-[10px] font-bold text-zinc-500 lowercase">
                                                                         {sub.subDetermination?.unit?.nombre || "-"}
                                                                     </span>
                                                                 </td>
                                                                <td className="px-4 py-4">
                                                                    <div className="text-[10px] text-zinc-400 whitespace-pre-wrap leading-relaxed max-w-[200px]">
                                                                        {sub.subDetermination?.referenceValues?.[0]?.valoresNormales || "-"}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!res.subResults || res.subResults.length === 0) && (
                                                            <tr>
                                                                <td colSpan={4} className="px-4 py-8 text-center">
                                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sin sub-resultados registrados</p>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                    Visualizando determinaciones: {resultsProtocol.results?.length || 0}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setResultsProtocol(null)}
                                        className="px-6 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Load/Edit Results Modal */}
            <AnimatePresence>
                {loadProtocol && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !savingResults && setLoadProtocol(null)}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        >
                            <div className="p-4 py-2 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 shrink-0 relative">
                                <div className="w-10" /> {/* Placeholder to balance the 'X' on the left */}
                                
                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                    <h2 className="text-lg font-black tracking-tighter leading-none">Carga de Resultados</h2>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em]">{loadProtocol.numeroSecuencial}</span>
                                        <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-tight">
                                            Paciente: <span className="text-zinc-900 dark:text-zinc-100">{loadProtocol.patient?.apellido}, {loadProtocol.patient?.nombre}</span>
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => !savingResults && setLoadProtocol(null)}
                                    className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all text-zinc-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white dark:bg-zinc-900">
                                <table className="w-full border-collapse">
                                    <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800 shadow-sm">
                                        <tr>
                                            <th className="px-3 py-1 text-left text-[8px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 w-[20%]">Determinación</th>
                                            <th className="px-3 py-1 text-left text-[8px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 w-[30%]">Subdeterminación</th>
                                            <th className="px-3 py-1 text-left text-[8px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 w-[25%]">Valor / Resultado</th>
                                            <th className="px-3 py-1 text-center text-[8px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 w-[10%]">Unidad</th>
                                            <th className="px-3 py-1 text-left text-[8px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-200 dark:border-zinc-700">Ref.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {(() => {
                                            let globalIndex = 0;
                                            return loadProtocol.results?.flatMap((res: any) => {
                                                const subResults = res.subResults || [{ id: `empty-${res.id}`, isDummy: true }];
                                                return subResults.map((sub: any, idx: number) => {
                                                    const currentGlobalIndex = sub.isDummy ? -1 : globalIndex++;
                                                    return (
                                                        <tr key={sub.id} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                                                            {idx === 0 && (
                                                                <td
                                                                    rowSpan={subResults.length}
                                                                    className="px-3 py-0.5 align-top border-r border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-800/20"
                                                                >
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight">
                                                                            {res.determination?.nombre}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest leading-none">
                                                                            {res.determination?.section?.nombre || "General"}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="px-3 py-0.5 h-7 align-middle border-b border-zinc-100 dark:border-zinc-800/50">
                                                                {sub.isDummy ? (
                                                                    <span className="text-[9px] font-bold text-zinc-300 italic whitespace-nowrap">Sin sub-campos</span>
                                                                ) : (
                                                                    <div className="flex flex-col gap-0">
                                                                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={sub.subDetermination?.nombre}>
                                                                            {sub.subDetermination?.nombre}
                                                                        </span>
                                                                     </div>
                                                                 )}
                                                             </td>
                                                            <td className="px-3 py-0.5 h-7 align-middle border-b border-zinc-100 dark:border-zinc-800/50">
                                                                {!sub.isDummy && (() => {
                                                                    const val = parseFloat((sub.valor || "").toString().replace(",", "."));
                                                                    const min = parseFloat((sub.subDetermination?.valorMinimo || "").toString().replace(",", "."));
                                                                    const max = parseFloat((sub.subDetermination?.valorMaximo || "").toString().replace(",", "."));
                                                                    const isOut = !isNaN(val) && (
                                                                        (!isNaN(min) && val < min) ||
                                                                        (!isNaN(max) && val > max)
                                                                    );

                                                                    return (
                                                                        <input
                                                                            type="text"
                                                                            id={`result-input-${currentGlobalIndex}`}
                                                                            value={sub.valor || ""}
                                                                            onChange={(e) => handleSubResultChange(res.id, sub.id, e.target.value)}
                                                                            onBlur={(e) => handleSubResultBlur(res.id, sub.id, e.target.value)}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter" || e.key === "ArrowDown") {
                                                                                    e.preventDefault();
                                                                                    let nextIdx = currentGlobalIndex + 1;
                                                                                    let found = false;
                                                                                    while (nextIdx < 500) { // Safety limit
                                                                                        const nextInput = document.getElementById(`result-input-${nextIdx}`) as HTMLInputElement;
                                                                                        if (nextInput) {
                                                                                            if (nextInput.disabled) {
                                                                                                nextIdx++;
                                                                                                continue;
                                                                                            }
                                                                                            nextInput.focus();
                                                                                            nextInput.select();
                                                                                            found = true;
                                                                                            break;
                                                                                        } else {
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                    if (!found && e.key === "Enter") {
                                                                                        document.getElementById("btn-save-results")?.focus();
                                                                                    }
                                                                                } else if (e.key === "ArrowUp") {
                                                                                    e.preventDefault();
                                                                                    let prevIdx = currentGlobalIndex - 1;
                                                                                    while (prevIdx >= 0) {
                                                                                        const prevInput = document.getElementById(`result-input-${prevIdx}`) as HTMLInputElement;
                                                                                        if (prevInput) {
                                                                                            if (prevInput.disabled) {
                                                                                                prevIdx--;
                                                                                                continue;
                                                                                            }
                                                                                            prevInput.focus();
                                                                                            prevInput.select();
                                                                                            break;
                                                                                        } else {
                                                                                            break;
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }}
                                                                            placeholder={sub.subDetermination?.calcular ? "" : "-"}
                                                                            readOnly={sub.subDetermination?.calcular}
                                                                            disabled={sub.subDetermination?.calcular}
                                                                            className={`w-full h-6 px-2 border rounded transition-all font-mono text-[13px] font-bold shadow-sm outline-none ${sub.subDetermination?.calcular
                                                                                    ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 cursor-not-allowed"
                                                                                    : isOut
                                                                                        ? "bg-red-50 dark:bg-red-900/30 border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-500/10 text-red-600 dark:text-red-400"
                                                                                        : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-blue-600 dark:text-blue-400"
                                                                                }`}
                                                                        />
                                                                    );
                                                                })()}
                                                            </td>
                                                             <td className="px-3 py-0.5 h-7 text-center border-b border-zinc-100 dark:border-zinc-800/50 align-middle">
                                                                 {!sub.isDummy && (
                                                                     <span className="text-[10px] font-bold text-zinc-500 lowercase">
                                                                         {sub.subDetermination?.unit?.nombre || "-"}
                                                                     </span>
                                                                 )}
                                                             </td>
                                                            <td className="px-3 py-0.5 h-7 align-middle border-b border-zinc-100 dark:border-zinc-800/50">
                                                                {!sub.isDummy && (
                                                                    <div className="text-[9px] text-zinc-400 leading-none truncate max-w-[100px]" title={sub.subDetermination?.referenceValues?.[0]?.valoresNormales}>
                                                                        {sub.subDetermination?.referenceValues?.[0]?.valoresNormales || "-"}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            });
                                        })()}
                                    </tbody>
                                </table>
                                     <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Listo para guardar</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => !savingResults && setLoadProtocol(null)}
                                        className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9px] font-black uppercase tracking-widest rounded-lg"
                                        disabled={savingResults}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        id="btn-save-results"
                                        onClick={handleSaveResults}
                                        disabled={savingResults}
                                        className="px-6 py-1.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                                    >
                                        {savingResults ? (
                                            <div className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={12} />
                                        )}
                                        Guardar
                                    </button>
                                </div>
                            </div>
                     </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {loadingResults && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-2xl flex flex-col items-center gap-4 border border-zinc-100 dark:border-zinc-800">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cargando resultados...</p>
                    </div>
                </div>
            )}

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
