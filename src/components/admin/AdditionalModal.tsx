"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, AlertCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

export type Additional = {
    id: string;
    nombre: string;
    abreviatura: string | null;
    codigo: string | null;
    agregarSiempre: boolean;
    agregarEnUrgencia: boolean;
    laboratoryId: string;
};

interface AdditionalModalProps {
    open: boolean;
    onClose: () => void;
    additional?: Additional | null;
    onSaved: () => void;
    laboratoryId: string;
}

export function AdditionalModal({ open, onClose, additional, onSaved, laboratoryId }: AdditionalModalProps) {
    const [formData, setFormData] = useState({
        nombre: "",
        abreviatura: "",
        codigo: "",
        agregarSiempre: false,
        agregarEnUrgencia: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (additional) {
            setFormData({
                nombre: additional.nombre || "",
                abreviatura: additional.abreviatura || "",
                codigo: additional.codigo || "",
                agregarSiempre: additional.agregarSiempre || false,
                agregarEnUrgencia: additional.agregarEnUrgencia || false,
            });
        } else {
            setFormData({
                nombre: "",
                abreviatura: "",
                codigo: "",
                agregarSiempre: false,
                agregarEnUrgencia: false,
            });
        }
        setError(null);
    }, [additional, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!formData.nombre.trim()) {
                throw new Error("El nombre es requerido");
            }

            const url = additional
                ? `/api/additionals/${additional.id}`
                : "/api/additionals";

            const method = additional ? "PATCH" : "POST";

            const payload = {
                ...formData,
                laboratoryId
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Ocurrió un error al guardar el adicional");
            }

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
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto border border-zinc-200 dark:border-zinc-800"
                        >
                            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {additional ? "Editar Adicional" : "Nuevo Adicional"}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
                                >
                                    <X size={18} />
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
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                            Nombre *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                            placeholder="Ej. Acto bioquimico Internacion"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                            Abreviatura
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.abreviatura}
                                            onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                            placeholder="Ej. AB"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.codigo}
                                            onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                                            placeholder="Ej. 1001"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <input
                                            type="checkbox"
                                            id="agregarSiempre"
                                            checked={formData.agregarSiempre}
                                            onChange={(e) => setFormData({ ...formData, agregarSiempre: e.target.checked })}
                                            className="w-4 h-4 text-emerald-500 bg-zinc-50 border-zinc-300 rounded focus:ring-emerald-500"
                                        />
                                        <label htmlFor="agregarSiempre" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                            Agregar Siempre
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="agregarEnUrgencia"
                                            checked={formData.agregarEnUrgencia}
                                            onChange={(e) => setFormData({ ...formData, agregarEnUrgencia: e.target.checked })}
                                            className="w-4 h-4 text-emerald-500 bg-zinc-50 border-zinc-300 rounded focus:ring-emerald-500"
                                        />
                                        <label htmlFor="agregarEnUrgencia" className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                                            Agregar en Urgencia
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Save size={16} />
                                        )}
                                        {additional ? "Guardar Cambios" : "Crear Adicional"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
