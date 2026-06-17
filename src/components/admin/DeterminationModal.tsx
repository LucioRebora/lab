"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldAlert, Beaker, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Section } from "./SectionModal";

export type Determination = {
    id: string;
    nombre: string;
    abreviatura: string | null;
    codigo: string | null;
    mensajeIngreso: string | null;
    comentarioFijo: string | null;
    aspecto: string | null;
    condicionesMuestra: string | null;
    imprimirWorksheet: boolean;
    resumirWorksheet: boolean;
    alturaWorksheet: number | null;
    sectionId: string | null;
    methodId?: string | null;
    aspectId?: string | null;
    unitId?: string | null;
    informarMetodo?: boolean;
    section?: Section | null;
    method?: any;
    laboratoryId?: string;
    activa?: boolean;
    codManlab?: string | null;
    imprimirHistorico?: boolean;
};

interface DeterminationModalProps {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    determination?: Determination | null;
}

export function DeterminationModal({ open, onClose, onSaved, determination }: DeterminationModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sections, setSections] = useState<Section[]>([]);
    const [methods, setMethods] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        nombre: "",
        abreviatura: "",
        codigo: "",
        mensajeIngreso: "",
        comentarioFijo: "",
        aspecto: "AS1", // default as seen in image
        condicionesMuestra: "",
        sectionId: "",
        methodId: "",
        aspectId: "",
        unitId: "",
        imprimirWorksheet: true,
        resumirWorksheet: false,
        informarMetodo: true,
        alturaWorksheet: "",
        activa: true,
        codManlab: "",
        imprimirHistorico: false,
    });

    useEffect(() => {
        if (open) {
            // Load sections and methods
            Promise.all([
                fetch("/api/sections").then(res => res.json()),
                fetch("/api/methods").then(res => res.json())
            ])
                .then(([sectionsData, methodsData]) => {
                    if (Array.isArray(sectionsData)) setSections(sectionsData);
                    if (Array.isArray(methodsData)) setMethods(methodsData);
                })
                .catch(() => console.error("Failed to load lists"));

            if (determination) {
                setFormData({
                    nombre: determination.nombre || "",
                    abreviatura: determination.abreviatura || "",
                    codigo: determination.codigo || "",
                    mensajeIngreso: determination.mensajeIngreso || "",
                    comentarioFijo: determination.comentarioFijo || "",
                    aspecto: determination.aspecto || "",
                    condicionesMuestra: determination.condicionesMuestra || "",
                    sectionId: determination.sectionId || "",
                    methodId: (determination as any).methodId || (determination as any).method?.id || "",
                    aspectId: determination.aspectId || "",
                    unitId: determination.unitId || "",
                    imprimirWorksheet: determination.imprimirWorksheet ?? true,
                    resumirWorksheet: determination.resumirWorksheet ?? false,
                    informarMetodo: (determination as any).informarMetodo ?? true,
                    alturaWorksheet: determination.alturaWorksheet ? String(determination.alturaWorksheet) : "",
                    activa: determination.activa ?? true,
                    codManlab: determination.codManlab || "",
                    imprimirHistorico: (determination as any).imprimirHistorico ?? false,
                });
            } else {
                setFormData({
                    nombre: "",
                    abreviatura: "",
                    codigo: "",
                    mensajeIngreso: "",
                    comentarioFijo: "",
                    aspecto: "AS1",
                    condicionesMuestra: "",
                    sectionId: "",
                    methodId: "",
                    aspectId: "",
                    unitId: "",
                    imprimirWorksheet: true,
                    resumirWorksheet: false,
                    informarMetodo: true,
                    alturaWorksheet: "",
                    activa: true,
                    codManlab: "",
                    imprimirHistorico: false,
                });
            }
            setError("");
        }
    }, [determination, open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const httpMethod = determination ? "PATCH" : "POST";
            const url = determination ? `/api/determinations/${determination.id}` : "/api/determinations";

            const payload = {
                ...formData,
                sectionId: formData.sectionId === "" ? null : formData.sectionId,
                methodId: formData.methodId === "" ? null : formData.methodId,
            };

            const res = await fetch(url, {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Ocurrió un error.");
            }

            toast.success(determination ? "Determinación actualizada" : "Determinación creada");
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
                    className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col mx-4 my-auto relative"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                                <Beaker className="text-violet-600 dark:text-violet-400" size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                    {determination ? "Editar Determinación" : "Nueva Determinación"}
                                </h2>
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

                        <form id="determination-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Estado Toggle */}
                            <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50">
                                <div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Estado de la Determinación</h4>
                                    <p className="text-xs text-zinc-500">Define si la determinación está disponible para el ingreso de protocolos.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, activa: !formData.activa })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${formData.activa ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.activa ? 'translate-x-6' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>


                            <div className="grid sm:grid-cols-4 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Código</label>
                                    <input
                                        value={formData.codigo}
                                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        placeholder="Ej: 001"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Cod ManLab</label>
                                    <input
                                        value={formData.codManlab}
                                        onChange={(e) => setFormData({ ...formData, codManlab: e.target.value.substring(0, 6).toUpperCase() })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        placeholder="6 chars"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nombre *</label>
                                    <input
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        placeholder="Ej: HEMOGRAMA"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Abreviatura</label>
                                    <input
                                        value={formData.abreviatura}
                                        onChange={(e) => setFormData({ ...formData, abreviatura: e.target.value })}
                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        placeholder="Ej: HEMO"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 bg-zinc-50/50 dark:bg-zinc-800/20 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-start gap-2">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Mensaje De Ingreso</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Mensaje de advertencia que se muestra en el ingreso de protocolos.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <textarea
                                            value={formData.mensajeIngreso}
                                            onChange={(e) => setFormData({ ...formData, mensajeIngreso: e.target.value })}
                                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium min-h-[60px] resize-y custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-start gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Comentario Fijo</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Texto que se imprime en los protocolos, al final de la determinación.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <textarea
                                            value={formData.comentarioFijo}
                                            onChange={(e) => setFormData({ ...formData, comentarioFijo: e.target.value })}
                                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium min-h-[60px] resize-y custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Aspecto</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Formato de la determinación al imprimir protocolos.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <input
                                            value={formData.aspecto}
                                            onChange={(e) => setFormData({ ...formData, aspecto: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 bg-zinc-50/50 dark:bg-zinc-800/20 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-start gap-2">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Condiciones de la Muestra</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Información de referencia para el bioquímico.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <textarea
                                            value={formData.condicionesMuestra}
                                            onChange={(e) => setFormData({ ...formData, condicionesMuestra: e.target.value })}
                                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium min-h-[60px] resize-y custom-scrollbar"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block">Método</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Método analítico utilizado para esta determinación.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <select
                                            value={formData.methodId}
                                            onChange={(e) => setFormData({ ...formData, methodId: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium appearance-none"
                                        >
                                            <option value="">(ninguno)</option>
                                            {methods.map(m => (
                                                <option key={m.id} value={m.id}>{m.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5 flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <div className="sm:w-1/3">
                                        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 block">Sección</label>
                                        <p className="text-[11px] text-zinc-500 leading-tight">Agrupa las determinaciones al imprimir las HDT.</p>
                                    </div>
                                    <div className="sm:w-2/3">
                                        <select
                                            value={formData.sectionId}
                                            onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium appearance-none"
                                        >
                                            <option value="">(ninguna)</option>
                                            {sections.map(sec => (
                                                <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.imprimirWorksheet}
                                            onChange={(e) => setFormData({ ...formData, imprimirWorksheet: e.target.checked })}
                                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Imprimir en Hojas de Trabajo</span>
                                            <span className="block text-[11px] text-zinc-500">Incluir esta determinación al imprimir las Hojas de Trabajo.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.resumirWorksheet}
                                            onChange={(e) => setFormData({ ...formData, resumirWorksheet: e.target.checked })}
                                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Resumir en Hojas de Trabajo</span>
                                            <span className="block text-[11px] text-zinc-500">Omitir las subdeterminaciones al imprimir Hojas de Trabajo.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.informarMetodo}
                                            onChange={(e) => setFormData({ ...formData, informarMetodo: e.target.checked })}
                                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Informar Método</span>
                                            <span className="block text-[11px] text-zinc-500">Incluir el nombre del método en el informe final.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.imprimirHistorico}
                                            onChange={(e) => setFormData({ ...formData, imprimirHistorico: e.target.checked })}
                                            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                                        />
                                        <div>
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Imprimir Histórico</span>
                                            <span className="block text-[11px] text-zinc-500">Incluir resultados históricos en el informe de esta determinación.</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">Altura en Hojas de Trab.:</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.alturaWorksheet}
                                            onChange={(e) => setFormData({ ...formData, alturaWorksheet: e.target.value })}
                                            className="w-24 h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-medium"
                                        />
                                        <span className="text-[11px] text-zinc-500">Altura en centímetros</span>
                                    </label>
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
                            form="determination-form"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-bold hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? "Guardando..." : (determination ? "Actualizar" : "Guardar Determinación")}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
