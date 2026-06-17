"use client";

import { useEffect, useState, use } from "react";
import { LayoutGrid, ArrowLeft, Loader2, User, Hash, CheckCircle2, Search, Printer, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SectionDetail {
    id: string;
    nombre: string;
    worksheet?: { nombre: string } | null;
}

export default function SectionDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [section, setSection] = useState<SectionDetail | null>(null);
    const [results, setResults] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedToPrint, setSelectedToPrint] = useState<Set<string>>(new Set());
    const [viewingLog, setViewingLog] = useState<any | null>(null);
    const [logDetails, setLogDetails] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            // Section info
            const secRes = await fetch(`/api/sections/${params.id}`);
            if (!secRes.ok) throw new Error("Failed to fetch section");
            const secData = await secRes.json();
            setSection(secData);

            // Results
            const resRes = await fetch(`/api/sections/${params.id}/unassigned-results`);
            if (!resRes.ok) throw new Error("Failed to fetch results");
            const resData = await resRes.json();
            setResults(resData);
            setSelectedToPrint(new Set(resData.map((r: any) => r.id)));

            // Logs
            const logsRes = await fetch(`/api/sections/${params.id}/print-logs`);
            if (logsRes.ok) {
                const logsData = await logsRes.json();
                setLogs(logsData);
            }
        } catch (error) {
            toast.error("Error al cargar detalles de la sección");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handlePrintAndLog = async () => {
        if (selectedToPrint.size === 0) return;

        const ids = Array.from(selectedToPrint);
        
        try {
            // Save log first
            const logRes = await fetch(`/api/sections/${params.id}/print-logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultIds: ids })
            });

            if (logRes.ok) {
                const newLog = await logRes.json();
                setLogs(prev => [newLog, ...prev]);
                
                // Refresh unassigned results
                const resRes = await fetch(`/api/sections/${params.id}/unassigned-results`);
                if (resRes.ok) {
                    const resData = await resRes.json();
                    setResults(resData);
                    setSelectedToPrint(new Set(resData.map((r: any) => r.id)));
                }
            }

            // Open print window
            window.open(`/admin/print/secciones/${params.id}?ids=${ids.join(",")}`, '_blank');
        } catch (error) {
            toast.error("Error al registrar la impresión");
        }
    };

    const handleReprint = (log: any) => {
        const ids = log.resultIds.join(",");
        window.open(`/admin/print/secciones/${params.id}?ids=${ids}`, '_blank');
    };

    const handleViewLogDetails = async (log: any) => {
        setViewingLog(log);
        setLoadingDetails(true);
        try {
            const res = await fetch(`/api/sections/${params.id}/unassigned-results?ids=${log.resultIds.join(",")}`);
            if (res.ok) {
                const data = await res.json();
                setLogDetails(data);
            }
        } catch (error) {
            toast.error("Error al cargar detalles del historial");
        } finally {
            setLoadingDetails(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [params.id]);

    const filteredResults = results.filter(r => {
        const search = searchTerm.toLowerCase();
        const num = r.protocol?.numeroSecuencial?.toLowerCase() || "";
        const ape = r.protocol?.patient?.apellido?.toLowerCase() || "";
        const nom = r.protocol?.patient?.nombre?.toLowerCase() || "";
        const abr = r.determination?.abreviatura?.toLowerCase() || "";
        const det = r.determination?.nombre?.toLowerCase() || "";
        
        return num.includes(search) || ape.includes(search) || nom.includes(search) || abr.includes(search) || det.includes(search);
    });

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="font-medium">Cargando detalles de sección...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors w-fit group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-bold uppercase tracking-widest">Volver</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center shadow-inner">
                            <LayoutGrid size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {section?.nombre}
                                </h1>
                                <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    Detalles
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500 font-medium">
                                {section?.worksheet ? `Modelo: ${section.worksheet.nombre}` : 'Sin modelo de hoja de trabajo'}
                            </p>
                        </div>
                    </div>

                    <div className="relative group min-w-[300px]">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en pendientes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-12 pl-11 pr-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>

                    <button
                        onClick={handlePrintAndLog}
                        disabled={selectedToPrint.size === 0}
                        className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                    >
                        <Printer size={18} />
                        Imprimir Hoja
                    </button>
                </div>
            </div>

            {/* Results Grid/Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Resultados Pendientes Asignación</h3>
                        <p className="text-sm text-zinc-500">Muestras que requieren procesamiento en esta área</p>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg">{filteredResults.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocolo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Paciente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">DNI</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Determinación</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right whitespace-nowrap">Estado</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        Imprimir
                                        <button
                                            onClick={() => {
                                                if (selectedToPrint.size === results.length) setSelectedToPrint(new Set());
                                                else setSelectedToPrint(new Set(results.map(r => r.id)));
                                            }}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200 focus:outline-none shadow-inner ${
                                                results.length > 0 && selectedToPrint.size === results.length 
                                                ? 'bg-sky-500 dark:bg-sky-400' 
                                                : 'bg-zinc-200 dark:bg-zinc-800'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                                                    results.length > 0 && selectedToPrint.size === results.length ? 'translate-x-5' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {filteredResults.length > 0 ? (
                                filteredResults.map((res) => (
                                    <tr key={res.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    <Hash size={14} />
                                                </div>
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                    {res.protocol?.numeroSecuencial}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 overflow-hidden">
                                                    <User size={16} />
                                                </div>
                                                <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-xs">
                                                    {res.protocol?.patient?.apellido}, {res.protocol?.patient?.nombre}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-zinc-500 font-medium text-xs">
                                            {res.protocol?.patient?.documento}
                                        </td>
                                        <td className="px-8 py-5 font-bold text-zinc-900 dark:text-zinc-100 uppercase text-[10px]">
                                            {res.determination?.abreviatura || res.determination?.nombre}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-900/50 w-fit ml-auto">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Pendiente</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const ids = [res.id];
                                                        fetch(`/api/sections/${params.id}/print-logs`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ resultIds: ids })
                                                        }).then(fetchRes => {
                                                            if (fetchRes.ok) {
                                                                fetchRes.json().then(newLog => setLogs(prev => [newLog, ...prev]));
                                                                // Refresh unassigned results
                                                                fetch(`/api/sections/${params.id}/unassigned-results`).then(r => {
                                                                    if (r.ok) r.json().then(data => {
                                                                        setResults(data);
                                                                    });
                                                                });
                                                            }
                                                        });
                                                        window.open(`/admin/print/secciones/${params.id}?ids=${res.id}`, '_blank');
                                                    }}
                                                    className="w-8 h-8 flex items-center justify-center bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-800/40 transition-all shadow-sm active:scale-90"
                                                    title="Imprimir solo este"
                                                >
                                                    <Printer size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const next = new Set(selectedToPrint);
                                                        if (next.has(res.id)) next.delete(res.id);
                                                        else next.add(res.id);
                                                        setSelectedToPrint(next);
                                                    }}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none shadow-inner ${
                                                        selectedToPrint.has(res.id) 
                                                        ? 'bg-sky-500 dark:bg-sky-400' 
                                                        : 'bg-zinc-200 dark:bg-zinc-800'
                                                    }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
                                                            selectedToPrint.has(res.id) ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))

                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <CheckCircle2 size={48} className="text-zinc-400" />
                                            <p className="font-black text-zinc-500 uppercase tracking-widest">No hay pendientes por asignar</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Print History Section */}
            <div className="mt-12 mb-20 px-4 md:px-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Printer size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Historial de Impresiones</h2>
                        <p className="text-xs text-zinc-500 font-medium">Registros anteriores de hojas de trabajo generadas</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest uppercase">Fecha y Hora</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest uppercase">Usuario</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest uppercase">Resultados</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest uppercase text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                                {new Date(log.createdAt).toLocaleString('es-AR')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                                                    {log.user?.name?.charAt(0) || log.user?.email?.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                                    {log.user?.name || log.user?.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black">
                                                {log.resultIds.length} ITEMS
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewLogDetails(log)}
                                                    className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl transition-all active:scale-95"
                                                    title="Ver Detalles"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleReprint(log)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 hover:border-sky-500 text-zinc-600 dark:text-zinc-400 hover:text-sky-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                                >
                                                    <Printer size={14} />
                                                    Reimprimir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-10 text-center text-zinc-400 text-xs font-medium italic">
                                        No hay registros de impresión previos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Log Details Modal */}
            {viewingLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setViewingLog(null)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/20">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Detalles de Impresión</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{new Date(viewingLog.createdAt).toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingLog(null)} className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 max-h-[60vh] overflow-y-auto">
                            {loadingDetails ? (
                                <div className="py-20 flex flex-col items-center gap-4 text-zinc-400">
                                    <Loader2 className="animate-spin" size={32} />
                                    <p className="font-bold text-xs uppercase tracking-widest">Cargando registros...</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logDetails.map((det) => (
                                        <div key={det.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="flex items-center gap-4">
                                                <div className="text-xs font-mono font-black text-indigo-500">#{det.protocol?.numeroSecuencial}</div>
                                                <div>
                                                    <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase">{det.protocol?.patient?.apellido}, {det.protocol?.patient?.nombre}</p>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{det.determination?.abreviatura || det.determination?.nombre}</p>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Asignado</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3">
                            <button
                                onClick={() => handleReprint(viewingLog)}
                                className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95"
                            >
                                <Printer size={16} />
                                Reimprimir Esta Hoja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
