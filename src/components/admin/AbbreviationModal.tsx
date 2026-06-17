"use client";

import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export interface Abbreviation {
    id: string;
    resultado: string;
    abreviatura: string;
    codigoExterno?: string | null;
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    abbreviation: Abbreviation | null;
}

export function AbbreviationModal({ open, onClose, onSaved, abbreviation }: Props) {
    const [formData, setFormData] = useState<Partial<Abbreviation>>({
        resultado: "",
        abreviatura: "",
        codigoExterno: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            if (abbreviation) {
                setFormData(abbreviation);
            } else {
                setFormData({
                    resultado: "",
                    abreviatura: "",
                    codigoExterno: "",
                });
            }
        }
    }, [open, abbreviation]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const laboratoryId = localStorage.getItem("selectedLaboratoryId");

        try {
            const url = abbreviation
                ? `/api/abbreviations/${abbreviation.id}`
                : "/api/abbreviations";
            const method = abbreviation ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, laboratoryId }),
            });

            if (!res.ok) throw new Error("Error al guardar");

            toast.success(abbreviation ? "Actualizado correctamente" : "Creado correctamente");
            onSaved();
            onClose();
        } catch (error: any) {
            setError(error.message || "Ocurrió un error al guardar");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {abbreviation ? "Editar Abreviatura" : "Nueva Abreviatura"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <Alert 
                            message={error}
                            variant="error"
                            onClose={() => setError(null)}
                        />
                    )}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Resultado</label>
                            <input
                                required
                                value={formData.resultado || ""}
                                onChange={(e) => setFormData({ ...formData, resultado: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                placeholder="Ej: Normal"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Abreviatura</label>
                            <input
                                required
                                value={formData.abreviatura || ""}
                                onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                placeholder="Ej: NL"
                            />
                        </div>

                        {/* Código Externo (Hidden) */}
                        <input
                            type="hidden"
                            value={formData.codigoExterno || ""}
                        />
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : (
                                <>
                                    <Save size={18} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
