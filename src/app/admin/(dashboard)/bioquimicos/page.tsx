"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, ShieldAlert, UserCheck, MapPin, Phone } from "lucide-react";
import { BiochemistModal, type Biochemist } from "@/components/admin/BiochemistModal";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function BiochemistsPage() {
    const [biochemists, setBiochemists] = useState<Biochemist[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBiochemist, setSelectedBiochemist] = useState<Biochemist | null>(null);
    const [loading, setLoading] = useState(true);

    const loadBiochemists = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/biochemists");
            if (!res.ok) throw new Error("Failed to fetch biochemists");
            const data = await res.json();
            setBiochemists(data);
        } catch (error) {
            toast.error("Error al cargar los bioquímicos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBiochemists();
        // Listener for lab change if any
        const handleLabChange = () => {
            loadBiochemists();
        };

        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (biochemist: Biochemist) => {
        setSelectedBiochemist(biochemist);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar este bioquímico?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/biochemists/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Bioquímico eliminado");
                        loadBiochemists();
                    } catch (error) {
                        toast.error("Error al eliminar el bioquímico");
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
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando bioquímicos...</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Bioquímicos</h1>
                        <p className="text-sm text-zinc-500 font-medium">Gestión de profesionales</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setSelectedBiochemist(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nuevo Bioquímico
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Profesional</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Código</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-1/3">Contacto / Ubicación</th>
                            <th className="px-6 py-4 font-semibold text-center text-zinc-600 dark:text-zinc-400">Firmante</th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {biochemists.length > 0 ? (
                            biochemists.map((bio) => (
                                <tr key={bio.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                            {bio.tratamiento && <span className="text-orange-600 font-semibold">{bio.tratamiento}</span>}
                                            {bio.apellido}, {bio.nombre}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                        {bio.codigo ? <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs">{bio.codigo}</span> : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {(bio.ciudad || bio.provincia || bio.direccion) && (
                                                <div className="flex items-center gap-1.5 min-w-0 pr-4">
                                                    <MapPin size={12} className="shrink-0" />
                                                    <span className="truncate">{[bio.direccion, bio.ciudad, bio.provincia].filter(Boolean).join(", ")}</span>
                                                </div>
                                            )}
                                            {(bio.telefono || bio.celular) && (
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <Phone size={12} className="shrink-0" />
                                                    {bio.celular || bio.telefono}
                                                </div>
                                            )}
                                            {!bio.ciudad && !bio.provincia && !bio.direccion && !bio.telefono && !bio.celular && "—"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {bio.firmante ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                                                Habilitado
                                            </span>
                                        ) : (
                                            <span className="text-zinc-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(bio)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(bio.id)}
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
                                        <UserCheck className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin profesionales</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                        No hay bioquímicos cargados. Crea uno nuevo para comenzar a asignar responsables y firmantes automáticos.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <BiochemistModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadBiochemists}
                biochemist={selectedBiochemist}
            />
        </div>
    );
}
