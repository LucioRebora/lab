"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, FileText, MapPin, Mail, Phone } from "lucide-react";
import { CoverModal, type Cover } from "@/components/admin/CoverModal";
import { toast } from "sonner";

export default function CoversPage() {
    const [covers, setCovers] = useState<Cover[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedCover, setSelectedCover] = useState<Cover | null>(null);
    const [loading, setLoading] = useState(true);

    const loadCovers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/covers");
            if (!res.ok) throw new Error("Failed to fetch covers");
            const data = await res.json();
            setCovers(data);
        } catch (error) {
            toast.error("Error al cargar las portadas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCovers();
        const handleLabChange = () => {
            loadCovers();
        };

        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (cover: Cover) => {
        setSelectedCover(cover);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar esta portada?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/covers/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Portada eliminada");
                        loadCovers();
                    } catch (error) {
                        toast.error("Error al eliminar la portada");
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
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando portadas...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Portadas</h1>
                        <p className="text-sm text-zinc-500 font-medium">Formatos de membrete para reportes</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedCover(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nueva Portada
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {covers.length > 0 ? (
                    covers.map((cover) => (
                        <div key={cover.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-6 shadow-sm hover:shadow transition-all relative">
                            {/* Actions Overlay */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(cover)}
                                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cover.id)}
                                    className="p-2 text-zinc-400 hover:text-rose-600 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                                    <FileText size={20} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight pr-12 text-zinc-900 dark:text-zinc-100">{cover.nombre}</h3>
                                    {cover.abreviatura && (
                                        <div className="mt-1">
                                            <span className="inline-flex font-mono px-2 py-0.5 rounded text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                {cover.abreviatura}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                    <MapPin size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2 leading-relaxed">
                                        {[cover.direccion, cover.ciudad, cover.provincia].filter(Boolean).join(", ") || "Sin dirección"}
                                    </span>
                                </div>
                                {(cover.telefono || cover.celular) && (
                                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Phone size={14} className="text-zinc-400 shrink-0" />
                                        <span className="truncate">{[cover.telefono, cover.celular].filter(Boolean).join(" / ")}</span>
                                    </div>
                                )}
                                {cover.email && (
                                    <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                        <Mail size={14} className="text-zinc-400 shrink-0" />
                                        <span className="truncate">{cover.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Info Comentarios */}
                            <div className="mt-4 pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-1.5">
                                {[cover.comentario1, cover.comentario2, cover.comentario3, cover.comentario4, cover.comentario5].filter(Boolean).map((com, idx) => (
                                    <span key={idx} className="inline-flex max-w-[calc(100%-8px)] truncate px-2 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-lg text-[10px] font-medium text-zinc-500" title={com!}>
                                        {com}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16 bg-white dark:bg-zinc-900 rounded-4xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 mb-4">
                            <FileText className="text-zinc-400" size={24} />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin portadas configuradas</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                            Las portadas sirven para definir los diseños de cabeceras de tus protocolos y reportes.
                        </p>
                    </div>
                )}
            </div>

            <CoverModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadCovers}
                cover={selectedCover}
            />
        </div>
    );
}
