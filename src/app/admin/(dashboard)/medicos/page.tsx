"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Stethoscope, MapPin, Phone } from "lucide-react";
import { DoctorModal, type Doctor } from "@/components/admin/DoctorModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function DoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState<Doctor | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadDoctors = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/doctors");
            if (!res.ok) throw new Error("Failed to fetch doctors");
            const data = await res.json();
            setDoctors(data);
        } catch (error) {
            toast.error("Error al cargar los médicos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDoctors();
        const handleLabChange = () => {
            loadDoctors();
        };

        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/doctors/${confirmDelete.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Médico eliminado");
            setConfirmDelete(null);
            loadDoctors();
        } catch (error) {
            toast.error("Error al eliminar el médico");
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando médicos...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Médicos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Gestión de doctores derivantes</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedDoctor(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nuevo Médico
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden w-full overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Profesional</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">M.P.</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-1/3">Contacto / Ubicación</th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {doctors.length > 0 ? (
                            doctors.map((doctor) => (
                                <tr key={doctor.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            {doctor.tratamiento && <span className="text-blue-600 font-semibold">{doctor.tratamiento}</span>}
                                            {doctor.apellido}, {doctor.nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {doctor.matriculaProvincial ? <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">{doctor.matriculaProvincial}</span> : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {(doctor.ciudad || doctor.provincia || doctor.direccion) && (
                                                <div className="flex items-center gap-1.5 min-w-0 pr-4">
                                                    <MapPin size={12} className="shrink-0" />
                                                    <span className="truncate">{[doctor.direccion, doctor.ciudad, doctor.provincia].filter(Boolean).join(", ")}</span>
                                                </div>
                                            )}
                                            {(doctor.telefono || doctor.celular) && (
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <Phone size={12} className="shrink-0" />
                                                    {[doctor.telefono, doctor.celular].filter(Boolean).join(" / ")}
                                                </div>
                                            )}
                                            {!doctor.ciudad && !doctor.provincia && !doctor.direccion && !doctor.telefono && !doctor.celular && "—"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(doctor)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmDelete(doctor)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                        <Stethoscope className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin médicos</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                        No hay doctores cargados en el sistema de este laboratorio. Crea uno nuevo para comenzar a utilizarlos en los presupuestos o planes.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <DoctorModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadDoctors}
                doctor={selectedDoctor}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="¿Eliminar Médico?"
                description={`¿Está seguro de que desea eliminar al doctor <b>${confirmDelete?.apellido}, ${confirmDelete?.nombre}</b>? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
