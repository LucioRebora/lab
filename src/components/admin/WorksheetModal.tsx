"use client";

import React, { useState, useEffect } from "react";
import { X, FileStack, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type Worksheet = {
    id: string;
    codigo: string;
    nombre: string;
    laboratoryId?: string;
};

interface WorksheetModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    worksheet?: Worksheet | null;
}

export function WorksheetModal({ open, onClose, onSaved, worksheet }: WorksheetModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        codigo: "",
        nombre: "",
    });

    useEffect(() => {
        if (open) {
            if (worksheet) {
                setFormData({
                    codigo: worksheet.codigo || "",
                    nombre: worksheet.nombre || "",
                });
            } else {
                setFormData({
                    codigo: "",
                    nombre: "",
                });
            }
            setError("");
        }
    }, [worksheet, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const httpMethod = worksheet ? "PATCH" : "POST";
            const url = worksheet ? `/api/worksheets/${worksheet.id}` : "/api/worksheets";

            const res = await fetch(url, {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(worksheet ? "Hoja de trabajo actualizada" : "Hoja de trabajo creada");
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto p-4 custom-scrollbar"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <FileStack className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {worksheet ? "Editar Hoja de Trabajo" : "Nueva Hoja de Trabajo"}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-zinc-500"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                        {error && (
                            <Alert 
                                message={error} 
                                variant="error" 
                                onClose={() => setError("")}
                            />
                        )}

                        <form id="worksheet-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Código de la Hoja *</label>
                                <input
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.substring(0, 15) })}
                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                                    placeholder="Máx 15 carac. (ej: HEM-GEN)"
                                    maxLength={15}
                                    required
                                />
                                <p className="text-[10px] text-zinc-500 italic px-1">Este código se usa para vincular con las secciones.</p>
                            </div>

                            <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre Descriptivo *</label>
                                <input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value.substring(0, 50) })}
                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="Ej: HOJA GENERAL DE HEMATOLOGÍA (Máx 50 carac.)"
                                    maxLength={50}
                                    required
                                />
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-2xl text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            form="worksheet-form"
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    {worksheet ? "Actualizar Cambios" : "Guardar Hoja"}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
