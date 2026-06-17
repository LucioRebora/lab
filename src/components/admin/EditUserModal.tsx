"use client";
import { toast } from "sonner";
import { Alert } from "@/components/ui/Alert";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, UserCircle, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const userSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Email inválido"),
    role: z.enum(["USER", "LAB_ADMIN", "ADMIN"]),
    password: z.string().optional(),
    laboratoryId: z.string().optional(),
    image: z.string().optional(),
    telefono: z.string().optional().refine((val) => {
        if (!val) return true;
        // Permite el formato con o sin espacios: +549116680505
        const digitsOnly = val.replace(/\s+/g, '');
        return /^\+\d{10,15}$/.test(digitsOnly);
    }, {
        message: "Formato inválido. Ej: +549116680505"
    }),
}).refine((data) => {
    if (data.role !== "ADMIN" && !data.laboratoryId) {
        return false;
    }
    return true;
}, {
    message: "Debe asignar un laboratorio para este rol",
    path: ["laboratoryId"]
});

type UserValues = z.infer<typeof userSchema>;

export interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    active: boolean;
    image?: string | null;
    telefono?: string | null;
    createdAt: string;
    laboratory?: {
        id: string;
        nombre: string;
    };
}

interface EditUserModalProps {
    user: User | null;
    laboratories: { id: string, nombre: string }[];
    open: boolean;
    isProfile?: boolean;
    onClose: () => void;
    onSaved: (updated: User) => void;
}

export function EditUserModal({ user, laboratories, open, isProfile, onClose, onSaved }: EditUserModalProps) {
    const [serverError, setServerError] = React.useState<string | null>(null);
    const { data: session } = useSession();
    const isEditing = !!user;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<UserValues>({
        resolver: zodResolver(userSchema),
    });

    // Populate form when user changes or modal opens for new user
    useEffect(() => {
        if (open) {
            if (user) {
                reset({
                    name: user.name ?? "",
                    email: user.email,
                    role: user.role as any,
                    password: "",
                    laboratoryId: user.laboratory?.id || "",
                    image: user.image || "",
                    telefono: user.telefono || "",
                });
            } else {
                // Para nuevos usuarios, pre-cargar el lab activo si existe
                const activeLabId = typeof window !== 'undefined' ? localStorage.getItem('selectedLaboratoryId') || "" : "";
                reset({
                    name: "",
                    email: "",
                    role: "USER",
                    password: "",
                    laboratoryId: activeLabId,
                    image: "",
                    telefono: "",
                });
            }
        }
        setServerError(null);
    }, [user, open, reset]);

    const onSubmit = async (data: UserValues) => {
        const payload: any = {
            name: data.name,
            email: data.email,
            role: data.role,
        };

        setServerError(null);

        if (data.telefono) payload.telefono = data.telefono;

        if (data.laboratoryId) {
            payload.laboratoryId = data.laboratoryId;
        }
        if (data.image) {
            payload.image = data.image;
        }

        if (data.password && data.password.length > 0) {
            payload.password = data.password;
        } else if (!isEditing) {
            setServerError("La contraseña es requerida para nuevos usuarios");
            return;
        }

        const url = isEditing ? `/api/users/${user.id}` : "/api/users";
        const method = isEditing ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                const result = await res.json();
                onSaved(result);
                onClose();
            } else {
                const err = await res.json();
                setServerError(err.error || "No se pudo guardar el usuario");
            }
        } catch (error) {
            setServerError("Error de conexión al servidor");
        }
    };

    const inputClass = (hasError: boolean) =>
        cn(
            "w-full h-11 bg-zinc-50 dark:bg-zinc-800 border rounded-2xl px-4 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all text-sm placeholder:text-zinc-400",
            hasError
                ? "border-rose-400 dark:border-rose-600"
                : "border-zinc-200 dark:border-zinc-700"
        );

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("La imagen no debe superar los 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setValue("image", reader.result as string, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    };

    const currentImage = watch("image");

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 flex items-center justify-center z-50 px-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-md p-8">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-bold">{isProfile ? "Mi Perfil" : isEditing ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                                    <p className="text-sm text-zinc-500 mt-0.5">
                                        {isProfile ? "Actualiza tu información personal" : isEditing ? user.email : "Crea una nueva cuenta de acceso"}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <X size={18} className="text-zinc-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {serverError && (
                                    <Alert 
                                        message={serverError}
                                        variant="error"
                                        onClose={() => setServerError(null)}
                                    />
                                )}
                                {/* Avatar (sólo si es Mi Perfil) */}
                                {isProfile && (
                                    <div className="flex flex-col items-center justify-center space-y-3 pb-2">
                                        <div className="relative group cursor-pointer w-24 h-24 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shadow-sm overflow-hidden flex items-center justify-center">
                                            {currentImage ? (
                                                <img src={currentImage} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserCircle size={48} className="text-zinc-400" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload size={20} className="text-white" />
                                            </div>
                                            <input type="hidden" {...register("image")} />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-500">Cambiar Avatar (Max 2MB)</span>
                                    </div>
                                )}

                                {/* Nombre */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-500">Nombre</label>
                                    <input
                                        {...register("name")}
                                        placeholder="Nombre completo"
                                        className={inputClass(!!errors.name)}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-rose-500 px-1">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-500">Email</label>
                                    <input
                                        {...register("email")}
                                        type="email"
                                        placeholder="email@ejemplo.com"
                                        disabled={isProfile}
                                        className={cn(inputClass(!!errors.email), isProfile && "pointer-events-none opacity-60 bg-zinc-100 dark:bg-zinc-800/50")}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-rose-500 px-1">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Teléfono */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-500">Teléfono <span className="text-zinc-400 font-normal">(opcional)</span></label>
                                    <input
                                        {...register("telefono")}
                                        type="tel"
                                        placeholder="+549116680505"
                                        className={inputClass(!!errors.telefono)}
                                    />
                                    {errors.telefono && (
                                        <p className="text-xs text-rose-500 px-1">{errors.telefono.message}</p>
                                    )}
                                </div>

                                {/* Rol */}
                                {!isProfile && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-500">Rol</label>
                                        <select
                                            {...register("role")}
                                            className={inputClass(!!errors.role)}
                                        >
                                            <option value="USER">Usuario (Por defecto)</option>
                                            <option value="LAB_ADMIN">Laboratorio Admin</option>
                                            {session?.user?.role === "ADMIN" && (
                                                <option value="ADMIN">Administrador</option>
                                            )}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-zinc-500">
                                        {isEditing ? "Nueva contraseña " : "Contraseña "}
                                        <span className="text-zinc-400 font-normal">
                                            {isEditing ? "(dejar vacío para no cambiar)" : "(requerida)"}
                                        </span>
                                    </label>
                                    <input
                                        {...register("password")}
                                        type="password"
                                        placeholder="••••••••"
                                        className={inputClass(false)}
                                    />
                                </div>

                                {/* Laboratorio */}
                                {!isProfile && session?.user?.role === "ADMIN" && watch("role") !== "ADMIN" && (
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-zinc-500">Laboratorio</label>
                                        <select
                                            {...register("laboratoryId")}
                                            className={inputClass(!!errors.laboratoryId)}
                                        >
                                            <option value="">Ninguno / Seleccione...</option>
                                            {laboratories.map((lab) => (
                                                <option key={lab.id} value={lab.id}>{lab.nombre}</option>
                                            ))}
                                        </select>
                                        {errors.laboratoryId && (
                                            <p className="text-xs text-rose-500 px-1">{errors.laboratoryId.message}</p>
                                        )}
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 h-11 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 h-11 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Save size={15} />
                                                Guardar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
