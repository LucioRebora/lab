"use client";

import React, { useEffect, useState } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface SubDetermination {
    id: string;
    nombre: string;
    codigoExterno?: string | null;
    determinationId: string;
    unitId?: string | null;
    formato?: string | null;
    calcular: boolean;
    informar: boolean;
    informar2C: boolean;
    informarTextoAntes?: string | null;
    informarCorteDespues: boolean;
    informarVR: boolean;
    valorMinimo?: string | null;
    valorMaximo?: string | null;
    codManlab?: string | null;
    activa: boolean;
    determination?: {
        nombre: string;
    };
    unit?: {
        nombre: string;
    };
}

interface Props {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
    subDetermination: SubDetermination | null;
}

export function SubDeterminationModal({ open, onClose, onSaved, subDetermination }: Props) {
    const [formData, setFormData] = useState<Partial<SubDetermination>>({
        nombre: "",
        codigoExterno: "",
        determinationId: "",
        unitId: "",
        formato: "D2",
        calcular: false,
        informar: true,
        informar2C: false,
        informarTextoAntes: "",
        informarCorteDespues: false,
        informarVR: true,
        valorMinimo: "",
        valorMaximo: "",
        codManlab: "",
        activa: true,
    });

    const [determinations, setDeterminations] = useState<any[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchLists();
            if (subDetermination) {
                setFormData(subDetermination);
            } else {
                setFormData({
                    nombre: "",
                    codigoExterno: "",
                    determinationId: "",
                    unitId: "",
                    formato: "D2",
                    calcular: false,
                    informar: true,
                    informar2C: false,
                    informarTextoAntes: "",
                    informarCorteDespues: false,
                    informarVR: true,
                    valorMinimo: "",
                    valorMaximo: "",
                    codManlab: "",
                    activa: true,
                });
            }
        }
    }, [open, subDetermination]);

    const fetchLists = async () => {
        try {
            const [detRes, unitRes] = await Promise.all([
                fetch("/api/determinations"),
                fetch("/api/units")
            ]);
            if (detRes.ok) setDeterminations(await detRes.json());
            if (unitRes.ok) setUnits(await unitRes.json());
        } catch (error) {
            console.error("Error fetching lists", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const laboratoryId = localStorage.getItem("selectedLaboratoryId");

        try {
            const url = subDetermination
                ? `/api/sub-determinations/${subDetermination.id}`
                : "/api/sub-determinations";
            const method = subDetermination ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, laboratoryId }),
            });

            if (!res.ok) throw new Error("Error al guardar");

            toast.success(subDetermination ? "Actualizado correctamente" : "Creado correctamente");
            onSaved();
            onClose();
        } catch (error) {
            toast.error("Ocurrió un error al guardar");
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {subDetermination ? "Editar Sub-Determinación" : "Nueva Sub-Determinación"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Estado Toggle */}
                    <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Estado de la Sub-Determinación</h4>
                            <p className="text-xs text-zinc-500">Define si este componente analítico está activo.</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nombre */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Nombre</label>
                            <input
                                required
                                value={formData.nombre || ""}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                placeholder="Ej: Resultado"
                            />
                        </div>

                        {/* Cod ManLab */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Cod ManLab</label>
                            <input
                                value={formData.codManlab || ""}
                                onChange={(e) => setFormData({ ...formData, codManlab: e.target.value.substring(0, 6).toUpperCase() })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                placeholder="6 chars"
                                maxLength={6}
                            />
                        </div>

                        {/* Código Externo (Hidden) */}
                        <input
                            type="hidden"
                            value={formData.codigoExterno || ""}
                        />

                        {/* Determinación Padre */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Determinación Padre</label>
                            <select
                                required
                                value={formData.determinationId || ""}
                                onChange={(e) => setFormData({ ...formData, determinationId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            >
                                <option value="">Seleccionar...</option>
                                {determinations.map((d) => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Unidad */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Unidad</label>
                            <select
                                value={formData.unitId || ""}
                                onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            >
                                <option value="">Sin unidad</option>
                                {units.map((u) => (
                                    <option key={u.id} value={u.id}>{u.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Formato */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Formato</label>
                            <select
                                value={formData.formato || ""}
                                onChange={(e) => setFormData({ ...formData, formato: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            >
                                <option value="TXT">Texto</option>
                                <option value="D0">Decimales 0</option>
                                <option value="D1">Decimales 1</option>
                                <option value="D2">Decimales 2</option>
                                <option value="D3">Decimales 3</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Prefijo (Texto antes)</label>
                            <input
                                value={formData.informarTextoAntes || ""}
                                onChange={(e) => setFormData({ ...formData, informarTextoAntes: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.informar}
                                onChange={(e) => setFormData({ ...formData, informar: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Informar</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.calcular}
                                onChange={(e) => setFormData({ ...formData, calcular: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Calcular</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.informarVR}
                                onChange={(e) => setFormData({ ...formData, informarVR: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Informar VR</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.informarCorteDespues}
                                onChange={(e) => setFormData({ ...formData, informarCorteDespues: e.target.checked })}
                                className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">Salto Línea</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Alerta con Limite Mínimo</label>
                            <input
                                value={formData.valorMinimo || ""}
                                onChange={(e) => setFormData({ ...formData, valorMinimo: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Alerta con Valor Máximo</label>
                            <input
                                value={formData.valorMaximo || ""}
                                onChange={(e) => setFormData({ ...formData, valorMaximo: e.target.value })}
                                className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-8 py-2.5 bg-violet-600 text-white rounded-2xl text-sm font-bold hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50"
                        >
                            {loading ? "Guardando..." : (
                                <>
                                    <Save size={18} />
                                    Guardar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
