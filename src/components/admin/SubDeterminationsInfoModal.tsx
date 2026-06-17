"use client";

import React, { useEffect, useState } from "react";
import { X, Activity, Beaker } from "lucide-react";

interface SubDetermination {
    id: string;
    nombre: string;
    unit?: { nombre: string } | null;
    valorMinimo?: string | null;
    valorMaximo?: string | null;
    formato?: string | null;
    referenceValues?: any[];
    determination?: {
        method?: {
            nombre: string;
        } | null;
    } | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    determinationId: string | null;
    determinationName: string | null;
}

export function SubDeterminationsInfoModal({ open, onClose, determinationId, determinationName }: Props) {
    const [subDeterminations, setSubDeterminations] = useState<SubDetermination[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && determinationId) {
            fetchSubDeterminations();
        }
    }, [open, determinationId]);

    const fetchSubDeterminations = async () => {
        setLoading(true);
        try {
            const labId = localStorage.getItem("selectedLaboratoryId");
            const res = await fetch(`/api/sub-determinations?laboratoryId=${labId}&determinationId=${determinationId}`);
            if (res.ok) {
                const data = await res.json();
                setSubDeterminations(data);
            }
        } catch (error) {
            console.error("Error fetching sub-determinations", error);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-lg shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                            <Beaker size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                {determinationName || "Sub-determinaciones"}
                            </h2>
                            <div className="flex flex-col">
                                {(() => {
                                    const method = subDeterminations[0]?.determination?.method || (subDeterminations[0] as any)?.method;
                                    return method ? (
                                        <p className="text-[9px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">
                                            Método: {method.nombre}
                                        </p>
                                    ) : null;
                                })()}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto custom-scrollbar">
                    {subDeterminations.length > 0 && !loading && (
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3 px-1">
                            Componentes del análisis
                        </p>
                    )}
                    {loading ? (
                        <div className="py-12 text-center">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-zinc-500 font-medium italic">Buscando sub-determinaciones...</p>
                        </div>
                    ) : subDeterminations.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {subDeterminations.map((sub) => (
                                <div key={sub.id} className="group p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-100/80 dark:border-zinc-800/50 hover:border-blue-200 dark:hover:border-blue-500/30 hover:bg-white dark:hover:bg-zinc-800/50 transition-all">
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[13px] text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                                                    {sub.nombre}
                                                </span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {sub.unit && (
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-zinc-400">
                                                            {sub.unit.nombre}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right shrink-0 max-w-[220px]">
                                            {sub.referenceValues && sub.referenceValues.length > 0 ? (
                                                <div className="space-y-0.5">
                                                    {sub.referenceValues.map((rv: any) => (
                                                        <div key={rv.id} className="flex items-start justify-end gap-2 text-[10px] leading-tight">
                                                            {rv.categoria && (
                                                                <span className="text-zinc-400 font-medium shrink-0 italic">{rv.categoria}</span>
                                                            )}
                                                            <span className="text-zinc-700 dark:text-zinc-300 font-bold whitespace-nowrap">{rv.valoresNormales}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (sub.valorMinimo || sub.valorMaximo) ? (
                                                <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold">
                                                    {sub.valorMinimo || "?"} - {sub.valorMaximo || "?"}
                                                </div>
                                            ) : (
                                                <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight italic opacity-60">
                                                    S/D
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center">
                            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Activity size={20} className="text-zinc-300" />
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin sub-determinaciones</h3>
                            <p className="text-xs text-zinc-500 mx-auto max-w-[200px]">
                                Esta determinación no tiene componentes detallados configurados.
                            </p>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
