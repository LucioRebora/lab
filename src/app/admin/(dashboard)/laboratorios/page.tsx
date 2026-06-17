"use client";
import { toast } from "sonner";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Search, Pencil, Trash2, X, Loader2, MapPin, Mail, Phone, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Laboratory {
    id: string;
    nombre: string;
    email: string | null;
    direccion: string | null;
    codigoPostal: string | null;
    ciudad: string | null;
    provincia: string | null;
    pais: string | null;
    telefono: string | null;
    sitioWeb: string | null;
    logo: string | null;
}

export default function LaboratoriesPage() {
    const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLab, setEditingLab] = useState<Laboratory | null>(null);

    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        direccion: "",
        codigoPostal: "",
        ciudad: "",
        provincia: "",
        pais: "",
        telefono: "",
        sitioWeb: "",
        logo: "",
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLaboratories();
    }, []);

    const fetchLaboratories = async () => {
        try {
            const res = await fetch("/api/laboratories");
            if (res.ok) {
                const data = await res.json();
                setLaboratories(data);
            }
        } catch (error) {
            console.error("Error fetching laboratories:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (lab?: Laboratory) => {
        if (lab) {
            setEditingLab(lab);
            setFormData({
                nombre: lab.nombre,
                email: lab.email || "",
                direccion: lab.direccion || "",
                codigoPostal: lab.codigoPostal || "",
                ciudad: lab.ciudad || "",
                provincia: lab.provincia || "",
                pais: lab.pais || "",
                telefono: lab.telefono || "",
                sitioWeb: lab.sitioWeb || "",
                logo: lab.logo || "",
            });
        } else {
            setEditingLab(null);
            setFormData({
                nombre: "",
                email: "",
                direccion: "",
                codigoPostal: "",
                ciudad: "",
                provincia: "",
                pais: "",
                telefono: "",
                sitioWeb: "",
                logo: "",
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLab(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const url = editingLab ? `/api/laboratories/${editingLab.id}` : "/api/laboratories";
            const method = editingLab ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                await fetchLaboratories();
                handleCloseModal();
            } else {
                toast.error("Error al guardar el laboratorio.");
            }
        } catch (error) {
            console.error("Error saving laboratory:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        toast("¿Estás seguro de que deseas eliminar este laboratorio?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/laboratories/${id}`, { method: "DELETE" });
                        if (res.ok) {
                            await fetchLaboratories();
                        } else {
                            toast.error("Error al eliminar el laboratorio.");
                        }
                    } catch (error) {
                        console.error("Error deleting laboratory:", error);
                    }
                }
            },
            cancel: {
                label: "Cancelar",
                onClick: () => { }
            }
        });
    };

    const filteredLaboratories = laboratories.filter(lab =>
        lab.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (lab.email && lab.email.toLowerCase().includes(search.toLowerCase())) ||
        (lab.ciudad && lab.ciudad.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Laboratorios</h1>
                    <p className="text-sm text-zinc-500 font-medium">Gestiona el directorio de laboratorios</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shrink-0"
                >
                    <Plus size={16} />
                    Nuevo Laboratorio
                </button>
            </div>

            {/* Config Box */}
            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar laboratorios..."
                            className="w-full h-11 pl-11 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all placeholder:text-zinc-400 shadow-sm"
                        />
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-3">
                            <Loader2 size={24} className="animate-spin" />
                            <p className="text-sm font-medium">Cargando laboratorios...</p>
                        </div>
                    ) : filteredLaboratories.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredLaboratories.map(lab => (
                                <div key={lab.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative">
                                    <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(lab)} className="p-2 text-zinc-400 hover:text-black dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(lab.id)} className="p-2 text-zinc-400 hover:text-rose-600 bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                            {lab.logo ? (
                                                <img src={lab.logo} alt={lab.nombre} className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 size={20} className="text-zinc-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight pr-12">{lab.nombre}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-1">
                                                <MapPin size={12} />
                                                <span>{lab.ciudad ? `${lab.ciudad}${lab.provincia ? `, ${lab.provincia}` : ''}` : "Sin ubicación"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Mail size={14} className="text-zinc-400 shrink-0" />
                                            <span className="truncate">{lab.email || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Phone size={14} className="text-zinc-400 shrink-0" />
                                            <span className="truncate">{lab.telefono || "-"}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                                            <Globe size={14} className="text-zinc-400 shrink-0" />
                                            <span className="truncate">{lab.sitioWeb || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300 mb-4">
                                <Building2 size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No hay laboratorios</h3>
                            <p className="text-sm text-zinc-500">Comenzá agregando el primero al directorio.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleCloseModal}
                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                <h2 className="text-xl font-bold tracking-tight">
                                    {editingLab ? "Editar Laboratorio" : "Nuevo Laboratorio"}
                                </h2>
                                <button onClick={handleCloseModal} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <form id="lab-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Nombre *</label>
                                            <input
                                                required
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all font-medium"
                                                placeholder="Nombre del laboratorio"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="contacto@laboratorio.com"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Teléfono</label>
                                                <input
                                                    value={formData.telefono}
                                                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="+54 11 1234 5678"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dirección</label>
                                            <input
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                placeholder="Ej: Av. Córdoba 1234, Piso 3"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ciudad</label>
                                                <input
                                                    value={formData.ciudad}
                                                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="CABA"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Provincia</label>
                                                <input
                                                    value={formData.provincia}
                                                    onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="Buenos Aires"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Código Postal</label>
                                                <input
                                                    value={formData.codigoPostal}
                                                    onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="1000"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">País</label>
                                                <input
                                                    value={formData.pais}
                                                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                                                    className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                    placeholder="Argentina"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Sitio Web</label>
                                            <input
                                                value={formData.sitioWeb}
                                                onChange={(e) => setFormData({ ...formData, sitioWeb: e.target.value })}
                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
                                                placeholder="https://www.laboratorio.com"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Logo (Opcional)</label>
                                            <div className="flex items-center gap-4">
                                                {formData.logo && (
                                                    <img src={formData.logo} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement("canvas");
                                                                    const MAX_WIDTH = 400;
                                                                    const scaleSize = MAX_WIDTH / img.width;
                                                                    canvas.width = MAX_WIDTH;
                                                                    canvas.height = img.height * scaleSize;
                                                                    const ctx = canvas.getContext("2d");
                                                                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                                                    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                                                    setFormData({ ...formData, logo: dataUrl });
                                                                };
                                                                img.src = reader.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700 transition-colors cursor-pointer text-zinc-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 shrink-0 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    form="lab-form"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {saving ? "Guardando..." : "Guardar Laboratorio"}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                }
            `}</style>
        </div>
    );
}
