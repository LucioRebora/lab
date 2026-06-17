"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, ArrowLeft, Loader2, User, Hash, CheckCircle2, Search, Printer, Eye, X, FileStack, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function HojasDeTrabajoPage() {
    const router = useRouter();
    const [results, setResults] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
    const [selectedToPrint, setSelectedToPrint] = useState<Set<string>>(new Set());
    const [printLogs, setPrintLogs] = useState<any[]>([]);
    const [logsLimit, setLogsLimit] = useState(5);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resData, resSections, resLogs] = await Promise.all([
                fetch("/api/sections/unassigned-results-all").then(r => r.json()),
                fetch("/api/sections").then(r => r.json()),
                fetch(`/api/sections/print-logs-all?limit=${logsLimit}`).then(r => r.json())
            ]);
            
            setResults(resData);
            setSections(resSections);
            setPrintLogs(resLogs);
            
            // Default select all
            setSelectedToPrint(new Set(resData.map((r: any) => r.id)));
        } catch (error) {
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [logsLimit]);

    const filteredResults = results.filter(r => {
        // 1. Text Search Filter
        const search = searchTerm.toLowerCase();
        const num = r.protocol?.numeroSecuencial?.toLowerCase() || "";
        const ape = r.protocol?.patient?.apellido?.toLowerCase() || "";
        const nom = r.protocol?.patient?.nombre?.toLowerCase() || "";
        const abr = r.determination?.abreviatura?.toLowerCase() || "";
        const detNom = r.determination?.nombre?.toLowerCase() || "";
        const secName = (r.section?.nombre || r.determination?.section?.nombre || "").toLowerCase();
        const doc = r.protocol?.doctor ? `${r.protocol.doctor.apellido} ${r.protocol.doctor.nombre}`.toLowerCase() : "";
        
        const matchesSearch = num.includes(search) || ape.includes(search) || nom.includes(search) || abr.includes(search) || detNom.includes(search) || secName.includes(search) || doc.includes(search);

        // 2. Section Filter
        const rSectionId = r.sectionId || r.determination?.sectionId;
        const matchesSection = selectedSectionId === "all" || rSectionId === selectedSectionId;

        return matchesSearch && matchesSection;
    });

    const handlePrintSelected = async () => {
        if (selectedToPrint.size === 0) return toast.error("Seleccione al menos un resultado");
        
        const ids = Array.from(selectedToPrint);
        const idsString = ids.join(",");

        try {
            // Log this print action (POST)
            await fetch("/api/sections/print-logs-all", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resultIds: ids })
            });

            // Open print window
            window.open(`/admin/print/hojas-de-trabajo-all?ids=${idsString}`, '_blank');
            
            // Refresh main table and audit logs
            setTimeout(() => {
                loadData();
            }, 1000);
            toast.success("Hojas de trabajo generadas");
        } catch (error) {
            console.error("Error saving logs:", error);
            toast.error("Error al registrar impresión");
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="font-medium">Cargando resultados generales...</p>
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
                    <span className="text-sm font-bold uppercase tracking-widest text-[9px]">Volver</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-3xl flex items-center justify-center shadow-inner">
                            <FileStack size={32} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                                    Hojas de Trabajo
                                </h1>
                                <span className="px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase tracking-widest border border-sky-500/20">
                                    Control Global
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500 font-medium tracking-tight">
                                Lista consolidada de todas las muestras pendientes por sección analítica
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-1 max-w-2xl justify-end">
                        <select
                            value={selectedSectionId}
                            onChange={(e) => setSelectedSectionId(e.target.value)}
                            className="h-12 px-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm cursor-pointer"
                        >
                            <option value="all">Todas las secciones</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>

                        <div className="relative group flex-1 max-w-sm">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="text-zinc-400 group-focus-within:text-sky-500 transition-colors" size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Búsqueda rápida..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-12 pl-11 pr-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
                            />
                        </div>

                        <button
                            onClick={handlePrintSelected}
                            disabled={selectedToPrint.size === 0}
                            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-sky-500/20 active:scale-95 cursor-pointer disabled:cursor-not-allowed h-12"
                        >
                            <Printer size={16} />
                            Imprimir
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Grid/Table */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Resultados Pendientes Asignación</h3>
                        <p className="text-sm text-zinc-500 font-bold uppercase text-[10px] tracking-widest opacity-60">Filtrado global de tareas por realizar</p>
                    </div>
                    <div className="px-4 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl">
                        <span className="text-sky-600 dark:text-sky-400 font-black text-lg">{filteredResults.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocolo</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Paciente</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">DNI</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Médico</th>
                                <th className="px-8 py-5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Sección</th>
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
                                        <td className="px-8 py-5 text-zinc-500 font-bold uppercase text-[10px]">
                                            {res.protocol?.doctor ? `${res.protocol.doctor.apellido},, ${res.protocol.doctor.nombre}` : "-"}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-black uppercase border border-sky-500/15">
                                                {res.section?.nombre || res.determination?.section?.nombre || "SIN SECCIÓN"}
                                            </span>
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
                                                    onClick={async () => {
                                                        const ids = [res.id];
                                                        await fetch(`/api/sections/${res.sectionId}/print-logs`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ resultIds: ids })
                                                        });
                                                        window.open(`/admin/print/secciones/${res.sectionId}?ids=${res.id}`, '_blank');
                                                        loadData();
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
                                    <td colSpan={8} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                            <CheckCircle2 size={48} className="text-zinc-400" />
                                            <p className="font-black text-zinc-500 uppercase tracking-widest">No hay pendientes globales</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Table */}
            <div className="mt-16 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden pb-8">
                <div className="p-8 border-b border-zinc-50 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                            <History size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Historial de Impresión</h2>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Registros realizados en el laboratorio</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mostrar:</span>
                        <select 
                            value={logsLimit}
                            onChange={(e) => setLogsLimit(parseInt(e.target.value))}
                            className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                        >
                            <option value={5}>Últimos 5</option>
                            <option value={10}>Últimos 10</option>
                            <option value={25}>Últimos 25</option>
                            <option value={50}>Últimos 50</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Fecha / Hora</th>
                                <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Personal</th>
                                <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Sección</th>
                                <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic text-right">Cant. Det.</th>
                                <th className="px-8 py-4 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {printLogs.length > 0 ? (
                                printLogs.map((log) => (
                                    <tr key={log.id} className="group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors">
                                        <td className="px-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                                                    {new Date(log.createdAt).toLocaleDateString('es-AR')}
                                                </span>
                                                <span className="text-[9px] font-bold text-zinc-400 font-mono tracking-tighter">
                                                    {new Date(log.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black uppercase">
                                                    {log.user?.name?.[0] || 'U'}
                                                </div>
                                                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate max-w-[150px]">
                                                    {log.user?.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="px-2 py-0.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-[9px] font-bold text-zinc-500 uppercase italic">
                                                {log.section?.nombre}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="text-[10px] font-black text-sky-600 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                                                {log.resultIds?.length || 0}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <button 
                                                onClick={() => window.open(`/admin/print/hojas-de-trabajo-all?ids=${log.resultIds.join(",")}`, '_blank')}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[9px] font-black uppercase text-zinc-500 hover:text-sky-600 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/10 transition-all active:scale-95"
                                                title="Reimprimir esta selección"
                                            >
                                                <Printer size={12} />
                                                Reimprimir
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-8 py-12 text-center">
                                        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] italic underline underline-offset-4 decoration-sky-500/30">Sin registros de auditoría recientes</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
