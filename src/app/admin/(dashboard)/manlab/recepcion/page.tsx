import React from "react";
import { PackageOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ManlabRecepcionPage() {
    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full min-h-[80vh] flex flex-col items-center justify-center">
            <div className="text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center text-indigo-600 mx-auto mb-8 shadow-inner">
                    <PackageOpen size={40} />
                </div>
                
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-4 uppercase">
                    Recepción Manlab
                </h1>
                
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl shadow-sm">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <p className="text-amber-700 dark:text-amber-400 font-black uppercase tracking-widest text-sm">
                        Pendiente de desarrollar
                    </p>
                </div>

                <p className="mt-8 text-zinc-500 max-w-md mx-auto font-medium">
                    Este módulo permitirá el ingreso y validación de muestras recibidas desde laboratorios periféricos.
                </p>

                <div className="mt-12">
                    <Link 
                        href="/admin/manlab"
                        className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold transition-all hover:translate-x-[-4px]"
                    >
                        <ArrowLeft size={18} />
                        Volver a Derivaciones
                    </Link>
                </div>
            </div>
        </div>
    );
}
