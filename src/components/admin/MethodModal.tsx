"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, FileText, Loader2, Microscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type Method = {
    id: string;
    nombre: string;
    laboratoryId?: string;
};

interface MethodModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    method?: Method | null;
}

export function MethodModal({ open, onClose, onSaved, method }: MethodModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
    });

    useEffect(() => {
        if (open) {
            if (method) {
                setFormData({
                    nombre: method.nombre || "",
                });
            } else {
                setFormData({
                    nombre: "",
                });
            }
            setError("");
        }
    }, [method, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const httpMethod = method ? "PATCH" : "POST";
            const url = method ? `/api/methods/${method.id}` : "/api/methods";

            const res = await fetch(url, {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(method ? "Método actualizado" : "Método creado");
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center overflow-y-auto pt-10 pb-10 custom-scrollbar"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col mx-4 my-auto relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                                <Microscope className="text-orange-600 dark:text-orange-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {method ? "Editar Método" : "Nuevo Método"}
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

                    <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8">
                        {error && (
                            <Alert 
                                message={error} 
                                variant="error" 
                                onClose={() => setError("")}
                                className="mb-4"
                            />
                        )}

                        <form id="method-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre del Método *</label>
                                <input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                    placeholder="Ej: Absorción atómica"
                                    required
                                />
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 flex justify-end gap-3 rounded-b-4xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="method-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 text-white rounded-2xl text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? "Guardando..." : (method ? "Actualizar" : "Guardar Método")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
