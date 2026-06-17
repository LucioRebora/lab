"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Plus, Pencil, Trash2, Search, Calendar, FileText, ClipboardList, Eye } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { PatientModal, type Patient } from "@/components/admin/PatientModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function AdminPatientsPage() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Patient | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [activeLabId, setActiveLabId] = useState<string>("");

    useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };
        handleLabChange();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const load = useCallback(async (q = "", labId = activeLabId) => {
        setLoading(true);
        try {
            const url = new URL("/api/patients", window.location.origin);
            if (q) url.searchParams.set("q", q);
            if (labId) url.searchParams.set("laboratoryId", labId);

            const res = await fetch(url.toString());
            const data = await res.json();
            setPatients(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [activeLabId]);

    useEffect(() => { load(search, activeLabId); }, [load, activeLabId]);

    useEffect(() => {
        const t = setTimeout(() => load(search, activeLabId), 300);
        return () => clearTimeout(t);
    }, [search, load, activeLabId]);

    const openNew = () => {
        if (!activeLabId) {
            toast.error("Debe seleccionar un laboratorio primero");
            return;
        }
        setEditingPatient(null);
        setModalOpen(true);
    };
    const openEdit = (p: Patient) => { setEditingPatient(p); setModalOpen(true); };

    const handleSaved = (saved: Patient) => {
        setPatients((prev) => {
            const exists = prev.find((p) => p.id === saved.id);
            if (exists) {
                return prev.map((p) => (p.id === saved.id ? saved : p));
            } else {
                return [saved, ...prev].sort((a, b) => a.apellido.localeCompare(b.apellido) || a.nombre.localeCompare(b.nombre));
            }
        });
    };

    const handleDelete = async (patient: Patient) => {
        setDeleteLoading(true);
        const res = await fetch(`/api/patients/${patient.id}`, { method: "DELETE" });
        if (res.ok) {
            setPatients((prev) => prev.filter((p) => p.id !== patient.id));
        }
        setDeleteLoading(false);
        setConfirmDelete(null);
    };

    return (
        <>
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-zinc-400" />
                        <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
                        <span className="text-sm text-zinc-400">({patients.length})</span>
                    </div>
                    <button
                        onClick={openNew}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                    >
                        <Plus size={16} /> Nuevo Paciente
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6 max-w-md">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por apellido, nombre, documento o email..."
                        className="w-full h-11 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 outline-none transition-all placeholder:text-zinc-400 shadow-sm"
                    />
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-4xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    {loading ? (
                        <div className="p-20 text-center text-zinc-400 text-sm">Cargando pacientes...</div>
                    ) : (
                        <div className="overflow-x-auto w-full custom-scrollbar">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                        <th className="px-5 py-4 font-semibold text-zinc-500">Paciente</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500">Documento</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-center w-24">Sexo</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500">Nacimiento</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-center w-20">Edad</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-right w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.length > 0 ? (
                                        patients.map((patient) => (
                                            <tr
                                                key={patient.id}
                                                className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors group"
                                            >
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                            {patient.apellido}, {patient.nombre}
                                                        </span>
                                                        <span className="text-xs text-zinc-500">{patient.email || "Sin email"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                                            {patient.tipoDocumento}
                                                        </span>
                                                        <span className="font-mono text-zinc-700 dark:text-zinc-300">
                                                            {patient.documento}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${patient.sexo === 'F' ? 'bg-pink-50 text-pink-600 dark:bg-pink-500/10' :
                                                        patient.sexo === 'M' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' :
                                                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
                                                        }`}>
                                                        {patient.sexo}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                                                    {patient.fechaNacimiento ? (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={13} className="text-zinc-400" />
                                                            {new Date(patient.fechaNacimiento).toLocaleDateString('es-AR')}
                                                        </div>
                                                    ) : "—"}
                                                </td>
                                                <td className="px-5 py-4 text-center font-medium">
                                                    {patient.edad !== null ? patient.edad : "—"}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/admin/pacientes/${patient.id}`}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                            title="Ver historia clínica"
                                                        >
                                                            <ClipboardList size={14} />
                                                        </Link>
                                                        <button
                                                            onClick={() => openEdit(patient)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                            title="Editar paciente"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(patient)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-colors"
                                                            title="Eliminar paciente"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center text-zinc-400">
                                                {search ? `Sin resultados para "${search}"` : "No hay pacientes registrados."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <PatientModal
                patient={editingPatient}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
                laboratoryId={activeLabId}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
                loading={deleteLoading}
                title="¿Eliminar Paciente?"
                description={`El paciente <b>${confirmDelete?.apellido}, ${confirmDelete?.nombre}</b> será eliminado permanentemente. ¿Deseas continuar?`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </>
    );
}
