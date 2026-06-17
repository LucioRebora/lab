"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, LayoutGrid, Tag as TagIcon, FileStack, Eye, X } from "lucide-react";
import Link from "next/link";
import { SectionModal, type Section } from "@/components/admin/SectionModal";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function SectionsPage() {
    const [sections, setSections] = useState<Section[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [loading, setLoading] = useState(true);

    const loadSections = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/sections");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSections(data);
        } catch (error) {
            toast.error("Error al cargar las secciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSections();
        const handleLabChange = () => loadSections();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (section: Section) => {
        setSelectedSection(section);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar esta sección?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/sections/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Sección eliminada");
                        loadSections();
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
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Secciones</h1>
                        <p className="text-sm text-zinc-500 font-medium">Áreas analíticas del laboratorio</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedSection(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nueva
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Nombre</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Hoja de Trabajo</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Etiqueta</th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {sections.length > 0 ? (
                            sections.map((section) => (
                                <tr key={section.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                                        {section.nombre}
                                    </td>
                                    <td className="px-6 py-4">
                                        {section.worksheet ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-tighter shadow-sm">
                                                <FileStack size={10} strokeWidth={3} />
                                                {section.worksheet.nombre}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 dark:text-zinc-600 text-xs italic opacity-50">Sin definir</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {section.tag ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20 uppercase tracking-tighter shadow-sm">
                                                <TagIcon size={10} strokeWidth={3} />
                                                {section.tag.nombre}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400 dark:text-zinc-600 text-xs italic opacity-50">Sin definir</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-all duration-200">
                                            <Link 
                                                href={`/admin/secciones/${section.id}`}
                                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-90" 
                                                title="Ver Detalles"
                                            >
                                                <Eye size={15} />
                                            </Link>
                                            <button onClick={() => handleEdit(section)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-teal-600 dark:hover:text-teal-400 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-90" title="Editar"><Edit2 size={15} /></button>
                                            <button onClick={() => handleDelete(section.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500/40 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-90" title="Eliminar"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                        <LayoutGrid className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin secciones</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                        No hay secciones configuradas. Agrega algunas para organizar el laboratorio.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <SectionModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadSections}
                section={selectedSection}
            />
        </div>
    );
}
