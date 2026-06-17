"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, LayoutPanelLeft, Hash, Tag as TagIcon, Fingerprint } from "lucide-react";
import { TagModal, type Tag } from "@/components/admin/TagModal";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function EtiquetasPage() {
    const [tags, setTags] = useState<Tag[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
    const [loading, setLoading] = useState(true);

    const loadTags = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/tags");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setTags(data);
        } catch (error) {
            toast.error("Error al cargar las etiquetas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTags();
        const handleLabChange = () => loadTags();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (tag: Tag) => {
        setSelectedTag(tag);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar esta etiqueta?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Etiqueta eliminada");
                        loadTags();
                    } catch (error) {
                        toast.error("Error al eliminar");
                    }
                }
            },
            cancel: {
                label: "Cancelar",
                onClick: () => { }
            }
        });
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                        <LayoutPanelLeft size={32} />
                    </motion.div>
                    <p className="font-medium animate-pulse">Cargando etiquetas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header section with modern design */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                        <LayoutPanelLeft size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">Etiquetas</h1>
                        <p className="text-sm text-zinc-500 font-medium">Gestión de códigos y nomenclaturas para rotulación</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedTag(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/10"
                >
                    <Plus size={18} strokeWidth={3} />
                    Nueva Etiqueta
                </button>
            </div>

            {/* Table section with card container */}
            <div className="bg-white dark:bg-zinc-900/50 backdrop-blur-sm rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                        <thead>
                            <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                                <th className="px-8 py-5 font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-[10px]">
                                    <div className="flex items-center gap-2"><TagIcon size={12} /> Abreviatura</div>
                                </th>
                                <th className="px-8 py-5 font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-[10px]">
                                    <div className="flex items-center gap-2"><Fingerprint size={12} /> Código</div>
                                </th>
                                <th className="px-8 py-5 font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-[10px]">
                                    <div className="flex items-center gap-2"><Hash size={12} /> Nombre</div>
                                </th>
                                <th className="px-8 py-5 font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-[10px] text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {tags.length > 0 ? (
                                tags.map((tag) => (
                                    <tr key={tag.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="inline-flex px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black ring-1 ring-emerald-500/20 uppercase tracking-tighter">
                                                {tag.etiqueta}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-mono text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/20 dark:bg-zinc-800/10">
                                            {tag.codigo}
                                        </td>
                                        <td className="px-8 py-5 font-bold text-zinc-900 dark:text-zinc-200">
                                            {tag.nombre}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-4 group-hover:translate-x-0">
                                                <button 
                                                    onClick={() => handleEdit(tag)} 
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-90"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(tag.id)} 
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500/40 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-90"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="w-20 h-20 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-700 shadow-inner">
                                                <LayoutPanelLeft className="text-zinc-300 dark:text-zinc-600" size={40} />
                                            </div>
                                            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mb-2">Sin etiquetas</h3>
                                            <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal leading-relaxed">
                                                No hay etiquetas de rotulación configuradas para este laboratorio. Comienza agregando una nueva para organizar tus muestras.
                                            </p>
                                        </motion.div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <TagModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadTags}
                tag={selectedTag}
            />
        </div>
    );
}
