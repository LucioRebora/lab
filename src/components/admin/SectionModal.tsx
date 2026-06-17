"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Loader2, LayoutGrid, Tag as TagIcon, FileStack } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";
import { Tag } from "./TagModal";
import { Worksheet } from "./WorksheetModal";

export type Section = {
    id: string;
    nombre: string;
    hojaTrabajo: string | null;
    etiqueta: string | null;
    tag?: Tag | null;
    worksheet?: Worksheet | null;
    laboratoryId?: string;
};

interface SectionModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    section?: Section | null;
}

export function SectionModal({ open, onClose, onSaved, section }: SectionModalProps) {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);
    const [error, setError] = useState("");
    const [tags, setTags] = useState<Tag[]>([]);
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    
    const [formData, setFormData] = useState({
        nombre: "",
        hojaTrabajo: "",
        etiqueta: "",
    });

    const loadData = async () => {
        setFetchingData(true);
        try {
            const [tagsRes, worksheetsRes] = await Promise.all([
                fetch("/api/tags"),
                fetch("/api/worksheets")
            ]);

            if (tagsRes.ok) {
                const tagsData = await tagsRes.json();
                setTags(tagsData);
            }
            if (worksheetsRes.ok) {
                const worksheetsData = await worksheetsRes.json();
                setWorksheets(worksheetsData);
            }
        } catch (err) {
            console.error("Error loading relational data for section:", err);
        } finally {
            setFetchingData(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadData();
            if (section) {
                setFormData({
                    nombre: section.nombre || "",
                    hojaTrabajo: section.hojaTrabajo || "",
                    etiqueta: section.etiqueta || "",
                });
            } else {
                setFormData({
                    nombre: "",
                    hojaTrabajo: "",
                    etiqueta: "",
                });
            }
            setError("");
        }
    }, [section, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const httpMethod = section ? "PATCH" : "POST";
            const url = section ? `/api/sections/${section.id}` : "/api/sections";

            const res = await fetch(url, {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(section ? "Sección actualizada" : "Sección creada");
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
                    className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col mx-4 my-auto relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center">
                                <LayoutGrid className="text-teal-600 dark:text-teal-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {section ? "Editar Sección" : "Nueva Sección"}
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

                        <form id="section-form" onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5 focus-within:text-teal-600 transition-colors">
                                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre de la Sección *</label>
                                <input
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-bold"
                                    placeholder="Ej: HEMATOLOGÍA"
                                    required
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <FileStack size={14} /> Hoja de Trabajo
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.hojaTrabajo || ""}
                                            onChange={(e) => setFormData({ ...formData, hojaTrabajo: e.target.value })}
                                            disabled={fetchingData}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-zinc-900 dark:text-zinc-100 appearance-none disabled:opacity-50"
                                        >
                                            <option value="">(sin hoja)</option>
                                            {worksheets.map((w) => (
                                                <option key={w.id} value={w.codigo}>
                                                    {w.nombre} ({w.codigo})
                                                </option>
                                            ))}
                                        </select>
                                        {fetchingData && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 size={14} className="animate-spin text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5 focus-within:text-emerald-600 transition-colors">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                                        <TagIcon size={14} /> Etiqueta Relacionada
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.etiqueta || ""}
                                            onChange={(e) => setFormData({ ...formData, etiqueta: e.target.value })}
                                            disabled={fetchingData}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-bold text-zinc-900 dark:text-zinc-100 appearance-none disabled:opacity-50"
                                        >
                                            <option value="">(sin etiqueta)</option>
                                            {tags.map((t) => (
                                                <option key={t.id} value={t.codigo}>
                                                    {t.nombre} ({t.etiqueta})
                                                </option>
                                            ))}
                                        </select>
                                        {fetchingData && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 size={14} className="animate-spin text-zinc-400" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] text-zinc-500 px-1 italic">
                                * Los vínculos se establecen mediante los códigos internos de cada entidad.
                            </p>
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
                            form="section-form"
                            disabled={loading || fetchingData}
                            className="flex items-center gap-2 px-8 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-teal-600 dark:hover:bg-teal-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-teal-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                section ? "Actualizar Sección" : "Crear Sección"
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
