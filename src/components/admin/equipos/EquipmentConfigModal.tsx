"use client";

import React, { useState, useEffect } from "react";
import { 
    X, 
    Save, 
    Loader2, 
    Settings,
    Cpu,
    Activity,
    Database,
    Binary
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EquipmentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentId: string;
    equipmentNombre: string;
    laboratoryId: string;
}

const DEFAULT_CONFIG = [
  {
    "SampleType": "N",
    "SendPatientData": 1,
    "ResultReceptionMode": 3,
    "ReceiveWithoutUnits": 1
  }
];

export function EquipmentConfigModal({ 
    isOpen, 
    onClose, 
    equipmentId, 
    equipmentNombre,
    laboratoryId 
}: EquipmentConfigModalProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<any[]>(DEFAULT_CONFIG);

    useEffect(() => {
        if (isOpen) {
            fetchConfig();
        }
    }, [isOpen, equipmentId, laboratoryId]);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/equipments/${equipmentId}/generic-config?labId=${laboratoryId}`);
            if (res.ok) {
                const data = await res.json();
                if (data && data.config) {
                    setConfig(data.config);
                } else {
                    setConfig(DEFAULT_CONFIG);
                }
            }
        } catch (error) {
            toast.error("Error al cargar la configuración");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/equipments/${equipmentId}/generic-config`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ config, laboratoryId })
            });

            if (res.ok) {
                toast.success("Configuración guardada correctamente");
                onClose();
            } else {
                toast.error("Error al guardar la configuración");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (index: number, field: string, value: any) => {
        const newConfig = [...config];
        newConfig[index] = { ...newConfig[index], [field]: value };
        setConfig(newConfig);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-100 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-10 pb-6 shrink-0 relative">
                            <div className="absolute top-8 right-8">
                                <button 
                                    onClick={onClose}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:rotate-90"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <Cpu className="text-white" size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                                        Configuración
                                    </h3>
                                    <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest">{equipmentNombre}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-10 pt-0 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <Loader2 size={40} className="animate-spin text-emerald-500" />
                                    <p className="text-sm text-zinc-400 font-bold tracking-tight">Sincronizando con equipo...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {config.map((item, index) => (
                                        <div key={index} className="space-y-6">
                                            {/* Field: SampleType */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4">
                                                    <Activity size={12} />
                                                    Tipo de Muestra (SampleType)
                                                </label>
                                                <input 
                                                    value={item.SampleType}
                                                    onChange={(e) => updateField(index, "SampleType", e.target.value)}
                                                    className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                                />
                                            </div>

                                            {/* Field: SendPatientData */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4">
                                                    <Database size={12} />
                                                    Enviar Datos Paciente
                                                </label>
                                                <select 
                                                    value={item.SendPatientData}
                                                    onChange={(e) => updateField(index, "SendPatientData", Number(e.target.value))}
                                                    className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                                                >
                                                    <option value={1}>Activado (1)</option>
                                                    <option value={0}>Desactivado (0)</option>
                                                </select>
                                            </div>

                                            {/* Field: ResultReceptionMode */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4">
                                                    <Settings size={12} />
                                                    Modo Recepción Resultados
                                                </label>
                                                <input 
                                                    type="number"
                                                    value={item.ResultReceptionMode}
                                                    onChange={(e) => updateField(index, "ResultReceptionMode", Number(e.target.value))}
                                                    className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                                                />
                                            </div>

                                            {/* Field: ReceiveWithoutUnits */}
                                            <div className="space-y-3">
                                                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-4">
                                                    <Binary size={12} />
                                                    Recibir Sin Unidades
                                                </label>
                                                <select 
                                                    value={item.ReceiveWithoutUnits}
                                                    onChange={(e) => updateField(index, "ReceiveWithoutUnits", Number(e.target.value))}
                                                    className="w-full h-14 px-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none"
                                                >
                                                    <option value={1}>Sí (1)</option>
                                                    <option value={0}>No (0)</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-10 pt-6 shrink-0 grid grid-cols-2 gap-4">
                            <button 
                                onClick={onClose}
                                className="h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="h-14 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                                Guardar Cambios
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
