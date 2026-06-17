"use client";

import React from "react";
import { ShieldAlert, Info, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AlertProps {
    title?: string;
    message: string;
    variant?: "error" | "info" | "success" | "warning";
    onClose?: () => void;
    className?: string;
}

export function Alert({ 
    title, 
    message, 
    variant = "error", 
    onClose,
    className 
}: AlertProps) {
    const variants = {
        error: {
            bg: "bg-rose-50 dark:bg-rose-950/20",
            border: "border-rose-100 dark:border-rose-900/30",
            text: "text-rose-800 dark:text-rose-300",
            icon: <ShieldAlert className="text-rose-500" size={18} />,
            titleColor: "text-rose-900 dark:text-rose-200"
        },
        info: {
            bg: "bg-blue-50 dark:bg-blue-950/20",
            border: "border-blue-100 dark:border-blue-900/30",
            text: "text-blue-800 dark:text-blue-300",
            icon: <Info className="text-blue-500" size={18} />,
            titleColor: "text-blue-900 dark:text-blue-200"
        },
        success: {
            bg: "bg-emerald-50 dark:bg-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/30",
            text: "text-emerald-800 dark:text-emerald-300",
            icon: <CheckCircle2 className="text-emerald-500" size={18} />,
            titleColor: "text-emerald-900 dark:text-emerald-200"
        },
        warning: {
            bg: "bg-amber-50 dark:bg-amber-950/20",
            border: "border-amber-100 dark:border-amber-900/30",
            text: "text-amber-800 dark:text-amber-300",
            icon: <AlertTriangle className="text-amber-500" size={18} />,
            titleColor: "text-amber-900 dark:text-amber-200"
        }
    };

    const styles = variants[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "group relative flex gap-4 p-4 rounded-3xl border shadow-sm transition-all",
                styles.bg,
                styles.border,
                className
            )}
        >
            <div className="shrink-0 pt-0.5">
                {styles.icon}
            </div>
            
            <div className="flex-1 min-w-0">
                {title && (
                    <h4 className={cn("text-sm font-bold mb-1 tracking-tight", styles.titleColor)}>
                        {title}
                    </h4>
                )}
                <p className={cn("text-xs leading-relaxed font-medium opacity-90", styles.text)}>
                    {message}
                </p>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="shrink-0 h-6 w-6 flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <X size={14} className="opacity-40" />
                </button>
            )}
        </motion.div>
    );
}
