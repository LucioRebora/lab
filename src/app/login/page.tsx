"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Loader2, LogIn } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "La contraseña es requerida"),
    rememberMe: z.boolean().optional(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const errorParam = params.get("error");
        if (errorParam === "UsuarioNoRegistrado" || errorParam === "AccessDenied") {
            setError("El usuario no está registrado en el sistema. Solicite acceso.");
        }
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            rememberMe: false
        }
    });

    const onSubmit = async (data: LoginValues) => {
        setError(null);

        // Guardar la preferencia en una cookie para que NextAuth la lea
        document.cookie = `remember-session=${data.rememberMe ? "true" : "false"}; path=/; max-age=31536000`; // 1 año de duración para la preferencia

        const result = await signIn("credentials", {
            email: data.email,
            password: data.password,
            redirect: false,
        });

        if (result?.error) {
            if (result.error === "Usuario no registrado") {
                setError("Usuario no registrado.");
            } else if (result.error === "Email o contraseña incorrectos") {
                setError("Email o contraseña incorrectos.");
            } else {
                setError("Error al iniciar sesión.");
            }
        } else {
            router.push("/admin");
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-6">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold tracking-tight">
                        bio.itia
                    </h1>
                    <p className="text-zinc-500 mt-2 text-sm">Sistema de Gestión para Laboratorios Bioquímicos</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 p-10">
                    <h2 className="text-xl font-semibold mb-8">Iniciar sesión</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-500">Email</label>
                            <input
                                {...register("email")}
                                type="email"
                                placeholder="admin@bio.itia.ar"
                                autoComplete="email"
                                className={cn(
                                    "w-full h-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all text-sm placeholder:text-zinc-400",
                                    errors.email && "border-rose-400"
                                )}
                            />
                            {errors.email && (
                                <p className="text-xs text-rose-500 px-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-500">Contraseña</label>
                            <input
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={cn(
                                    "w-full h-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all text-sm placeholder:text-zinc-400",
                                    errors.password && "border-rose-400"
                                )}
                            />
                            {errors.password && (
                                <p className="text-xs text-rose-500 px-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 pt-1 pb-1">
                            <input
                                {...register("rememberMe")}
                                type="checkbox"
                                id="rememberMe"
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:ring-offset-zinc-900"
                            />
                            <label htmlFor="rememberMe" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                Mantener la sesión iniciada
                            </label>
                        </div>

                        {error && (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-sm text-rose-500 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl px-4 py-3 text-center"
                            >
                                {error}
                            </motion.p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:pointer-events-none mt-2"
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Ingresar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500">O continuá con</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            // Set cookie for Google Login too
                            const isRememberMe = (document.getElementById('rememberMe') as HTMLInputElement)?.checked ?? false;
                            document.cookie = `remember-session=${isRememberMe}; path=/; max-age=31536000`;
                            signIn("google", { callbackUrl: "/admin" });
                        }}
                        className="w-full h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <FcGoogle size={20} />
                        Continuar con Google
                    </button>
                </div>

                <p className="text-center text-xs text-zinc-400 mt-8">
                    powered by{" "}
                    <a href="https://itia.ar" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                        itia.ar
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
