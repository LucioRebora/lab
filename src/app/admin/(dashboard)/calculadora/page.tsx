"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
    Calculator, Search, Plus, Trash2, Edit2, Save, X, ArrowUp, ArrowDown, 
    Beaker, Activity, Layers, ChevronRight, CheckCircle2, AlertCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const OPERATIONS = [
    { value: 'INGRESAR SUBDET', label: 'Cargar Resultado', icon: Layers, desc: 'Toma el valor de otro análisis en el protocolo' },
    { value: 'INGRESAR NUMERO', label: 'Cargar Número', icon: Activity, desc: 'Usa una constante numérica fija' },
    { value: 'SUMAR', label: 'Sumar (+)', icon: Plus, desc: 'Suma los dos últimos valores de la pila' },
    { value: 'RESTAR', label: 'Restar (-)', icon: Plus, desc: 'Resta el último valor al penúltimo' },
    { value: 'MULTIPLICAR', label: 'Multiplicar (*)', icon: X, desc: 'Multiplica los dos últimos valores' },
    { value: 'DIVIDIR', label: 'Dividir (/)', icon: X, desc: 'Divide el penúltimo por el último' },
    { value: 'SET', label: 'Asignar (=)', icon: Save, desc: 'Asigna el valor directamente' },
];

export default function CalculatorAdminPage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [subDets, setSubDets] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSubDet, setSelectedSubDet] = useState<any>(null);
    const [steps, setSteps] = useState<any[]>([]);
    const [editStep, setEditStep] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSubDets = useCallback(async () => {
        try {
            const res = await fetch('/api/sub-determinations?includeCalculator=true');
            if (res.ok) setSubDets(await res.json());
        } catch (error) {
            console.error("Error fetching sub-determinations:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSubDets();
    }, [fetchSubDets]);

    const fetchSteps = useCallback(async (subId: string) => {
        try {
            const res = await fetch(`/api/calculator-steps?subDeterminationId=${subId}`);
            if (res.ok) setSteps(await res.json());
        } catch (error) {
            console.error("Error fetching steps:", error);
        }
    }, []);

    const handleSelectSubDet = (sub: any) => {
        setSelectedSubDet(sub);
        fetchSteps(sub.id);
        setEditStep(null);
    };

    const handleAddStep = async () => {
        if (!selectedSubDet) return;
        
        // Find next sequence for codigoExterno
        const lastSeq = steps.length > 0 ? Math.max(...steps.map(s => parseInt(s.codigoExterno || "0"))) : 0;
        const nextSeq = (lastSeq + 1).toString().padStart(4, '0');

        const newStep = {
            subDeterminationId: selectedSubDet.id,
            tipoOperacion: 'INGRESAR SUBDET',
            argumentoNumerico: 0,
            argumentoIDSubDete: "",
            codigoExterno: nextSeq,
        };

        try {
            const res = await fetch('/api/calculator-steps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newStep)
            });
            if (res.ok) {
                toast.success("Paso añadido");
                fetchSteps(selectedSubDet.id);
            }
        } catch (error) {
            toast.error("Error al añadir paso");
        }
    };

    const handleDeleteStep = async (id: string) => {
        if (!confirm("¿Eliminar este paso de cálculo?")) return;
        try {
            const res = await fetch(`/api/calculator-steps/${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success("Paso eliminado");
                fetchSteps(selectedSubDet.id);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    const handleUpdateStep = async (step: any) => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/calculator-steps/${step.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(step)
            });
            if (res.ok) {
                toast.success("Paso actualizado");
                setEditStep(null);
                fetchSteps(selectedSubDet.id);
            }
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSubDets = useMemo(() => {
        if (!searchTerm) return subDets;
        const low = searchTerm.toLowerCase();
        return subDets.filter(s => 
            s.nombre.toLowerCase().includes(low) || 
            s.codigoExterno?.toLowerCase().includes(low) ||
            s.determination?.nombre?.toLowerCase().includes(low)
        );
    }, [subDets, searchTerm]);

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Header section */}
            <div className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-500 rounded-xl">
                            <Calculator className="w-5 h-5 text-white" />
                        </div>
                        Calculadora Clínica
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest mt-1">
                        Configuración de fórmulas automáticas y lógica de dependencia
                    </p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Selection */}
                <div className="w-full md:w-80 lg:w-96 border-r border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 flex flex-col shrink-0">
                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-900">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input 
                                type="text"
                                placeholder="Buscar análisis..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {loading && <div className="p-4 text-center text-zinc-400 text-sm animate-pulse">Cargando análisis...</div>}
                        {filteredSubDets.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => handleSelectSubDet(sub)}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl transition-all group relative overflow-hidden",
                                    selectedSubDet?.id === sub.id 
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                        selectedSubDet?.id === sub.id ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"
                                    )}>
                                        <Beaker className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black uppercase tracking-tight truncate leading-none">
                                            {sub.nombre}
                                        </p>
                                        <p className={cn(
                                            "text-[10px] font-bold mt-1 opacity-70 truncate uppercase tracking-widest",
                                            selectedSubDet?.id === sub.id ? "text-white" : "text-zinc-400"
                                        )}>
                                            {sub.determination?.nombre || "Sin determinación"}
                                        </p>
                                    </div>
                                    {sub.calcular && (
                                        <div className="ml-auto">
                                            <CheckCircle2 className={cn("w-3 h-3", selectedSubDet?.id === sub.id ? "text-white" : "text-indigo-500")} />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Step Editor */}
                <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/50 overflow-y-auto custom-scrollbar p-8">
                    {selectedSubDet ? (
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                        Fórmula para: {selectedSubDet.nombre}
                                    </h2>
                                     <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                         Formato: {selectedSubDet.formato || 'Auto'}
                                     </p>
                                 </div>
                                 <button
                                     onClick={handleAddStep}
                                     className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                                 >
                                     <Plus className="w-4 h-4" />
                                     Añadir Operación
                                 </button>
                             </div>
 
                             <div className="space-y-4">
                                 {steps.length === 0 ? (
                                     <div className="bg-white dark:bg-zinc-900/50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-12 rounded-3xl text-center">
                                         <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                             <Calculator className="w-8 h-8 text-zinc-400" />
                                         </div>
                                         <p className="text-zinc-900 dark:text-zinc-100 font-black text-lg">No hay pasos de cálculo</p>
                                         <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mt-1">
                                             Comienza añadiendo una operación para definir cómo se calcula este análisis.
                                         </p>
                                     </div>
                                 ) : (
                                     <div className="space-y-3">
                                         {steps.map((step, index) => (
                                             <motion.div
                                                 initial={{ opacity: 0, y: 10 }}
                                                 animate={{ opacity: 1, y: 0 }}
                                                 key={step.id}
                                                 className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl shadow-sm group"
                                             >
                                                 <div className="flex items-center gap-6">
                                                     <div className="flex flex-col items-center gap-1">
                                                         <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 uppercase">Step</span>
                                                         <span className="text-lg font-black text-zinc-400 dark:text-zinc-600 leading-none">
                                                             {(index + 1).toString().padStart(2, '0')}
                                                         </span>
                                                     </div>
 
                                                     <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                                         <div className="space-y-1">
                                                             <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Operación</label>
                                                             <select 
                                                                 value={step.tipoOperacion}
                                                                 onChange={(e) => handleUpdateStep({ ...step, tipoOperacion: e.target.value })}
                                                                 className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
                                                             >
                                                                 {OPERATIONS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                                                             </select>
                                                         </div>
 
                                                         {step.tipoOperacion === 'INGRESAR SUBDET' ? (
                                                             <div className="space-y-1">
                                                                 <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Análisis como Argumento</label>
                                                                 <select 
                                                                     value={step.argumentoIDSubDete || ""}
                                                                     onChange={(e) => {
                                                                         const newStep = { ...step, argumentoIDSubDete: e.target.value };
                                                                         setSteps(prev => prev.map(s => s.id === step.id ? newStep : s));
                                                                         handleUpdateStep(newStep);
                                                                     }}
                                                                     className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
                                                                 >
                                                                     <option value="">Seleccionar...</option>
                                                                     {subDets.filter(s => s.id !== selectedSubDet.id).map(s => (
                                                                         <option key={s.id} value={s.codigoExterno}>{s.nombre}</option>
                                                                     ))}
                                                                 </select>
                                                             </div>
                                                        ) : step.tipoOperacion === 'INGRESAR NUMERO' ? (
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Valor Numérico</label>
                                                                <input 
                                                                    type="number"
                                                                    step="any"
                                                                    value={step.argumentoNumerico || 0}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        setSteps(prev => prev.map(s => s.id === step.id ? { ...s, argumentoNumerico: val } : s));
                                                                    }}
                                                                    onBlur={(e) => handleUpdateStep({ ...step, argumentoNumerico: e.target.value })}
                                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border-none rounded-xl text-xs font-bold uppercase tracking-widest px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-xs font-bold text-zinc-400 px-4 pt-5 gap-2">
                                                                <Info className="w-3 h-3" />
                                                                Sin argumentos adicionales
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-end pt-5 gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleDeleteStep(step.id)}
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                                                title="Eliminar paso"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Help Info */}
                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                                <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <AlertCircle className="w-4 h-4" />
                                    Cómo funciona el motor RPN
                                </h3>
                                <p className="text-indigo-800/70 dark:text-indigo-500/70 text-sm font-medium leading-relaxed">
                                    Este motor utiliza notación polaca inversa (pila). Primero "Carga" los valores necesarios usando <span className="font-bold underline">Cargar Resultado</span> o <span className="font-bold underline">Cargar Número</span>, y luego aplica las operaciones matemáticas.
                                    Ej: Para hacer (Bilirrubina Total - Bilirrubina Directa), debes:
                                </p>
                                <ol className="mt-4 space-y-2 text-xs font-bold text-indigo-900/60 dark:text-indigo-400/60 list-decimal list-inside">
                                    <li>Cargar Resultado (Total)</li>
                                    <li>Cargar Resultado (Directa)</li>
                                    <li>Aplicar Restar</li>
                                </ol>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-3xl flex items-center justify-center shadow-xl shadow-zinc-200/20 dark:shadow-none mb-6">
                                <Calculator className="w-10 h-10 text-zinc-200 dark:text-zinc-800" />
                            </div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Gestión de Cálculos Automáticos</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-bold uppercase tracking-widest max-w-sm mt-3">
                                Selecciona un análisis de la lista izquierda para ver o configurar su lógica de cálculo.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e1e1e;
                }
            `}</style>
        </div>
    );
}
