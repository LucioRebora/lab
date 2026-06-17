"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Info, X } from "lucide-react";

interface ConfirmModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCancel?: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
}

export function ConfirmModal({
    open,
    onClose,
    onConfirm,
    onCancel,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    loading = false
}: ConfirmModalProps) {
    const icons = {
        danger: <Trash2 size={24} className="text-rose-500" />,
        warning: <AlertTriangle size={24} className="text-amber-500" />,
        info: <Info size={24} className="text-blue-500" />
    };

    const bgColors = {
        danger: "bg-rose-50 dark:bg-rose-950/30",
        warning: "bg-amber-50 dark:bg-amber-950/30",
        info: "bg-blue-50 dark:bg-blue-950/30"
    };

    const buttonColors = {
        danger: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
        warning: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
        info: "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20"
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 12 }}
                        className="fixed inset-0 flex items-center justify-center z-[100] px-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm p-8 text-center pointer-events-auto relative overflow-hidden">
                            <button 
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className={`w-14 h-14 rounded-full ${bgColors[variant]} flex items-center justify-center mx-auto mb-5`}>
                                {icons[variant]}
                            </div>
                            
                            <h2 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-50">{title}</h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 px-2" dangerouslySetInnerHTML={{ __html: description }} />
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel || onClose}
                                    disabled={loading}
                                    className="flex-1 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 font-bold text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex-1 h-12 ${buttonColors[variant]} text-white rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg disabled:opacity-50`}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Procesando...</span>
                                        </div>
                                    ) : confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
