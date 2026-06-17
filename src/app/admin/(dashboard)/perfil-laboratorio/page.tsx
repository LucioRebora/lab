"use client";
import { toast } from "sonner";

import React, { useState, useEffect } from "react";
import { Loader2, Save, Building2, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";

const labSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono: z.string().optional().refine((val) => {
        if (!val) return true;
        const digitsOnly = val.replace(/\s+/g, '');
        return /^\+\d{10,15}$/.test(digitsOnly);
    }, {
        message: "Formato inválido. Ej: +549116680505"
    }).or(z.literal("")),
    direccion: z.string().optional().or(z.literal("")),
    codigoPostal: z.string().optional().or(z.literal("")),
    ciudad: z.string().optional().or(z.literal("")),
    provincia: z.string().optional().or(z.literal("")),
    pais: z.string().optional().or(z.literal("")),
    sitioWeb: z.string().optional().or(z.literal("")),
    logo: z.string().optional().or(z.literal("")),
});

type LabValues = z.infer<typeof labSchema>;

export default function LaboratoryProfilePage() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [activeLabId, setActiveLabId] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<LabValues>({
        resolver: zodResolver(labSchema),
        defaultValues: { nombre: "" }
    });

    useEffect(() => {
        if (!session?.user) return;

        const fetchLabInfo = async () => {
            setLoading(true);
            try {
                let labId = session.user.laboratoryId;
                if (session.user.role === "ADMIN") {
                    labId = localStorage.getItem('selectedLaboratoryId') || "";
                }

                if (!labId) {
                    setLoading(false);
                    return;
                }

                setActiveLabId(labId);

                const res = await fetch(`/api/laboratories/${labId}`);
                if (res.ok) {
                    const data = await res.json();
                    reset({
                        nombre: data.nombre || "",
                        email: data.email || "",
                        telefono: data.telefono || "",
                        direccion: data.direccion || "",
                        codigoPostal: data.codigoPostal || "",
                        ciudad: data.ciudad || "",
                        provincia: data.provincia || "",
                        pais: data.pais || "",
                        sitioWeb: data.sitioWeb || "",
                        logo: data.logo || "",
                    });
                }
            } catch (error) {
                console.error("Error fetching lab defaults:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLabInfo();
    }, [session, reset]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // max 2MB
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen no debe superar los 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue("logo", reader.result as string, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = async (data: LabValues) => {
        if (!activeLabId) return;

        try {
            const res = await fetch(`/api/laboratories/${activeLabId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                toast.success("Información del laboratorio actualizada.");
                window.dispatchEvent(new Event('laboratoryChanged'));
                setTimeout(() => window.location.reload(), 200);
            } else {
                toast.error("Error al actualizar la información.");
            }
        } catch (error) {
            toast.error("Error de conexión al servidor");
        }
    };

    const currentLogo = watch("logo");

    const inputClass = (hasError: boolean) =>
        cn(
            "w-full h-11 bg-white dark:bg-zinc-900 border rounded-2xl px-4 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all text-sm placeholder:text-zinc-400 font-medium text-zinc-800 dark:text-zinc-200",
            hasError
                ? "border-rose-400 dark:border-rose-600"
                : "border-zinc-200 dark:border-zinc-800 focus:border-black dark:focus:border-white"
        );

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-zinc-400" size={32} />
            </div>
        );
    }

    if (!activeLabId) {
        return (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center justify-center h-[80vh]">
                <Building2 size={48} className="text-zinc-300 mb-4" />
                <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">No hay laboratorio seleccionado</h2>
                <p className="mt-2 text-sm text-zinc-400">Por favor, seleccione un laboratorio o inicie sesión con una cuenta asignada a un laboratorio.</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8">
                <Building2 size={24} className="text-emerald-500" />
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Mi Laboratorio</h1>
            </div>

            <div className="bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 p-8 rounded-4xl shadow-sm">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Logotipo */}
                    <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                        <div className="relative group cursor-pointer w-28 h-28 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shadow-sm overflow-hidden flex items-center justify-center">
                            {currentLogo ? (
                                <img src={currentLogo} alt="Logo Laboratorio" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={40} className="text-zinc-300 dark:text-zinc-700" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload size={24} className="text-white" />
                            </div>
                            <input type="hidden" {...register("logo")} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                        </div>
                        <span className="text-sm font-medium text-zinc-500">Logo Oficial (Max 2MB)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nombre del Laboratorio</label>
                            <input
                                {...register("nombre")}
                                placeholder="Nombre comercial"
                                className={inputClass(!!errors.nombre)}
                            />
                            {errors.nombre && <p className="text-xs text-rose-500 px-1">{errors.nombre.message}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Email Comercial <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="contacto@laboratorio.com"
                                className={inputClass(!!errors.email)}
                            />
                            {errors.email && <p className="text-xs text-rose-500 px-1">{errors.email.message}</p>}
                        </div>

                        {/* Telefono */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Teléfono <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("telefono")}
                                type="tel"
                                placeholder="+549116680505"
                                className={inputClass(!!errors.telefono)}
                            />
                            {errors.telefono && <p className="text-xs text-rose-500 px-1">{errors.telefono.message}</p>}
                        </div>

                        {/* Dirección */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Dirección <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("direccion")}
                                placeholder="Av. Siempre Viva 123"
                                className={inputClass(!!errors.direccion)}
                            />
                            {errors.direccion && <p className="text-xs text-rose-500 px-1">{errors.direccion.message}</p>}
                        </div>

                        {/* Código Postal */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Código Postal <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("codigoPostal")}
                                placeholder="Ej: C1000"
                                className={inputClass(!!errors.codigoPostal)}
                            />
                            {errors.codigoPostal && <p className="text-xs text-rose-500 px-1">{errors.codigoPostal.message}</p>}
                        </div>

                        {/* Ciudad */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Ciudad <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("ciudad")}
                                placeholder="Ej: Buenos Aires"
                                className={inputClass(!!errors.ciudad)}
                            />
                            {errors.ciudad && <p className="text-xs text-rose-500 px-1">{errors.ciudad.message}</p>}
                        </div>

                        {/* Provincia */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Provincia / Estado <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("provincia")}
                                placeholder="Ej: Buenos Aires"
                                className={inputClass(!!errors.provincia)}
                            />
                            {errors.provincia && <p className="text-xs text-rose-500 px-1">{errors.provincia.message}</p>}
                        </div>

                        {/* País */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">País <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("pais")}
                                placeholder="Ej: Argentina"
                                className={inputClass(!!errors.pais)}
                            />
                            {errors.pais && <p className="text-xs text-rose-500 px-1">{errors.pais.message}</p>}
                        </div>

                        {/* Sitio Web */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Sitio Web <span className="font-normal text-zinc-400">(opcional)</span></label>
                            <input
                                {...register("sitioWeb")}
                                placeholder="https://www.laboratorio.com"
                                className={inputClass(!!errors.sitioWeb)}
                            />
                            {errors.sitioWeb && <p className="text-xs text-rose-500 px-1">{errors.sitioWeb.message}</p>}
                        </div>
                    </div>

                    {/* Footer / Buttons */}
                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 px-8 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
