"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BookOpen, Search, Calendar, User, Stethoscope, FileText, ArrowRight, Download, FilePlus, Eye, X, Pencil, ArrowUpDown, Beaker, ChevronDown, CheckCircle2, Printer, Check, Globe, Tag, RefreshCw, Clock, QrCode, Send } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ManlabPage() {
    const todayStr = new Date().toISOString().split('T')[0];
    const [protocols, setProtocols] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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
    const [manlabClients, setManlabClients] = useState<any[]>([]);
    
    // ManlabOrder states
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
    const [counts, setCounts] = useState({ total: 0, ready: 0, missing: 0 });
    const [selectedGlobalClient, setSelectedGlobalClient] = useState<number>(0);
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);
    const [barcodeValue, setBarcodeValue] = useState("");
    const [rotuloValue, setRotuloValue] = useState("");
    const [codPrestacionValue, setCodPrestacionValue] = useState("");
    const [ivaValue, setIvaValue] = useState("V");
    const [comentarioValue, setComentarioValue] = useState("");
    const [diuresisValue, setDiuresisValue] = useState("0");
    const [tipoDocumentoValue, setTipoDocumentoValue] = useState("DNI");
    const [numeroDocumentoValue, setNumeroDocumentoValue] = useState("");
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        
        // Load Manlab clients from settings
        const loadSettings = async () => {
            try {
                const res = await fetch("/api/manlab-settings");
                if (res.ok) {
                    const settings = await res.json();
                    if (settings.config && settings.config.manlab_users) {
                        try {
                            const users = JSON.parse(settings.config.manlab_users);
                            setManlabClients(users);
                            // Set default client if not set
                            if (users.length > 0 && selectedGlobalClient === 0) {
                                setSelectedGlobalClient(Number(users[0].manlabId));
                            }
                        } catch (e) {
                            console.error("Error parsing manlab users setting:", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };
        loadSettings();

        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const loadProtocols = useCallback(async (
        labId = activeLabId, 
        query = search, 
        currentPage = 1,
        append = false
    ) => {
        const finalLabId = labId || activeLabId;

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
            const params = new URLSearchParams();
            if (finalLabId) params.set("laboratoryId", finalLabId);
            if (query) params.set("search", query);
            params.set("section", "DERIVACIONES"); // Filtro permanente por sección
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
            console.error("Error loading Manlab protocols:", error);
            toast.error("Error al cargar derivaciones");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeLabId, search]);

    const lastProtocolElementRef = useCallback((node: HTMLDivElement) => {
        if (loading || loadingMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadProtocols(activeLabId, search, page + 1, true);
            }
        });
        if (node) observerRef.current.observe(node);
    }, [loading, loadingMore, hasMore, loadProtocols, activeLabId, search, page]);

    useEffect(() => {
        if (activeLabId) {
            loadProtocols(activeLabId);
        }
    }, [activeLabId, loadProtocols]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loadProtocols(activeLabId, search);
    };

    const handleOpenBarcode = (result: any, protocol: any) => {
        setSelectedResult(result);
        const order = result.manlabOrder || {};
        
        setBarcodeValue(order.barcode || "");
        const patientName = protocol.patient ? `${protocol.patient.apellido}, ${protocol.patient.nombre}` : "";
        setRotuloValue(order.rotulo || `${protocol.numeroSecuencial} ${patientName}`.trim());
        setCodPrestacionValue(order.codPrestacion || result.determination?.codManlab || "");
        setIvaValue(order.iva || "V");
        setComentarioValue(order.comentario || "");
        setDiuresisValue(order.diuresis?.toString().replace('.', ',') || "0");
        setTipoDocumentoValue(order.tipoDocumento || "DNI");
        setNumeroDocumentoValue(order.numeroDocumento || protocol.patient?.documento || "");
    };

    const handleSaveManlabOrder = async () => {
        if (!selectedResult) return;
        if (!codPrestacionValue.trim()) {
            toast.error("El código de prestación es obligatorio");
            return;
        }

        if (barcodeValue.trim().length < 8 || barcodeValue.trim().length > 9) {
            toast.error("El código de barras debe tener 8 o 9 caracteres");
            return;
        }

        setIsSavingOrder(true);
        
        // Convert diuresis back to number (handle , as .)
        const diuresisNum = parseFloat(diuresisValue.replace(',', '.'));

        try {
            const res = await fetch("/api/manlab-orders", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resultId: selectedResult.id,
                    barcode: barcodeValue,
                    rotulo: rotuloValue,
                    codPrestacion: codPrestacionValue,
                    iva: ivaValue,
                    comentario: comentarioValue,
                    diuresis: isNaN(diuresisNum) ? 0 : diuresisNum,
                    tipoDocumento: tipoDocumentoValue,
                    numeroDocumento: numeroDocumentoValue
                })
            });
            if (res.ok) {
                const savedOrder = await res.json();
                toast.success("Orden Manlab guardada");
                
                // Update local protocols state
                setProtocols(prev => prev.map(p => ({
                    ...p,
                    results: p.results?.map((r: any) => 
                        r.id === selectedResult.id 
                        ? { ...r, manlabOrder: savedOrder } 
                        : r
                    )
                })));

                // Update selectedProtocol if it's the one being edited
                if (selectedProtocol) {
                    setSelectedProtocol((prev: any) => ({
                        ...prev,
                        results: prev.results?.map((r: any) => 
                            r.id === selectedResult.id 
                            ? { ...r, manlabOrder: savedOrder } 
                            : r
                        )
                    }));
                }

                setSelectedResult(null);
            } else {
                toast.error("Error al guardar la orden");
            }
        } catch (error) {
            console.error("Error saving ManlabOrder:", error);
            toast.error("Error de conexión");
        } finally {
            setIsSavingOrder(false);
        }
    };

    const filteredProtocols = useMemo(() => {
        let result = [...protocols];
        return result.sort((a, b) => {
            const timeA = new Date(a.createdAt).getTime();
            const timeB = new Date(b.createdAt).getTime();
            return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        });
    }, [protocols, sortOrder]);

    const handleSendToManlab = () => {
        // Collect all results with derivacion and manlabOrder
        const resultsWithOrder = protocols.flatMap(p => 
            (p.results || []).filter((r: any) => 
                (r.section?.nombre?.toUpperCase() === "DERIVACIONES" || 
                 r.determination?.section?.nombre?.toUpperCase() === "DERIVACIONES") && 
                !r.asignado
            )
        );

        if (resultsWithOrder.length === 0) {
            toast.error("No hay registros para enviar");
            return;
        }

        const missingBarcodes = resultsWithOrder.filter(r => !r.manlabOrder?.barcode);
        
        if (missingBarcodes.length > 0) {
            setCounts({ 
                total: resultsWithOrder.length, 
                ready: resultsWithOrder.length - missingBarcodes.length, 
                missing: missingBarcodes.length 
            });
            setShowConfirmSendModal(true);
            return;
        }

        // If all have barcodes, still show modal to pick client
        setCounts({ total: resultsWithOrder.length, ready: resultsWithOrder.length, missing: 0 });
        setShowConfirmSendModal(true);
    };

    const executeExport = async (readyToSend: any[]) => {
        if (readyToSend.length === 0) {
            toast.error("Ningún registro tiene código de barras");
            return;
        }

        if (selectedGlobalClient === 0) {
            toast.error("Seleccione un cliente para continuar");
            return;
        }

        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        const filename = `${selectedGlobalClient}_${timestamp}.txt`;

        setIsBulkUpdating(true);
        try {
            // Bulk update to database
            const res = await fetch("/api/manlab-orders/bulk-update-client", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resultIds: readyToSend.map(r => r.id),
                    cliente: selectedGlobalClient,
                    filename: filename,
                    count: readyToSend.length
                })
            });

            if (!res.ok) throw new Error("Bulk update failed");
            const updateResponse = await res.json();
            const exportId = updateResponse.exportId;

            // Generate TXT content based on field specs
            let txtContent = "";
            const clean = (str: any) => (str || "").toString().trim();

            readyToSend.forEach((r: any) => {
                const order = r.manlabOrder;
                const line = [
                    clean(order.barcode),
                    clean(order.rotulo),
                    clean(selectedGlobalClient), 
                    clean(order.codPrestacion),
                    clean(order.iva),
                    clean(order.comentario),
                    clean(order.diuresis.toString().replace('.', ',')),
                    clean(order.tipoDocumento),
                    clean(order.numeroDocumento)
                ].join(";");
                txtContent += line + "\n";
            });

            // Trigger Download (Local copy)
            const blob = new Blob([txtContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            // AUTO-SEND via FTP if configured
            try {
                console.log(`[Auto-FTP] Triggering upload for exportId: ${exportId}`);
                const ftpRes = await fetch("/api/manlab-ftp/upload", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exportId })
                });
                
                if (ftpRes.ok) {
                    toast.success("Archivo enviado automáticamente a Manlab vía FTP");
                } else {
                    const ftpError = await ftpRes.json();
                    toast.error("Exportación registrada, pero error en el envío FTP: " + (ftpError.error || "Desconocido"));
                }
            } catch (ftpErr) {
                console.error(`[Auto-FTP] Connection error for export ${exportId}:`, ftpErr);
                toast.error("Error al conectar con el servidor FTP de Manlab");
            }

            // Update local state to reflect that they are now assigned and sent
            setProtocols(prev => prev.map(p => ({
                ...p,
                results: p.results?.map((r: any) => 
                    readyToSend.some(ready => ready.id === r.id)
                    ? { ...r, asignado: true, manlabOrder: { ...r.manlabOrder, cliente: selectedGlobalClient, enviado: true } }
                    : r
                )
            })));

            setShowConfirmSendModal(false);
            toast.success("Operación completada");
        } catch (err) {
            console.error(err);
            toast.error("Error al actualizar registros");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handlePrintList = () => {
        window.print();
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden print:p-0">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between mb-8 gap-4 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                        <RefreshCw className="text-indigo-600 animate-spin-slow" size={24} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Derivaciones Manlab</h1>
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-black tracking-widest uppercase shadow-sm">
                                {totalResults} Casos
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">Gestión de envíos a laboratorio externo</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                        <Search size={16} className="text-zinc-400 ml-2" />
                        <form onSubmit={handleSearchSubmit}>
                            <input 
                                type="text"
                                placeholder="Buscar..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-transparent text-sm font-bold outline-none w-40 sm:w-60 px-1"
                            />
                        </form>
                    </div>

                    <button 
                        onClick={handleSendToManlab}
                        className="h-11 px-6 bg-emerald-600 text-white text-xs font-black uppercase rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2 group/btn shrink-0"
                    >
                        <Send size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                        Enviar a Manlab
                    </button>

                    <button 
                        onClick={() => loadProtocols()}
                        className="h-11 px-6 bg-indigo-600 text-white text-xs font-black uppercase rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-95 shrink-0"
                    >
                        Buscar
                    </button>

                    <button 
                        onClick={handlePrintList}
                        className="w-11 h-11 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl flex items-center justify-center transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 shrink-0"
                        title="Imprimir Listado"
                    >
                        <Printer size={20} />
                    </button>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden print:shadow-none print:border-zinc-200 print:rounded-none">
                {loading ? (
                    <div className="p-24 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
                        <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">Buscando derivaciones...</p>
                    </div>
                ) : filteredProtocols.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-indigo-50/30 dark:bg-indigo-500/5 border-b border-zinc-100 dark:border-zinc-800/50">
                                    <th className="px-8 py-5">
                                        <button 
                                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                            className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                                        >
                                            Protocolo
                                            <ArrowUpDown size={12} className={sortOrder === 'asc' ? "text-indigo-600" : "text-indigo-300"} />
                                        </button>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Paciente</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Estudios Derivados</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Fecha/Hora</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right print:hidden">Audit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {filteredProtocols.map((protocol) => {
                                    // Filtrar solo los estudios que pertenecen a "Derivaciones"
                                    const derivacionResults = protocol.results?.filter((r: any) => 
                                        (r.section?.nombre?.toUpperCase() === "DERIVACIONES" || 
                                         r.determination?.section?.nombre?.toUpperCase() === "DERIVACIONES") && 
                                        !r.asignado
                                    ) || [];

                                    return ( derivacionResults.length > 0 && (
                                        <tr key={protocol.id} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-500/5 transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-black font-mono text-indigo-600 text-base">
                                                        {protocol.numeroSecuencial}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 min-h-[14px]">
                                                        {protocol.completo && (
                                                            <span title="Procesado Completamente">
                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                                                        {protocol.patient?.apellido[0]}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-zinc-900 dark:text-zinc-100">
                                                            {protocol.patient?.apellido}, {protocol.patient?.nombre}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-zinc-400 tracking-widest">DNI: {protocol.patient?.documento}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {derivacionResults.map((r: any) => (
                                                        <div 
                                                            key={r.id} 
                                                            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all group/item ${
                                                                r.manlabOrder?.barcode 
                                                                ? 'bg-emerald-100/40 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700/50 shadow-sm' 
                                                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                                                            }`}
                                                        >
                                                            <Beaker size={12} className={r.manlabOrder?.barcode ? 'text-emerald-600 font-black' : 'text-indigo-500'} />
                                                            <div className={`flex items-baseline gap-1.5 border-r pr-2 mr-1 ${
                                                                r.manlabOrder?.barcode ? 'border-emerald-200 dark:border-emerald-800/50' : 'border-zinc-100 dark:border-zinc-700'
                                                            }`}>
                                                                <span className={`text-[9px] font-black font-mono tracking-tighter ${
                                                                    r.manlabOrder?.barcode ? 'text-emerald-700' : 'text-indigo-600 dark:text-indigo-400'
                                                                }`}>
                                                                    {r.determination?.codManlab || '---'}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col min-w-[80px]">
                                                                <span className={`text-[10px] font-black uppercase ${
                                                                    r.manlabOrder?.barcode ? 'text-emerald-700 dark:text-emerald-200' : 'text-zinc-700 dark:text-zinc-300'
                                                                }`}>
                                                                    {r.determination?.abreviatura || r.determination?.nombre}
                                                                </span>
                                                                {r.manlabOrder?.barcode && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <QrCode size={8} className="text-emerald-600" />
                                                                        <span className="text-[8px] font-black text-emerald-700 font-mono">{r.manlabOrder.barcode}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleOpenBarcode(r, protocol); }}
                                                                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all opacity-0 group-hover/item:opacity-100 ml-auto ${
                                                                    r.manlabOrder?.barcode
                                                                    ? 'bg-emerald-500 border-emerald-400 text-white'
                                                                    : 'bg-zinc-50 dark:bg-zinc-700 border-zinc-100 dark:border-zinc-600 text-zinc-400 hover:text-indigo-600'
                                                                }`}
                                                                title="Editar Información Manlab"
                                                            >
                                                                <QrCode size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col items-start gap-1">
                                                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                                                        <Calendar size={12} />
                                                        <span className="text-xs font-black uppercase">
                                                            {new Date(protocol.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                                        <Clock size={12} />
                                                        <span className="text-[10px] font-bold">
                                                            {new Date(protocol.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}hs
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right print:hidden">
                                                <button 
                                                    onClick={() => setSelectedProtocol(protocol)}
                                                    className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ) );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-32 text-center">
                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-200">
                            <RefreshCw size={40} />
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">Sin derivaciones pendientes</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto font-medium">No se encontraron protocolos con determinaciones de la sección "Derivaciones" para el período seleccionado.</p>
                    </div>
                )}

                {/* Footer stats */}
                {protocols.length > 0 && (
                    <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {protocols.slice(0, 3).map((p, i) => (
                                    <div key={p.id} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-900 bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-zinc-100 dark:ring-zinc-800">
                                        {p.patient?.apellido[0]}
                                    </div>
                                ))}
                            </div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                {protocols.length} pacientes procesados en este lote
                            </span>
                        </div>
                        
                        {hasMore && (
                            <div ref={lastProtocolElementRef} className="flex items-center gap-2 text-indigo-500 animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Sincronizando más...</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {/* Protocol Detail Modal */}
                {selectedProtocol && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedProtocol(null)}
                            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                        <FileText size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Expediente Manlab</h2>
                                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Protocolo {selectedProtocol.numeroSecuencial}</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Información del Paciente</p>
                                        <div className="space-y-1">
                                            <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{selectedProtocol.patient?.apellido}, {selectedProtocol.patient?.nombre}</p>
                                            <p className="text-xs font-bold text-zinc-500 tracking-wider">DOCUMENTO: {selectedProtocol.patient?.documento}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Determinaciones a Derivar</p>
                                        <div className="space-y-2">
                                            {selectedProtocol.results?.filter((r: any) => 
                                                (r.section?.nombre?.toUpperCase() === "DERIVACIONES" || 
                                                 r.determination?.section?.nombre?.toUpperCase() === "DERIVACIONES") && 
                                                !r.asignado).map((res: any) => (
                                                <div 
                                                    key={res.id} 
                                                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                                        res.manlabOrder?.barcode 
                                                        ? 'bg-emerald-100/50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700' 
                                                        : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
                                                    }`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black font-mono mb-0.5 tracking-tight ${
                                                            res.manlabOrder?.barcode ? 'text-emerald-700' : 'text-indigo-500'
                                                        }`}>
                                                            MANLAB: {res.determination?.codManlab || 'N/A'}
                                                        </span>
                                                        <span className={`text-xs font-bold ${
                                                            res.manlabOrder?.barcode ? 'text-emerald-900 dark:text-emerald-100' : 'text-zinc-700 dark:text-zinc-300'
                                                        }`}>{res.determination?.nombre}</span>
                                                        {res.manlabOrder?.barcode && (
                                                            <div className="flex items-center gap-1 mt-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-md w-fit shadow-sm">
                                                                <QrCode size={10} className="text-white" />
                                                                <span className="text-[9px] font-black font-mono tracking-widest">{res.manlabOrder.barcode}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleOpenBarcode(res, selectedProtocol); }}
                                                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                                                                res.manlabOrder?.barcode
                                                                ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                                                                : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400 hover:text-indigo-600'
                                                            }`}
                                                        >
                                                            <QrCode size={18} />
                                                        </button>
                                                        {res.manlabOrder?.barcode ? (
                                                            <span className="text-[9px] font-black bg-emerald-500 text-white px-2.5 py-1.5 rounded-lg uppercase shadow-sm">Listo</span>
                                                        ) : (
                                                            <span className="text-[9px] font-black bg-amber-50 dark:bg-amber-900/30 text-amber-600 px-2.5 py-1 rounded-lg uppercase">Pendiente</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            onClick={() => setSelectedProtocol(null)}
                                            className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl text-xs font-black uppercase hover:bg-zinc-200 transition-all"
                                        >
                                            Cerrar
                                        </button>
                                        <Link
                                            href={`/admin/nuevo-ingreso?edit=${selectedProtocol.id}`}
                                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase text-center hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                        >
                                            Gestionar Caso
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Barcode Input Modal */}
                {selectedResult && (
                    <div className="fixed inset-0 z-[115] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedResult(null)}
                            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-100 dark:border-indigo-500/20">
                                    <QrCode size={32} />
                                </div>
                                <div className="text-center mb-8">
                                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Código de Barras</h3>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">
                                        {selectedResult.determination?.nombre}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Código Barra</p>
                                            <div className="relative group">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors">
                                                    <Tag size={14} />
                                                </div>
                                                <input 
                                                    autoFocus
                                                    type="text"
                                                    maxLength={9}
                                                    value={barcodeValue}
                                                    onChange={(e) => setBarcodeValue(e.target.value.toUpperCase())}
                                                    className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-3 text-center font-mono font-black text-sm tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all uppercase"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Cod. Prestación</p>
                                            <input 
                                                type="text"
                                                maxLength={10}
                                                value={codPrestacionValue}
                                                onChange={(e) => setCodPrestacionValue(e.target.value)}
                                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Rótulo</p>
                                        <input 
                                            type="text"
                                            maxLength={50}
                                            value={rotuloValue}
                                            onChange={(e) => setRotuloValue(e.target.value)}
                                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Tipo Doc.</p>
                                            <select 
                                                value={tipoDocumentoValue}
                                                onChange={(e) => setTipoDocumentoValue(e.target.value)}
                                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                                            >
                                                <option value="DNI">DNI</option>
                                                <option value="LE">LE</option>
                                                <option value="LC">LC</option>
                                                <option value="PAS">PAS</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Número Doc.</p>
                                            <input 
                                                type="text"
                                                maxLength={15}
                                                value={numeroDocumentoValue}
                                                onChange={(e) => setNumeroDocumentoValue(e.target.value)}
                                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">IVA</p>
                                            <select 
                                                value={ivaValue}
                                                onChange={(e) => setIvaValue(e.target.value)}
                                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                                            >
                                                <option value="O">O-OBLIGATORIO</option>
                                                <option value="V">V-VOLUNTARIO</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Diuresis (Lts)</p>
                                            <input 
                                                type="text"
                                                value={diuresisValue}
                                                onChange={(e) => setDiuresisValue(e.target.value.replace('.', ','))}
                                                placeholder="0,0"
                                                className="w-full h-11 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-zinc-400 uppercase ml-1">Comentario</p>
                                        <textarea 
                                            maxLength={50}
                                            value={comentarioValue}
                                            onChange={(e) => setComentarioValue(e.target.value)}
                                            rows={2}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 font-bold text-xs outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                                            placeholder="Opcional..."
                                        />
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <button 
                                            onClick={() => setSelectedResult(null)}
                                            className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-black uppercase hover:bg-zinc-200 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button 
                                            onClick={handleSaveManlabOrder}
                                            disabled={isSavingOrder}
                                            className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSavingOrder ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            Guardar Orden
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Confirmation Send Modal */}
                {showConfirmSendModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirmSendModal(false)}
                            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 text-center">
                                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Clock size={40} className="text-amber-500" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                                    {counts.missing > 0 ? "Datos Incompletos" : "Confirmar Envío"}
                                </h3>
                                <div className="flex flex-col gap-2 mb-6">
                                    <p className="text-sm text-zinc-500 font-medium">
                                        {counts.missing > 0 
                                            ? "Hay registros sin código de barras. Se enviarán solo los validados." 
                                            : "Se van a generar las derivaciones para los registros listos."}
                                    </p>
                                    
                                    <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                        <p className="text-[10px] font-black text-zinc-400 uppercase mb-3 px-2">Seleccionar Cliente para este lote</p>
                                        <select 
                                            value={selectedGlobalClient}
                                            onChange={(e) => setSelectedGlobalClient(Number(e.target.value))}
                                            className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none mb-2 shadow-sm"
                                        >
                                            <option value={0}>-- Elegir Cliente Manlab --</option>
                                            {Array.isArray(manlabClients) && manlabClients.map((user: any) => (
                                                <option key={user.id} value={user.manlabId}>{user.nombre} ({user.manlabId})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-center gap-4 mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-emerald-600 leading-none">{counts.ready}</span>
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Listos</span>
                                        </div>
                                        <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-amber-500 leading-none">{counts.missing}</span>
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Omitir</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    <button
                                        disabled={selectedGlobalClient === 0 || isBulkUpdating}
                                        onClick={() => {
                                            const readyResults = protocols.flatMap(p => 
                                                (p.results || []).filter((r: any) => 
                                                    (r.section?.nombre?.toUpperCase() === "DERIVACIONES" || 
                                                     r.determination?.section?.nombre?.toUpperCase() === "DERIVACIONES") && 
                                                    !r.asignado && r.manlabOrder?.barcode
                                                )
                                            );
                                            executeExport(readyResults);
                                        }}
                                        className="h-14 w-full bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                                    >
                                        {isBulkUpdating ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
                                        {counts.missing > 0 ? "Enviar solo listos" : "Confirmar Envío"}
                                    </button>
                                    <button
                                        disabled={isBulkUpdating}
                                        onClick={() => setShowConfirmSendModal(false)}
                                        className="h-12 w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black uppercase text-xs rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
                @media print {
                    .print\\:hidden { display: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    );
}
