"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";
import { HealthInsuranceModal, type HealthInsurance } from "@/components/admin/HealthInsuranceModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function ObrasSocialesPage() {
    const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedInsurance, setSelectedInsurance] = useState<HealthInsurance | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<HealthInsurance | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadInsurances = async () => {
        try {
            setLoading(true);
            const labId = localStorage.getItem('selectedLaboratoryId');
            const url = labId ? `/api/health-insurances?laboratoryId=${labId}` : '/api/health-insurances';
            const res = await fetch(url);
            const data = await res.json();
            setHealthInsurances(data);
        } catch (error) {
            toast.error("Error al cargar obras sociales");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInsurances();

        const handleLabChange = () => {
            loadInsurances();
        };

        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (insurance: HealthInsurance) => {
        setSelectedInsurance(insurance);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/health-insurances/${confirmDelete.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Obra social eliminada");
            setConfirmDelete(null);
            loadInsurances();
        } catch (error) {
            toast.error("Error al eliminar la obra social");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Cargando obras sociales...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 w-full overflow-x-hidden">
            <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-emerald-500" />
                        Obras Sociales / Prepagas
                    </h1>
                    <p className="text-zinc-500 mt-1">Gestione las obras sociales, prepagas y mutuales.</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedInsurance(null);
                        setModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 flex items-center font-medium shadow-sm transition-colors text-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva OS / Prepaga
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden text-sm">
                <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Nombre</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {healthInsurances.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-zinc-500">
                                        No hay registros encontrados
                                    </td>
                                </tr>
                            ) : (
                                healthInsurances.map((insurance) => (
                                    <tr key={insurance.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                                            {insurance.nombre}
                                        </td>
                                        <td className="px-6 py-4 text-center space-x-2">
                                            {insurance.contado && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                    Contado
                                                </span>
                                            )}
                                            {insurance.cortada && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                                                    Cortada
                                                </span>
                                            )}
                                            {!insurance.contado && !insurance.cortada && (
                                                <span className="text-xs text-zinc-400 font-medium">Normal</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(insurance)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(insurance)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <HealthInsuranceModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={() => {
                    setModalOpen(false);
                    loadInsurances();
                }}
                healthInsurance={selectedInsurance}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="¿Eliminar Obra Social?"
                description={`¿Está seguro de que desea eliminar <b>${confirmDelete?.nombre}</b>? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
