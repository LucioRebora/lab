"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type Cover = {
    id: string;
    nombre: string;
    abreviatura: string | null;
    direccion: string | null;
    ciudad: string | null;
    provincia: string | null;
    codigoPostal: string | null;
    telefono: string | null;
    fax: string | null;
    celular: string | null;
    email: string | null;
    comentario1: string | null;
    comentario2: string | null;
    comentario3: string | null;
    comentario4: string | null;
    comentario5: string | null;
    laboratoryId?: string;
};

interface CoverModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    cover?: Cover | null;
}

export function CoverModal({ open, onClose, onSaved, cover }: CoverModalProps) {
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        nombre: "",
        abreviatura: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        telefono: "",
        fax: "",
        celular: "",
        email: "",
        comentario1: "",
        comentario2: "",
        comentario3: "",
        comentario4: "",
        comentario5: "",
    });

    useEffect(() => {
        if (open) {
            if (cover) {
                setFormData({
                    nombre: cover.nombre || "",
                    abreviatura: cover.abreviatura || "",
                    direccion: cover.direccion || "",
                    ciudad: cover.ciudad || "",
                    provincia: cover.provincia || "",
                    codigoPostal: cover.codigoPostal || "",
                    telefono: cover.telefono || "",
                    fax: cover.fax || "",
                    celular: cover.celular || "",
                    email: cover.email || "",
                    comentario1: cover.comentario1 || "",
                    comentario2: cover.comentario2 || "",
                    comentario3: cover.comentario3 || "",
                    comentario4: cover.comentario4 || "",
                    comentario5: cover.comentario5 || "",
                });
            } else {
                setFormData({
                    nombre: "",
                    abreviatura: "",
                    direccion: "",
                    ciudad: "",
                    provincia: "",
                    codigoPostal: "",
                    telefono: "",
                    fax: "",
                    celular: "",
                    email: "",
                    comentario1: "",
                    comentario2: "",
                    comentario3: "",
                    comentario4: "",
                    comentario5: "",
                });
            }
            setError("");
        }
    }, [cover, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const method = cover ? "PATCH" : "POST";
            const url = cover ? `/api/covers/${cover.id}` : "/api/covers";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(cover ? "Portada actualizada" : "Portada creada");
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
                    className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col mx-4 my-auto relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                                <FileText className="text-purple-600 dark:text-purple-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {cover ? "Editar Portada" : "Nueva Portada"}
                                </h2>
                                <p className="text-sm text-zinc-500 font-medium">
                                    Información de membrete para reportes
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-zinc-500"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8 bg-zinc-50/30 dark:bg-zinc-900/10">
                        {error && (
                            <Alert 
                                message={error} 
                                variant="error" 
                                onClose={() => setError("")}
                                className="mb-4"
                            />
                        )}

                        <form id="cover-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Identificación */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre de la Portada *</label>
                                        <input
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            placeholder="Ej: LABORATORIO DE BIOANÁLISIS"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Abreviatura</label>
                                        <input
                                            value={formData.abreviatura}
                                            onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            placeholder="Ej: LAB"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contacto y Ubicación */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                                    {/* Columna Izquierda */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Dirección</label>
                                            <input
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ciudad</label>
                                            <input
                                                value={formData.ciudad}
                                                onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Provincia</label>
                                            <input
                                                value={formData.provincia}
                                                onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Código Postal</label>
                                            <input
                                                value={formData.codigoPostal}
                                                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Columna Derecha */}
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Teléfono</label>
                                            <input
                                                value={formData.telefono}
                                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Fax</label>
                                            <input
                                                value={formData.fax}
                                                onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Celular</label>
                                            <input
                                                value={formData.celular}
                                                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email</label>
                                            <input
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comentarios Adicionales */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800/50 pb-3">Comentarios Auxiliares (Miembros, MPs, etc)</h3>
                                <p className="text-xs text-zinc-500 mb-4 font-medium">Estos son los textos auxiliares de las portadas y cabeceras cuando se informa un protocolo.</p>

                                <div className="space-y-3">
                                    {[1, 2, 3, 4, 5].map((num) => (
                                        <div key={num} className="flex items-center gap-3">
                                            <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 w-24 shrink-0">Comentario {num}:</label>
                                            <input
                                                value={(formData as any)[`comentario${num}`]}
                                                onChange={(e) => setFormData({ ...formData, [`comentario${num}`]: e.target.value })}
                                                className="flex-1 h-10 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                                                placeholder={`Texto adicional de portada ${num}`}
                                            />
                                        </div>
                                    ))}
                                </div>
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
                            form="cover-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-2xl text-sm font-bold hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? "Guardando..." : (cover ? "Actualizar" : "Guardar Portada")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
