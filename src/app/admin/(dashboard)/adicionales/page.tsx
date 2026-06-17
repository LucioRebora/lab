"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Layers, Loader2, Trash2, Edit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { AdditionalModal, type Additional } from "@/components/admin/AdditionalModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdditionalsPage() {
    const [additionals, setAdditionals] = useState<Additional[]>([]);
    const [filteredAdditionals, setFilteredAdditionals] = useState<Additional[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdditional, setEditingAdditional] = useState<Additional | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; nombre: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Use the active laboratory from localStorage or default
    const [activeLabId, setActiveLabId] = useState<string>("");

    useEffect(() => {
        // Escuchar cambios de laboratorio desde el Sidebar
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };

        handleLabChange(); // initial check
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const fetchAdditionals = async () => {
        try {
            setLoading(true);
            const url = activeLabId
                ? `/api/additionals?laboratoryId=${activeLabId}`
                : '/api/additionals';
            const res = await fetch(url);
            const data = await res.json();
            setAdditionals(Array.isArray(data) ? data : []);
            setFilteredAdditionals(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching additionals:", error);
            toast.error("Error al cargar locales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdditionals();
    }, [activeLabId]);

    useEffect(() => {
        const term = search.toLowerCase();
        const filtered = additionals.filter(
            (add) =>
                add.nombre.toLowerCase().includes(term) ||
                (add.abreviatura?.toLowerCase() || "").includes(term) ||
                (add.codigo?.toLowerCase() || "").includes(term)
        );
        setFilteredAdditionals(filtered);
    }, [search, additionals]);

    const handleDelete = async (id: string, nombre: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/additionals/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Error al eliminar adicional");

            toast.success("Adicional eliminado exitosamente");
            fetchAdditionals();
            setConfirmDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Ocurrió un error al eliminar adicional");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header elements... */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                        Adicionales
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                        Gestiona los elementos adicionales (envases, domicilios, etc)
                    </p>
                </div>
                <button
                    onClick={() => {
                        if (!activeLabId) {
                            toast.error("Debe seleccionar un laboratorio primero");
                            return;
                        }
                        setEditingAdditional(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm shadow-emerald-500/20 active:scale-[0.98]"
                >
                    <Plus size={18} />
                    <span>Nuevo Adicional</span>
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, abreviatura o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500"
                        />
                    </div>
                    <div className="text-sm font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                        {filteredAdditionals.length} resultados
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-3">
                            <Loader2 size={32} className="animate-spin text-emerald-500" />
                            <p className="text-sm font-medium">Cargando adicionales...</p>
                        </div>
                    ) : filteredAdditionals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400 gap-3">
                            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                                <Layers size={24} className="text-zinc-500" />
                            </div>
                            <p className="text-base font-medium text-zinc-600 dark:text-zinc-300">
                                No se encontraron adicionales
                            </p>
                            <p className="text-sm">Intenta buscar con otros términos o crea uno nuevo.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Detalles</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Condiciones</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredAdditionals.map((add) => (
                                    <tr key={add.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {add.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                            <div className="flex gap-2">
                                                {add.abreviatura && <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Ref: {add.abreviatura}</span>}
                                                {add.codigo && <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Cod: {add.codigo}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                            <div className="flex flex-col gap-1 text-xs">
                                                {add.agregarSiempre && <span className="text-emerald-600 dark:text-emerald-400 font-medium">● Agrega siempre</span>}
                                                {add.agregarEnUrgencia && <span className="text-rose-600 dark:text-rose-400 font-medium">● Agrega urgencias</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setEditingAdditional(add);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                 <button
                                                     onClick={() => setConfirmDelete({ id: add.id, nombre: add.nombre })}
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
                    )}
                </div>
            </div>

            <AdditionalModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                additional={editingAdditional}
                laboratoryId={activeLabId}
                onSaved={fetchAdditionals}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete.id, confirmDelete.nombre)}
                title="¿Eliminar Adicional?"
                description={confirmDelete ? `¿Estás seguro de que deseas eliminar el adicional "${confirmDelete.nombre}"? Esta acción no se puede deshacer.` : ""}
                confirmLabel="Eliminar"
                loading={deleteLoading}
                variant="danger"
            />
        </div>
    );
}
