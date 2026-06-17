"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ListOrdered } from "lucide-react";
import { UnitModal, type Unit } from "@/components/admin/UnitModal";
import { toast } from "sonner";

export default function UnitsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUnits = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/units");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setUnits(data);
        } catch (error) {
            toast.error("Error al cargar las unidades");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUnits();
        const handleLabChange = () => loadUnits();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (unit: Unit) => {
        setSelectedUnit(unit);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar esta unidad?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/units/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Unidad eliminada");
                        loadUnits();
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
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                        <ListOrdered size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Unidades</h1>
                        <p className="text-sm text-zinc-500 font-medium">Unidades de medida de resultados</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedUnit(null);
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nueva
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto min-h-[400px]">
                    {units.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {units.map((unit) => (
                                    <tr key={unit.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {unit.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(unit)}
                                                    className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(unit.id)}
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
                                No se encontraron unidades.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <UnitModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadUnits}
                unit={selectedUnit}
            />
        </div>
    );
}
