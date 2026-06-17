"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Calendar, User, Microscope, ArrowUpDown, Filter, LayoutGrid, ChevronDown, ListOrdered, Beaker, FileText, X, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function PostAnaliticasPorSeccion() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [protocols, setProtocols] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSection, setSelectedSection] = useState<string>("all");
    const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [showOnlyPending, setShowOnlyPending] = useState(true);
    const [searchProtocol, setSearchProtocol] = useState("");
    
    // Track edits locally
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [abbreviations, setAbbreviations] = useState<any[]>([]);

    const fetchAbbreviations = useCallback(async () => {
        try {
            const res = await fetch('/api/abbreviations');
            if (res.ok) setAbbreviations(await res.json());
        } catch (error) {
            console.error("Error fetching abbreviations:", error);
        }
    }, []);

    useEffect(() => {
        fetchAbbreviations();
    }, [fetchAbbreviations]);

    const fetchData = useCallback(async (forcedProtocol?: string) => {
        if (!session?.user) return;
        setLoading(true);
        try {
            // Fetch sections for the filter
            const secRes = await fetch('/api/sections');
            if (secRes.ok) setSections(await secRes.json());

            // Get laboratory ID
            const labId = (session.user as any).laboratoryId;

            // Build query params
            const params = new URLSearchParams();
            if (labId) params.set("laboratoryId", labId);
            
            const targetProtocol = forcedProtocol !== undefined ? forcedProtocol : searchProtocol;
            
            if (targetProtocol) {
                params.set("search", targetProtocol);
                params.set("searchField", "numeroSecuencial");
            } else {
                if (startDate) params.set("startDate", startDate);
                if (endDate) params.set("endDate", endDate);
            }

            // Fetch protocols
            const res = await fetch(`/api/protocols?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                const fetchedProtocols = data.data || [];
                setProtocols(fetchedProtocols);
                
                // Initialize edited values from fetched data
                const initialValues: Record<string, string> = {};
                fetchedProtocols.forEach((p: any) => {
                    p.results?.forEach((r: any) => {
                        r.subResults?.forEach((s: any) => {
                            if (!editedValues[s.id]) {
                                initialValues[s.id] = s.valor || "";
                            }
                        });
                    });
                });
                setEditedValues(prev => ({ ...initialValues, ...prev }));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, session, searchProtocol]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleProtocolSearchChange = (val: string) => {
        const upperVal = val.toUpperCase();
        setSearchProtocol(upperVal);
        if (upperVal) {
            setStartDate("");
            setEndDate("");
        }
    };

    const handleValueChange = (subId: string, value: string) => {
        // Precargar 0 si se presiona punto o coma sin dígitos previos
        if (value === "." || value === ",") {
            value = "0,";
        }

        // Primero, limpiar puntos automáticos previos para procesar el valor real
        let rawContent = value.replace(/\./g, "");

        // Si el valor termina en punto, el usuario intenta poner una coma decimal (teclado numérico)
        if (value.endsWith(".")) {
            rawContent = rawContent + ",";
        }

        // Evitar que haya más de una coma
        const parts = rawContent.split(",");
        let formattedValue = "";

        if (parts.length > 0) {
            // El primer segmento es el entero. Los demás son decimales.
            const integerPart = parts[0];
            const decimalPart = parts.length > 1 ? "," + parts.slice(1).join("").replace(/,/g, "") : "";
            
            // Aplicar puntos de miles al entero
            const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            formattedValue = withThousands + decimalPart;
        }

        setEditedValues(prev => {
            const newValues = { ...prev, [subId]: formattedValue };
            
            // Find protocol that owns this subId
            const protocol = protocols.find(p => 
                p.results?.some((r: any) => 
                    r.subResults?.some((s: any) => s.id === subId)
                )
            );

            if (!protocol) return newValues;

            // Simple calculation engine for many-to-one or dependent fields
            // We iterate a few times to handle chained dependencies
            let changed = true;
            let iterations = 0;
            while (changed && iterations < 3) {
                changed = false;
                iterations++;

                // Map of external_id -> value for THIS protocol
                const valMap: Record<string, string> = {};
                protocol.results?.forEach((r: any) => {
                    r.subResults?.forEach((s: any) => {
                        valMap[s.subDetermination?.codigoExterno || ""] = newValues[s.id] || "";
                    });
                });

                const parseValue = (v: string) => {
                    if (!v) return 0;
                    return parseFloat(v.toString().replace(/\./g, "").replace(",", ".")) || 0;
                };

                // Check all calculated subResults in this protocol
                protocol.results?.forEach((r: any) => {
                    r.subResults?.forEach((s: any) => {
                        const subDet = s.subDetermination;
                        if (subDet?.calcular && subDet?.calculatorSteps?.length > 0) {
                            const stack: number[] = [];
                            
                            // Sort steps by ID (assuming creation order = sequence)
                            const steps = [...subDet.calculatorSteps].sort((a: any, b: any) => 
                                Number(a.codigoExterno || 0) - Number(b.codigoExterno || 0)
                            );
                            
                            let skipCalculation = false;
                            steps.forEach((step: any) => {
                                if (skipCalculation) return;
                                const op = (step.tipoOperacion || "").toUpperCase();
                                
                                switch(op) {
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
                                        const b = stack.pop() || 0;
                                        const a = stack.pop() || 0;
                                        stack.push(a + b);
                                        break;
                                    }
                                    case 'RESTAR': case '-': {
                                        const b = stack.pop() || 0;
                                        const a = stack.pop() || 0;
                                        stack.push(a - b);
                                        break;
                                    }
                                    case 'MULTIPLICAR': case '*': {
                                        const b = stack.pop() || 0;
                                        const a = stack.pop() || 0;
                                        stack.push(a * b);
                                        break;
                                    }
                                    case 'DIVIDIR': case '/': {
                                        const b = stack.pop() || 0;
                                        const a = stack.pop() || 0;
                                        stack.push(b !== 0 ? a / b : 0);
                                        break;
                                    }
                                    // Fallback for previous simple assignment
                                    case 'S': case 'SET': case '=': case 'C': {
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
                                        break;
                                    }
                                }
                            });

                            if (skipCalculation) {
                                if (newValues[s.id] !== "") {
                                    newValues[s.id] = "";
                                    changed = true;
                                }
                                return;
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
                            
                            if (newValues[s.id] !== formattedResult) {
                                newValues[s.id] = formattedResult;
                                changed = true;
                            }
                        }
                    });
                });
            }

            return newValues;
        });
    };

    const handleBlur = (subId: string, value: string) => {
        const abbrev = abbreviations.find(a => a.abreviatura.toLowerCase() === value.trim().toLowerCase());
        if (abbrev) {
            handleValueChange(subId, abbrev.resultado);
        }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        const loadingToast = toast.loading("Guardando resultados...");
        try {
            // Flatten values to { id: string, valor: string }[] format
            const subResultsData = Object.entries(editedValues).map(([id, valor]) => ({ id, valor }));
            
            // We use the same API for each protocol or a consolidated one? 
            // Better to use protocol by protocol if the user expects it, 
            // but since many might be modified across different protocols, we need a smarter way.
            // Let's assume we can just pass them all to an endpoint if we had it.
            // For now, I'll update all through sequential protocol calls? No, too slow.
            // I'll update my PATCH /api/protocols/[id]/sub-results logic to handle general batch?
            // No, I'll just do it by groups of protocol.

            const protocolMap = new Map();
            protocols.forEach(protocol => {
                const protocolSubIds = protocol.results?.flatMap((r: any) => r.subResults?.map((s: any) => s.id));
                protocolSubIds?.forEach((sid: string) => protocolMap.set(sid, protocol.id));
            });

            const updatesByProtocol: Record<string, any[]> = {};
            subResultsData.forEach(item => {
                const protocolId = protocolMap.get(item.id);
                if (protocolId) {
                    if (!updatesByProtocol[protocolId]) updatesByProtocol[protocolId] = [];
                    updatesByProtocol[protocolId].push(item);
                }
            });

            await Promise.all(Object.entries(updatesByProtocol).map(([pid, updates]) => 
                fetch(`/api/protocols/${pid}/sub-results`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subResults: updates })
                })
            ));

            toast.success("Todos los resultados guardados correctamente", { id: loadingToast });
            fetchData();
        } catch (error) {
            console.error("Error saving all:", error);
            toast.error("Error al guardar cambios", { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    const flattenedResults = useMemo(() => {
        const list: any[] = [];
        protocols.forEach(protocol => {
            protocol.results?.forEach((res: any) => {
                const sectionName = res.determination?.section?.nombre || "General";
                const sectionId = res.determination?.sectionId || "none";
                
                // If section filter is active, skip if not matching
                if (selectedSection !== "all" && sectionId !== selectedSection) return;

                res.subResults?.forEach((sub: any) => {
                    // Filter based on initial/server value if pending filter is on
                    if (showOnlyPending && sub.valor && sub.valor.trim() !== "") return;

                    list.push({
                        id: sub.id,
                        protocolId: protocol.id,
                        protocolNumber: protocol.numeroSecuencial,
                        patientName: `${protocol.patient?.apellido}, ${protocol.patient?.nombre}`,
                        sectionName,
                        determinationName: res.determination?.nombre,
                        subName: sub.subDetermination?.nombre,
                        unit: sub.subDetermination?.unit?.nombre,
                        calcular: sub.subDetermination?.calcular,
                        extension: "",
                        valorMinimo: sub.subDetermination?.valorMinimo,
                        valorMaximo: sub.subDetermination?.valorMaximo,
                        firmado: protocol.firmado
                    });
                });
            });
        });
        return list;
    }, [protocols, selectedSection, showOnlyPending]);

    const filteredAndSearched = useMemo(() => {
        if (!searchTerm) return flattenedResults;
        const lowSearch = searchTerm.toLowerCase();
        return flattenedResults.filter(item => 
            item.protocolNumber.toLowerCase().includes(lowSearch) ||
            item.patientName.toLowerCase().includes(lowSearch) ||
            item.determinationName.toLowerCase().includes(lowSearch) ||
            item.subName.toLowerCase().includes(lowSearch) ||
            (item.extension || "").toLowerCase().includes(lowSearch)
        );
    }, [flattenedResults, searchTerm]);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-zinc-950 p-4 lg:p-6 gap-4">
            {/* Header section */}
            <header className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-indigo-200 dark:shadow-none shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <LayoutGrid className="text-white" size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">Carga <span className="text-indigo-600">Por Sección</span></h1>
                            <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest opacity-70">Entrada de resultados segmentada</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all h-11">
                            <Tag size={16} className="text-zinc-400 ml-2" />
                            <input
                                type="text"
                                placeholder="N° PROTOCOLO"
                                value={searchProtocol}
                                onChange={(e) => handleProtocolSearchChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") fetchData();
                                }}
                                className="bg-transparent text-[10px] font-black outline-none w-20 sm:w-24 uppercase font-mono px-1 placeholder:tracking-tighter"
                            />
                            {searchProtocol && (
                                <button
                                    onClick={() => {
                                        setSearchProtocol("");
                                        const now = new Date().toISOString().split('T')[0];
                                        setStartDate(now);
                                        setEndDate(now);
                                        fetchData("");
                                    }}
                                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3 px-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm h-11">
                            <label className="flex items-center gap-2 cursor-pointer select-none group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={showOnlyPending}
                                        onChange={(e) => setShowOnlyPending(e.target.checked)}
                                    />
                                    <div className={`w-8 h-4 rounded-full transition-colors duration-200 ${showOnlyPending ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${showOnlyPending ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-indigo-600 transition-colors whitespace-nowrap">Solo Pendientes</span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-sm">
                            <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center gap-2">
                                <Calendar className="text-indigo-600" size={14} />
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={startDate} 
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold text-indigo-700 dark:text-indigo-400 outline-none w-[90px]"
                                    />
                                    <span className="text-indigo-300 font-bold">/</span>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold text-indigo-700 dark:text-indigo-400 outline-none w-[90px]"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleSaveAll}
                            disabled={saving || loading}
                            className="h-11 px-6 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Microscope size={16} />
                            )}
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar por protocolo, paciente, análisis..."
                            className="w-full h-11 pl-12 pr-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 rounded-xl text-sm font-medium shadow-sm transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Filter className="text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        </div>
                        <select
                            className="w-full h-11 pl-12 pr-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 rounded-xl text-xs font-bold shadow-sm transition-all outline-none appearance-none cursor-pointer"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="all">Todas las Secciones</option>
                            {sections.map((sec) => (
                                <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <ChevronDown className="text-zinc-400" size={16} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 min-h-0">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none overflow-hidden flex flex-col h-full max-h-[calc(100vh-210px)]">
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-800/80 backdrop-blur-md">
                                <tr>
                                    <th className="px-5 py-2 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">Protocolo / Paciente</th>
                                    <th className="px-5 py-2 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">Determinación / Sub</th>
                                    <th className="px-5 py-2 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">Valor / Unidad</th>
                                    <th className="px-5 py-2 text-left text-[9px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">Sección</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <tr key={`skeleton-${i}`}>
                                                <td colSpan={4} className="px-5 py-2">
                                                    <div className="h-5 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : filteredAndSearched.length > 0 ? (
                                        filteredAndSearched.map((result, idx) => (
                                            <motion.tr
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                key={result.id}
                                                className={`group transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50/60 dark:bg-zinc-800/20'} hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40`}
                                            >
                                                <td className="px-5 py-0.5 h-8 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                    <div className="flex flex-col gap-0">
                                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight leading-none">{result.protocolNumber}</span>
                                                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">{result.patientName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-0.5 h-8 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                    <div className="flex flex-col gap-0">
                                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter leading-none">{result.determinationName}</span>
                                                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate max-w-[150px]">{result.subName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-0.5 h-8 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-1 max-w-[110px]">
                                                            {(() => {
                                                                const val = parseFloat((editedValues[result.id] || "").replace(",", "."));
                                                                const min = parseFloat((result.valorMinimo || "").replace(",", "."));
                                                                const max = parseFloat((result.valorMaximo || "").replace(",", "."));
                                                                const isOut = !isNaN(val) && (
                                                                    (!isNaN(min) && val < min) || 
                                                                    (!isNaN(max) && val > max)
                                                                );
                                                                
                                                                return (
                                                                    <input
                                                                        type="text"
                                                                        id={`section-input-${idx}`}
                                                                        value={editedValues[result.id] || ""}
                                                                        onChange={(e) => handleValueChange(result.id, e.target.value)}
                                                                        onBlur={(e) => handleBlur(result.id, e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === "Enter" || e.key === "ArrowDown") {
                                                                                e.preventDefault();
                                                                                let nextIdx = idx + 1;
                                                                                while (nextIdx < filteredAndSearched.length) {
                                                                                    const next = document.getElementById(`section-input-${nextIdx}`) as HTMLInputElement;
                                                                                    if (next && !next.disabled) {
                                                                                        next.focus();
                                                                                        next.select();
                                                                                        break;
                                                                                    }
                                                                                    nextIdx++;
                                                                                }
                                                                            } else if (e.key === "ArrowUp") {
                                                                                e.preventDefault();
                                                                                let prevIdx = idx - 1;
                                                                                while (prevIdx >= 0) {
                                                                                    const prev = document.getElementById(`section-input-${prevIdx}`) as HTMLInputElement;
                                                                                    if (prev && !prev.disabled) {
                                                                                        prev.focus();
                                                                                        prev.select();
                                                                                        break;
                                                                                    }
                                                                                    prevIdx--;
                                                                                }
                                                                            }
                                                                        }}
                                                                        placeholder={result.calcular ? "" : "-"}
                                                                        readOnly={result.calcular || result.firmado}
                                                                        disabled={result.calcular || result.firmado}
                                                                        className={`w-full h-7 px-2 border rounded transition-all font-mono text-[13px] font-bold shadow-inner outline-none ${
                                                                            (result.calcular || result.firmado)
                                                                            ? "bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 cursor-not-allowed" 
                                                                            : isOut
                                                                                ? "bg-red-50 dark:bg-red-900/30 border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-500/10 text-red-600 dark:text-red-400"
                                                                                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                                                        }`}
                                                                    />
                                                                );
                                                            })()}
                                                        </div>
                                                         <span className="text-[10px] font-bold text-zinc-500 leading-none lowercase">
                                                             {result.unit || "-"}
                                                         </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-0.5 h-8 align-middle border-b border-zinc-50 dark:border-zinc-800">
                                                    <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold uppercase tracking-tight text-zinc-500 truncate max-w-[80px] inline-block">
                                                        {result.sectionName}
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40 grayscale">
                                                    <Beaker size={64} className="text-zinc-300" />
                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-lg font-black tracking-tight text-zinc-500">No se encontraron resultados</p>
                                                        <p className="text-sm font-medium text-zinc-400">Prueba ajustando los filtros o la búsqueda</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between px-6">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        Resultados listados: {filteredAndSearched.length}
                    </div>
                    <div className="flex items-center gap-6">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Carga Masiva <span className="text-indigo-500">Activada</span></p>
                        <button 
                            disabled={loading || saving}
                            onClick={() => fetchData()}
                            className="text-xs font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-30"
                        >
                            Refrescar lista
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
