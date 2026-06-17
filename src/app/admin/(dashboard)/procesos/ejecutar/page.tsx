"use client";

import React, { useState } from "react";
import { Play, Settings, RefreshCw, CheckCircle2, AlertCircle, Loader2, Users, History, ChevronDown, ShieldCheck, FileText, Activity, CreditCard, PlusSquare, ListFilter } from "lucide-react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ExecuteProcessesPage() {
    const { data: session } = useSession();
    const [running, setRunning] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { success: boolean; message: string; summary?: any }>>({});
    const [activeLabId, setActiveLabId] = useState<string>("");
    
    // Control de colapsado por proceso
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        "sync-subresults": true, // El primero expandido por defecto
    });

    // Estados para configuración de sincronización
    const [syncLimit, setSyncLimit] = useState<number>(0); // 0 = Todos
    const [updateExisting, setUpdateExisting] = useState<boolean>(false);

    const [runningAll, setRunningAll] = useState(false);

    // Cargar laboratorio activo desde localStorage
    React.useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            } else if (session?.user?.laboratoryId) {
                setActiveLabId(session.user.laboratoryId);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, [session]);

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const processes = [
        {
            id: "sync-subresults",
            name: "Proceso SubResultados",
            description: "Importa valores de 'PRO SubResultados'. Vincula automáticamente con Resultados y Sub-Determinaciones.",
            icon: ListFilter,
            color: "text-cyan-500",
            bg: "bg-cyan-500/10",
        },
        {
            id: "sync-additionals",
            name: "Proceso Adicionales Aplicados",
            description: "Importa adicionales de 'PRO Adicionales Aplicados'. Vincula automáticamente con Protocolos, Adicionales y Obras Sociales.",
            icon: PlusSquare,
            color: "text-teal-500",
            bg: "bg-teal-500/10",
        },
        {
            id: "sync-pagos",
            name: "Proceso Pagos",
            description: "Importa pagos de 'PAG Pagos'. Vincula automáticamente con el historial del Paciente.",
            icon: CreditCard,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
        {
            id: "sync-results",
            name: "Sincronización de Resultados",
            description: "Importa resultados de 'PRO Resultados'. Vincula automáticamente con Protocolos, Determinaciones y Obras Sociales.",
            icon: Activity,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
        },
        {
            id: "sync-protocols",
            name: "Sincronización de Protocolos",
            description: "Importa protocolos de 'PRO Protocolos'. Vincula automáticamente con Pacientes, Médicos y Bioquímicos.",
            icon: FileText,
            color: "text-indigo-500",
            bg: "bg-indigo-500/10",
        },
        {
            id: "sync-health-insurances",
            name: "Sincronización de Obra Social",
            description: "Vincula pacientes con sus respectivas obras sociales y números de afiliado mediante 'Proceso Renglones OS'.",
            icon: ShieldCheck,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
        },
        {
            id: "sync-patients",
            name: "Sincronización de Pacientes",
            description: "Importa pacientes de 'HMB Pacientes' desde registros externos. Vincula automáticamente cada paciente con su Usuario Notificador (IDUsuario).",
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            id: "sync-determinations",
            name: "Sincronización de Determinaciones",
            description: "Importa definiciones de determinaciones desde 'DET Determinaciones'. Vincula automáticamente con Secciones, Aspectos, Métodos y Unidades.",
            icon: Activity,
            color: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        {
            id: "sync-sub-determinations",
            name: "Sincronización de Sub-Determinaciones",
            description: "Importa definiciones de sub-determinaciones desde 'DET SubDeterminaciones'. Vincula automáticamente con Determinaciones y Unidades.",
            icon: ChevronDown,
            color: "text-amber-600",
            bg: "bg-amber-600/10",
        },
        {
            id: "sync-users",
            name: "Sincronización de Usuarios",
            description: "Importa usuarios de 'RLB Usuarios' desde registros externos hacia Notified Users. Detecta automáticamente duplicados por Email/ID.",
            icon: Users,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        }
    ];

    const runProcess = async (id: string, name: string) => {
        setRunning(id);
        setResults(prev => {
            const newResults = { ...prev };
            delete newResults[id];
            return newResults;
        });

        // Asegurarse de tener el ID más reciente
        const currentLabId = localStorage.getItem('selectedLaboratoryId') || activeLabId || session?.user?.laboratoryId || "";

        try {
            let res;
            if (id === "sync-users" || id === "sync-patients" || id === "sync-health-insurances" || id === "sync-protocols" || id === "sync-results" || id === "sync-pagos" || id === "sync-additionals" || id === "sync-subresults" || id === "sync-determinations" || id === "sync-sub-determinations") {
                // Endpoint específico para tareas de sincronización
                let endpoint = "/api/tasks/sync-users";
                if (id === "sync-patients") endpoint = "/api/tasks/sync-patients";
                if (id === "sync-health-insurances") endpoint = "/api/tasks/sync-health-insurances";
                if (id === "sync-protocols") endpoint = "/api/tasks/sync-protocols";
                if (id === "sync-results") endpoint = "/api/tasks/sync-results";
                if (id === "sync-pagos") endpoint = "/api/tasks/sync-pagos";
                if (id === "sync-additionals") endpoint = "/api/tasks/sync-additionals";
                if (id === "sync-subresults") endpoint = "/api/tasks/sync-subresults";
                if (id === "sync-determinations") endpoint = "/api/tasks/sync-determinations";
                if (id === "sync-sub-determinations") endpoint = "/api/tasks/sync-sub-determinations";
                
                res = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        limit: syncLimit,
                        updateExisting,
                        laboratoryId: currentLabId
                    })
                });
            } else {
                // Notificar ejecución de otras tareas
                res = await fetch("/api/tasks/notify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        nombreSistema: name,
                        detalle: "Ejecución manual desde el panel de administración",
                        laboratoryId: currentLabId
                    })
                });
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            const data = await res.json();

            if (res.ok) {
                let msg = "Proceso completado exitosamente.";
                if (data.summary) {
                    msg = `Resultado: ${data.summary.processed} procesados (${data.summary.created} nuevos, ${data.summary.updated} actualizados)`;
                }
                setResults(prev => ({ ...prev, [id]: { success: true, message: msg, summary: data.summary } }));
                return true;
            } else {
                setResults(prev => ({ ...prev, [id]: { success: false, message: data.error || "Error al ejecutar el proceso." } }));
                return false;
            }
        } catch (error) {
            setResults(prev => ({ ...prev, [id]: { success: false, message: "Error de conexión con el servidor." } }));
            return false;
        } finally {
            setRunning(null);
        }
    };

    const runAll = async () => {
        setRunningAll(true);
        // Procesar desde abajo hacia arriba (reverso del array processes)
        const reversedProcesses = [...processes].reverse();
        for (const process of reversedProcesses) {
            await runProcess(process.id, process.name);
        }
        setRunningAll(false);
    };

    return (
        <div className="p-4 md:p-8 md:ml-64 bg-white dark:bg-black min-h-screen">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <RefreshCw className="w-8 h-8 text-emerald-500" /> Procesos del Sistema
                        </h1>
                        <p className="text-zinc-500 mt-2 text-lg">
                            Ejecuta tareas de mantenimiento, sincronización e importación de datos.
                        </p>
                    </div>
                    <button
                        onClick={runAll}
                        disabled={!!running || runningAll}
                        className={cn(
                            "px-8 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all transform shadow-2xl",
                            runningAll || running
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-105 active:scale-95 shadow-emerald-500/20"
                        )}
                    >
                        {runningAll ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Procesando Todo...
                            </>
                        ) : (
                            <>
                                <Play size={18} fill="currentColor" />
                                Ejecutar Todo
                            </>
                        )}
                    </button>
                </div>

                <div className="grid gap-6">
                    {processes.map((process) => {
                        const isRunning = running === process.id;
                        const isExpanded = expanded[process.id];
                        const result = results[process.id];

                        return (
                            <motion.div
                                key={process.id}
                                layout
                                className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:border-zinc-200 dark:hover:border-zinc-700 transition-all relative overflow-hidden group"
                            >
                                {/* Header de la tarjeta (siempre visible) */}
                                <div 
                                    className="p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    onClick={() => toggleExpand(process.id)}
                                >
                                    <div className="flex items-start gap-5">
                                        <div className={cn("p-4 rounded-[1.5rem] shrink-0 transform group-hover:scale-110 transition-transform", process.bg)}>
                                            <process.icon className={cn("w-7 h-7", process.color)} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                                                {process.name}
                                                <ChevronDown 
                                                    size={20} 
                                                    className={cn("text-zinc-400 transition-transform duration-300", isExpanded ? "rotate-180" : "")} 
                                                />
                                            </h3>
                                            <p className="text-zinc-500 leading-relaxed max-w-lg">
                                                {process.description}
                                            </p>
                                        </div>
                                    </div>

                                    {!isExpanded && result && (
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-xs font-bold border shrink-0",
                                            result.success 
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                                : "bg-rose-50 text-rose-600 border-rose-100"
                                        )}>
                                            {result.success ? "Completado" : "Error"}
                                        </div>
                                    )}

                                    <div className="shrink-0 flex items-center gap-4 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            disabled={!!running || runningAll}
                                            onClick={() => runProcess(process.id, process.name)}
                                            className={cn(
                                                "px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all duration-300",
                                                isRunning
                                                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                                                    : "bg-zinc-900 dark:bg-white text-white dark:text-black hover:scale-[1.05] active:scale-[0.95] shadow-xl shadow-zinc-500/20"
                                            )}
                                        >
                                            {isRunning ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Trabajando...
                                                </>
                                            ) : (
                                                <>
                                                    <Play size={18} fill="currentColor" />
                                                    Ejecutar Ahora
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Contenido colapsable */}
                                <AnimatePresence initial={false}>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-8 space-y-6">
                                                {(process.id === "sync-users" || process.id === "sync-patients" || process.id === "sync-health-insurances" || process.id === "sync-protocols" || process.id === "sync-results" || process.id === "sync-pagos" || process.id === "sync-additionals" || process.id === "sync-subresults" || process.id === "sync-determinations" || process.id === "sync-sub-determinations") && (
                                                    <div className="flex flex-col md:flex-row gap-6 p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                                        <div className="flex-1 space-y-2">
                                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                            Cantidad a procesar
                                                        </label>
                                                        <div className="flex items-center gap-3">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                placeholder="0 = Todos"
                                                                value={syncLimit || ''}
                                                                onChange={(e) => setSyncLimit(parseInt(e.target.value) || 0)}
                                                                className="w-24 h-10 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                                            />
                                                            <span className="text-xs text-zinc-500">
                                                                {syncLimit === 0 ? "Sincronizará todos los registros" : `Máximo ${syncLimit} registros`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                                                            Estrategia de duplicidad
                                                        </label>
                                                        <div className="flex items-center gap-6">
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input 
                                                                    type="radio" 
                                                                    checked={!updateExisting} 
                                                                    onChange={() => setUpdateExisting(false)}
                                                                    className="w-4 h-4 text-emerald-500 border-zinc-300 focus:ring-emerald-500 accent-emerald-500"
                                                                />
                                                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                                    No tocar
                                                                </span>
                                                            </label>
                                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                                <input 
                                                                    type="radio" 
                                                                    checked={updateExisting} 
                                                                    onChange={() => setUpdateExisting(true)}
                                                                    className="w-4 h-4 text-emerald-500 border-zinc-300 focus:ring-emerald-500 accent-emerald-500"
                                                                />
                                                                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">
                                                                    Actualizar
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                                )}

                                                {result && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={cn(
                                                            "flex items-center gap-4 p-4 rounded-3xl border text-sm font-medium",
                                                            result.success 
                                                                ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                                                                : "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                                                        )}
                                                    >
                                                        <div className={cn("p-1.5 rounded-full", result.success ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                                            {result.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                                        </div>
                                                        <span>{result.message}</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {isRunning && (
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 3, ease: "easeInOut" }}
                                        className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500"
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800 text-center space-y-4">
                    <div className="w-14 h-14 bg-white dark:bg-zinc-900 rounded-[1.5rem] flex items-center justify-center border border-zinc-100 dark:border-zinc-800 mx-auto shadow-sm">
                        <History className="text-zinc-400 w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-zinc-900 dark:text-white text-lg font-bold">Seguridad y Auditoría</h4>
                        <p className="text-zinc-500 max-w-md mx-auto leading-relaxed">
                            Todos los procesos manuales quedan registrados en el log de auditoría del sistema para garantizar la integridad de los datos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
