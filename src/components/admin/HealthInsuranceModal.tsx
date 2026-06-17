"use client";

import React, { useState, useEffect } from "react";
import { X, Save, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type HealthInsurance = {
    id: string;
    nombre: string;
    contado: boolean;
    cortada: boolean;
    laboratoryId?: string;
};

interface HealthInsuranceModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    healthInsurance?: HealthInsurance | null;
}

export function HealthInsuranceModal({ open, onClose, onSaved, healthInsurance }: HealthInsuranceModalProps) {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "ADMIN";

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
        contado: false,
        cortada: false,
    });

    useEffect(() => {
        if (open) {
            if (healthInsurance) {
                setFormData({
                    nombre: healthInsurance.nombre,
                    contado: healthInsurance.contado,
                    cortada: healthInsurance.cortada,
                });
            } else {
                setFormData({
                    nombre: "",
                    contado: false,
                    cortada: false,
                });
            }
            setError("");
        }
    }, [healthInsurance, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = healthInsurance
                ? `/api/health-insurances/${healthInsurance.id}`
                : "/api/health-insurances";

            const method = healthInsurance ? "PATCH" : "POST";

            // Si es admin, necesita enviar el laboratoryId para crearlas
            const activeLabId = localStorage.getItem('selectedLaboratoryId') || (session?.user as any)?.laboratoryId;
            const body = {
                ...formData,
                ...(isAdmin && !healthInsurance ? { laboratoryId: activeLabId } : {})
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "No se pudo guardar la obra social");
            }

            toast.success(healthInsurance ? "Obra social actualizada" : "Obra social creada");
            onSaved();
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
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center sm:p-6 overflow-hidden"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 12 }}
                    className="bg-white dark:bg-zinc-900 w-full sm:w-full sm:max-w-md sm:rounded-4xl shadow-2xl border-0 sm:border border-zinc-100 dark:border-zinc-800 flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight">
                                    {healthInsurance ? "Editar Obra Social" : "Nueva Obra Social"}
                                </h2>
                                <p className="text-sm text-zinc-500">
                                    Información de la mutual
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 md:p-8 overflow-y-auto flex-1">
                        <form id="insurance-form" onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <Alert 
                                    message={error} 
                                    variant="error" 
                                    onClose={() => setError("")}
                                    className="mb-6"
                                />
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                        placeholder="Nombre de la obra social"
                                    />
                                </div>


                                <div className="flex gap-6 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="contado"
                                            checked={formData.contado}
                                            onChange={(e) => setFormData({ ...formData, contado: e.target.checked })}
                                            className="w-4 h-4 rounded text-black bg-zinc-50 border-zinc-300 focus:ring-black dark:focus:ring-white"
                                        />
                                        <label htmlFor="contado" className="text-sm cursor-pointer select-none">
                                            Contado
                                        </label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="cortada"
                                            checked={formData.cortada}
                                            onChange={(e) => setFormData({ ...formData, cortada: e.target.checked })}
                                            className="w-4 h-4 rounded text-black bg-zinc-50 border-zinc-300 focus:ring-black dark:focus:ring-white"
                                        />
                                        <label htmlFor="cortada" className="text-sm cursor-pointer select-none">
                                            Cortada
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            form="insurance-form"
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
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
