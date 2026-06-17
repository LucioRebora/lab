"use client";
import { motion } from "framer-motion";

export default function AdminPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
            <div className="relative space-y-4">
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 opacity-[0.08] dark:opacity-[0.15] blur-3xl bg-emerald-500 rounded-full pointer-events-none" />
                
                <h1 className="text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 sm:text-6xl text-balance">
                  bienvenidos a <span className="inline-flex items-center gap-0 ml-3 align-middle">
                    <motion.img 
                      src="/img/logos/logito.png" 
                      alt="" 
                      initial={{ rotate: 30, scale: 0, opacity: 0 }}
                      animate={{ rotate: 30, scale: 1, opacity: 1 }}
                      whileHover={{ 
                        rotate: [30, 25, 35, 25, 35, 30],
                        scale: 1.1,
                      }}
                      transition={{ 
                        default: {
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: 0.2
                        },
                        rotate: {
                          duration: 0.4,
                          ease: "easeInOut"
                        }
                      }}
                      className="w-14 h-14 md:w-20 md:h-20 object-contain cursor-pointer"
                    />
                    <span className="text-emerald-500">bio.itia</span>
                  </span>
                </h1>
                <p className="text-lg text-zinc-500 font-medium tracking-wide">
                    Sistema de Gestión para Laboratorios Bioquímicos
                </p>
                <div className="h-1 w-20 bg-emerald-500 mx-auto rounded-full opacity-50" />
            </div>
        </div>
    );
}
