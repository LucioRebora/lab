"use client";

import React, { useEffect, useState } from "react";
import { X, Save, Plus, Trash2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

interface ReferenceValue {
    id?: string;
    categoria: string;
    valoresNormales: string;
    informarUnidades: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    subDeterminationId: string | null;
    subDeterminationName: string | null;
}

export function ReferenceValueSettingsModal({ open, onClose, subDeterminationId, subDeterminationName }: Props) {
    const [referenceValues, setReferenceValues] = useState<ReferenceValue[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open && subDeterminationId) {
            fetchReferenceValues();
        }
    }, [open, subDeterminationId]);

    const fetchReferenceValues = async () => {
        setLoading(true);
        try {
            const labId = localStorage.getItem("selectedLaboratoryId");
            const res = await fetch(`/api/reference-values?subDeterminationId=${subDeterminationId}&laboratoryId=${labId}`);
            if (res.ok) {
                const data = await res.json();
                setReferenceValues(data);
            }
        } catch (error) {
            console.error("Error fetching reference values", error);
            toast.error("Error al cargar valores de referencia");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setReferenceValues([
            ...referenceValues,
            { categoria: "", valoresNormales: "", informarUnidades: true }
        ]);
    };

    const handleRemove = (index: number) => {
        setReferenceValues(referenceValues.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof ReferenceValue, value: any) => {
        const newValues = [...referenceValues];
        newValues[index] = { ...newValues[index], [field]: value };
        setReferenceValues(newValues);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const laboratoryId = localStorage.getItem("selectedLaboratoryId");
            const res = await fetch(`/api/reference-values/batch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subDeterminationId,
                    laboratoryId,
                    referenceValues
                })
            });

            if (res.ok) {
                toast.success("Valores de referencia guardados");
                onClose();
            } else {
                throw new Error("Failed to save");
            }
        } catch (error) {
            toast.error("Error al guardar valores de referencia");
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                            <Info size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                Valores de Referencia
                            </h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                                {subDeterminationName}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-zinc-500 font-medium font-italic">Cargando valores...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert 
                                message="Define los rangos que se mostrarán en los informes. Puedes agregar múltiples líneas para diferenciar por sexo, edad u otras categorías."
                                variant="info"
                                className="mb-4"
                            />

                            <div className="space-y-3">
                                {referenceValues.map((rv, index) => (
                                    <div key={index} className="flex gap-3 group items-start animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <input
                                                    value={rv.categoria}
                                                    onChange={(e) => handleChange(index, "categoria", e.target.value)}
                                                    placeholder="Categoría (ej: Hombres)"
                                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <input
                                                    value={rv.valoresNormales}
                                                    onChange={(e) => handleChange(index, "valoresNormales", e.target.value)}
                                                    placeholder="Valores (ej: 70 - 110)"
                                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(index)}
                                            className="mt-2 p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleAdd}
                                className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-500 hover:text-amber-600 hover:border-amber-200 dark:hover:border-amber-900/30 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all text-sm font-bold"
                            >
                                <Plus size={18} />
                                Agregar línea de referencia
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-8 py-5 bg-zinc-50/50 dark:bg-zinc-800/20 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 px-8 py-2.5 bg-amber-600 text-white rounded-2xl text-sm font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : (
                            <>
                                <Save size={18} />
                                Guardar cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
