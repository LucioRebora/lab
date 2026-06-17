"use client";

import React, { useState, useEffect } from "react";
import { X, Settings, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert } from "@/components/ui/Alert";

export interface Setting {
    id: string;
    key: string;
    value: string;
    description: string | null;
    laboratoryId: string;
    createdAt?: string;
    updatedAt?: string;
}

interface SettingModalProps {
    open: boolean;
    onClose: () => void;
    setting?: Setting | null;
    laboratoryId: string;
    onSaved: (s: Setting) => void;
}

export function SettingModal({ open, onClose, setting, laboratoryId, onSaved }: SettingModalProps) {
    const [formData, setFormData] = useState({
        key: "",
        value: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            if (setting) {
                setFormData({
                    key: setting.key,
                    value: setting.value,
                    description: setting.description || ""
                });
            } else {
                setFormData({ key: "", value: "", description: "" });
            }
            setError("");
        }
    }, [open, setting]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = setting ? `/api/settings/${setting.id}` : "/api/settings";
            const method = setting ? "PATCH" : "POST";

            const payload = { ...formData, laboratoryId };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ocurrió un error.");

            onSaved(data);
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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                                <Settings size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold tracking-tight">
                                    {setting ? "Editar Parámetro" : "Nuevo Parámetro"}
                                </h2>
                                <p className="text-sm text-zinc-500">
                                    Configuración de sistema
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form id="setting-form" onSubmit={handleSubmit} className="p-6 space-y-5">
                        {error && (
                            <Alert 
                                message={error} 
                                variant="error" 
                                onClose={() => setError("")}
                                className="mb-4"
                            />
                        )}

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Llave (Clave)
                            </label>
                            <input
                                required
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all uppercase"
                                placeholder="Ej: DEFAULT_PHONE_AREA"
                                readOnly={!!setting}
                            />
                            <p className="mt-1 text-xs text-zinc-400">Recomendamos usar MAYÚSCULAS_CON_GUIONES_BAJOS.</p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Valor
                            </label>
                            <textarea
                                required
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all min-h-[120px] resize-y"
                                placeholder="Ej: 3446 o una lista separada por comas..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                Descripción (Opcional)
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all min-h-[100px] resize-none"
                                placeholder="¿Para qué sirve este parámetro?"
                            />
                        </div>
                    </form>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            form="setting-form"
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-11 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={16} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
