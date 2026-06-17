"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, LayoutPanelLeft } from "lucide-react";
import { AspectModal, type Aspect } from "@/components/admin/AspectModal";
import { toast } from "sonner";

export default function AspectsPage() {
    const [aspects, setAspects] = useState<Aspect[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAspect, setSelectedAspect] = useState<Aspect | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAspects = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/aspects");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAspects(data);
        } catch (error) {
            toast.error("Error al cargar los aspectos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAspects();
        const handleLabChange = () => loadAspects();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (aspect: Aspect) => {
        setSelectedAspect(aspect);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar este aspecto?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/aspects/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Aspecto eliminado");
                        loadAspects();
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
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
                        <LayoutPanelLeft size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Aspectos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Configuración de visualización de resultados</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedAspect(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nuevo
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[400px]">
                    {aspects.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                     <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                                     <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Descripción</th>
                                     <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {aspects.map((aspect) => (
                                    <tr key={aspect.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                            {aspect.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">
                                            {aspect.descripcion || "-"}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(aspect)}
                                                    className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(aspect.id)}
                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-3">
                            <p className="text-base font-medium text-zinc-600 dark:text-zinc-300">
                                No se encontraron aspectos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <AspectModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadAspects}
                aspect={selectedAspect}
            />
        </div>
    );
}
