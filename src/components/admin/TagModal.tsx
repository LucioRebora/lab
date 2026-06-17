"use client";

import React, { useState, useEffect } from "react";
import { X, LayoutPanelLeft, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type Tag = {
    id: string;
    etiqueta: string;
    codigo: string;
    nombre: string;
    laboratoryId?: string;
};

interface TagModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    tag?: Tag | null;
}

export function TagModal({ open, onClose, onSaved, tag }: TagModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        etiqueta: "",
        codigo: "",
        nombre: "",
    });

    useEffect(() => {
        if (open) {
            if (tag) {
                setFormData({
                    etiqueta: tag.etiqueta || "",
                    codigo: tag.codigo || "",
                    nombre: tag.nombre || "",
                });
            } else {
                setFormData({
                    etiqueta: "",
                    codigo: "",
                    nombre: "",
                });
            }
            setError("");
        }
    }, [tag, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const httpMethod = tag ? "PATCH" : "POST";
            const url = tag ? `/api/tags/${tag.id}` : "/api/tags";

            const res = await fetch(url, {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(tag ? "Etiqueta actualizada" : "Etiqueta creada");
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
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                <LayoutPanelLeft className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {tag ? "Editar Etiqueta" : "Nueva Etiqueta"}
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

                        <form id="tag-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5 focus-within:text-emerald-600 transition-colors">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Etiqueta (Abrev.)*</label>
                                    <input
                                        value={formData.etiqueta}
                                        onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value.toUpperCase().substring(0, 15) })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                        placeholder="Máx 15 carac."
                                        maxLength={15}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5 focus-within:text-emerald-600 transition-colors">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Código*</label>
                                    <input
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().substring(0, 15) })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                        placeholder="Máx 15 carac."
                                        maxLength={15}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 focus-within:text-emerald-600 transition-colors">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre Completo*</label>
                                <input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value.substring(0, 50) })}
                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                    placeholder="Ej: Etiqueta de Hematología (Máx 50 carac.)"
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
                            form="tag-form"
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    {tag ? "Actualizar Cambios" : "Guardar Etiqueta"}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
