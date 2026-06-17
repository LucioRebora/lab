"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { SettingModal, Setting } from "@/components/admin/SettingModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export default function ParamsPage() {
    const { data: session, status } = useSession();
    const [settings, setSettings] = useState<Setting[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
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

    useEffect(() => {
        if (status === "loading") return;
        if (activeLabId) {
            fetchSettings(activeLabId);
        } else {
            setLoading(false);
        }
    }, [activeLabId, status]);

    const fetchSettings = async (labId: string) => {
        try {
            setLoading(true);
            const res = await fetch("/api/settings?laboratoryId=" + labId);
            const data = await res.json();
            if (res.ok) {
                setSettings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/settings/${id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setSettings(settings.filter((s) => s.id !== id));
                setConfirmDelete(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleSaved = (setting: Setting) => {
        if (editingSetting) {
            setSettings(settings.map(s => s.id === setting.id ? setting : s));
        } else {
            setSettings([...settings, setting].sort((a, b) => a.key.localeCompare(b.key)));
        }
        setIsModalOpen(false);
    };

    const filteredSettings = settings.filter(s =>
        s.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.value.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 md:ml-64 bg-white dark:bg-black min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Settings className="w-6 h-6" /> Parámetros del Sistema
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Configura los valores por defecto y ajustes del laboratorio
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingSetting(null);
                            setIsModalOpen(true);
                        }}
                        className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 w-fit"
                    >
                        <Plus size={16} />
                        Nuevo Parámetro
                    </button>
                </div>

                <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
                    <Search className="text-zinc-400 w-5 h-5 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar parámetros..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none w-full text-sm text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500"
                    />
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <div className="w-8 h-8 border-4 border-zinc-200 dark:border-zinc-800 border-t-black dark:border-t-white rounded-full animate-spin" />
                    </div>
                ) : filteredSettings.length === 0 ? (
                    <div className="text-center p-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                        <Settings className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">No hay parámetros</h3>
                        <p className="text-zinc-500 text-sm mt-1 mb-4">Añade tu primer parámetro del sistema para configurar la plataforma.</p>
                        <button
                            onClick={() => {
                                setEditingSetting(null);
                                setIsModalOpen(true);
                            }}
                            className="bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Nuevo Parámetro
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSettings.map((s) => (
                            <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <h3 className="font-mono text-sm font-bold text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded uppercase shrink-0">
                                            {s.key}
                                        </h3>
                                        <span className="text-zinc-400 dark:text-zinc-600 text-xs">=</span>
                                        <div className="flex-1 min-w-0">
                                            <span 
                                                title={s.value}
                                                className="block font-medium text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded truncate"
                                            >
                                                {s.value}
                                            </span>
                                        </div>
                                    </div>
                                    {s.description && (
                                        <p className="text-sm text-zinc-500">{s.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0">
                                    <button
                                        onClick={() => {
                                            setEditingSetting(s);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {activeLabId && (
                <SettingModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    setting={editingSetting}
                    laboratoryId={activeLabId}
                    onSaved={handleSaved}
                />
            )}

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
                title="¿Eliminar Parámetro?"
                description="Se eliminará el parámetro del sistema. Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                loading={deleteLoading}
                variant="danger"
            />
        </div>
    );
}
