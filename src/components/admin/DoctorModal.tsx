"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Stethoscope, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

export type Doctor = {
    id: string;
    apellido: string;
    nombre: string;
    tratamiento: string | null;
    matriculaProvincial: string | null;
    direccion: string | null;
    ciudad: string | null;
    provincia: string | null;
    codigoPostal: string | null;
    telefono: string | null;
    celular: string | null;
    email: string | null;
    notas: string | null;
    laboratoryId?: string;
};

interface DoctorModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    doctor?: Doctor | null;
}

export function DoctorModal({ open, onClose, onSaved, doctor }: DoctorModalProps) {
    const { data: session } = useSession();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        apellido: "",
        nombre: "",
        tratamiento: "Dr.",
        matriculaProvincial: "",
        direccion: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        telefono: "",
        celular: "",
        email: "",
        notas: "",
    });

    useEffect(() => {
        if (open) {
            if (doctor) {
                setFormData({
                    apellido: doctor.apellido || "",
                    nombre: doctor.nombre || "",
                    tratamiento: doctor.tratamiento || "Dr.",
                    matriculaProvincial: doctor.matriculaProvincial || "",
                    direccion: doctor.direccion || "",
                    ciudad: doctor.ciudad || "",
                    provincia: doctor.provincia || "",
                    codigoPostal: doctor.codigoPostal || "",
                    telefono: doctor.telefono || "",
                    celular: doctor.celular || "",
                    email: doctor.email || "",
                    notas: doctor.notas || "",
                });
            } else {
                setFormData({
                    apellido: "",
                    nombre: "",
                    tratamiento: "Dr.",
                    matriculaProvincial: "",
                    direccion: "",
                    ciudad: "",
                    provincia: "",
                    codigoPostal: "",
                    telefono: "",
                    celular: "",
                    email: "",
                    notas: "",
                });
            }
            setError("");
        }
    }, [doctor, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const method = doctor ? "PATCH" : "POST";
            const url = doctor ? `/api/doctors/${doctor.id}` : "/api/doctors";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(doctor ? "Médico actualizado" : "Médico creado");
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center overflow-y-auto pt-10 pb-10 custom-scrollbar"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col mx-4 my-auto relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                <Stethoscope className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {doctor ? "Editar Doctor" : "Nuevo Doctor"}
                                </h2>
                                <p className="text-sm text-zinc-500 font-medium">
                                    Completa los datos del profesional médico
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 text-zinc-500"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar space-y-8">
                        {error && (
                            <Alert 
                                message={error} 
                                variant="error" 
                                onClose={() => setError("")}
                                className="mb-4"
                            />
                        )}

                        <form id="doctor-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Info Group */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wider">Identificación</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Apellido */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Apellido *</label>
                                        <input
                                            value={formData.apellido}
                                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Ingresa el apellido"
                                            required
                                        />
                                    </div>

                                    {/* Nombre */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre *</label>
                                        <input
                                            value={formData.nombre}
                                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Ingresa el nombre"
                                            required
                                        />
                                    </div>

                                    {/* Tratamiento */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tratamiento</label>
                                        <div className="flex gap-2">
                                            {["Dr.", "Dra."].map(trat => (
                                                <button
                                                    key={trat}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, tratamiento: trat })}
                                                    className={`px-4 h-11 rounded-2xl text-sm font-medium border transition-colors flex-1 ${formData.tratamiento === trat ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-400 hover:dark:bg-zinc-800'}`}
                                                >
                                                    {trat}
                                                </button>
                                            ))}
                                            {/* Input libre si necesita otro tratamiento */}
                                            <input
                                                value={!["Dr.", "Dra."].includes(formData.tratamiento) ? formData.tratamiento : ""}
                                                onChange={(e) => setFormData({ ...formData, tratamiento: e.target.value })}
                                                className={`w-full max-w-28 h-11 px-3 bg-zinc-50 dark:bg-zinc-800/50 border rounded-2xl text-sm outline-none transition-all font-medium placeholder:text-zinc-400 ${!["Dr.", "Dra."].includes(formData.tratamiento) && formData.tratamiento !== "" ? 'border-blue-500 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-700/50 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'}`}
                                                placeholder="Otro..."
                                            />
                                        </div>
                                    </div>

                                    {/* Matrícula Provincial */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Matrícula Provincial</label>
                                        <input
                                            value={formData.matriculaProvincial}
                                            onChange={(e) => setFormData({ ...formData, matriculaProvincial: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Contact Info Group */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wider">Contacto y Ubicación</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email</label>
                                        <input
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="correo@ejemplo.com"
                                            type="email"
                                        />
                                    </div>

                                    <div className="space-y-1.5 sm:col-span-2">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Dirección</label>
                                        <input
                                            value={formData.direccion}
                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Calle y altura"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Ciudad</label>
                                        <input
                                            value={formData.ciudad}
                                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Ej: Gualeguaychú"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Provincia</label>
                                        <input
                                            value={formData.provincia}
                                            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Ej: Entre Ríos"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Código Postal</label>
                                        <input
                                            value={formData.codigoPostal}
                                            onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                            placeholder="Ej: 2820"
                                        />
                                    </div>
                                    <div className="hidden sm:block"></div> {/* Spacer */}

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Teléfono</label>
                                        <input
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Celular</label>
                                        <input
                                            value={formData.celular}
                                            onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Extras */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2 uppercase tracking-wider">Ajustes Adicionales</h3>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notas</label>
                                    <textarea
                                        value={formData.notas}
                                        onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                                        className="w-full h-24 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium custom-scrollbar resize-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                        placeholder="Comentarios o notas internas..."
                                    />
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 flex justify-end gap-3 rounded-b-4xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 text-sm font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50 rounded-2xl transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="doctor-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? "Guardando..." : (doctor ? "Actualizar" : "Guardar Doctor")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
