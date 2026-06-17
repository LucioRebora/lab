"use client";

import React, { useEffect, useState } from "react";
import { Search, Calculator, Save, Beaker, Layers, ChevronDown, ChevronRight, Filter, ExternalLink, PlusSquare, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface HealthInsurance {
    id: string;
    nombre: string;
    valorNBU: number;
}

interface Determination {
    id: string;
    nombre: string;
    codigo: string | null;
    ub: number;
    subDeterminations: any[];
}

interface Additional {
    id: string;
    nombre: string;
    codigo: string | null;
}

interface PriceConfig {
    determinationId?: string;
    additionalId?: string;
    cantidadNBU?: number;
    montoFijo: number;
    precio?: number;
    porcentajeSP?: number;
    enLista: boolean;
}

export default function PriceListPage() {
    const [activeTab, setActiveTab] = useState<"determinations" | "additionals">("determinations");
    const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
    const [determinations, setDeterminations] = useState<Determination[]>([]);
    const [additionals, setAdditionals] = useState<Additional[]>([]);
    const [selectedOS, setSelectedOS] = useState<string>("");
    const [prices, setPrices] = useState<Record<string, PriceConfig>>({});
    const [additionalPrices, setAdditionalPrices] = useState<Record<string, PriceConfig>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedDets, setExpandedDets] = useState<Set<string>>(new Set());
    const [osNbuValue, setOsNbuValue] = useState<number>(0);
    const [savingOS, setSavingOS] = useState(false);
    const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
    const [hideZeros, setHideZeros] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        const labId = localStorage.getItem('selectedLaboratoryId') || (session?.user as any)?.laboratoryId;
        setSelectedLabId(labId);

        const handleLabChange = () => {
            const newLabId = localStorage.getItem('selectedLaboratoryId');
            setSelectedLabId(newLabId);
        };

        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const loadInitialData = async () => {
        if (!selectedLabId) return;
        setLoading(true);
        try {
            const query = `?laboratoryId=${selectedLabId}`;
            const [osRes, detRes, addRes] = await Promise.all([
                fetch(`/api/health-insurances${query}`),
                fetch(`/api/determinations${query}`),
                fetch(`/api/additionals${query}`)
            ]);

            if (osRes.ok) setHealthInsurances(await osRes.json());
            if (detRes.ok) setDeterminations(await detRes.json());
            if (addRes.ok) setAdditionals(await addRes.json());
        } catch (error) {
            toast.error("Error al cargar datos iniciales");
        } finally {
            setLoading(false);
        }
    };

    const loadPrices = async (osId: string) => {
        if (!osId || !selectedLabId) return;
        try {
            const [priceRes, addPriceRes] = await Promise.all([
                fetch(`/api/prices-os?healthInsuranceId=${osId}&type=determinations&laboratoryId=${selectedLabId}`),
                fetch(`/api/prices-os?healthInsuranceId=${osId}&type=additionals&laboratoryId=${selectedLabId}`)
            ]);

            if (priceRes.ok) {
                const data = await priceRes.json();
                const priceMap: Record<string, PriceConfig> = {};
                data.forEach((p: any) => { priceMap[p.determinationId] = p; });
                setPrices(priceMap);
            }

            if (addPriceRes.ok) {
                const data = await addPriceRes.json();
                const addPriceMap: Record<string, PriceConfig> = {};
                data.forEach((p: any) => { addPriceMap[p.additionalId] = p; });
                setAdditionalPrices(addPriceMap);
            }
        } catch (error) {
            console.error("Error loading prices", error);
        }
    };

    useEffect(() => {
        if (selectedLabId) {
            loadInitialData();
            setSelectedOS(""); // Reset selection on lab change
        }
    }, [selectedLabId]);

    useEffect(() => {
        if (selectedOS) {
            loadPrices(selectedOS);
            const os = healthInsurances.find(o => o.id === selectedOS);
            setOsNbuValue(os?.valorNBU || 0);
        } else {
            setPrices({});
            setAdditionalPrices({});
            setOsNbuValue(0);
        }
    }, [selectedOS, healthInsurances]);

    const handlePriceChange = (id: string, field: keyof PriceConfig, value: any, isAdditional: boolean = false) => {
        const setFn = isAdditional ? setAdditionalPrices : setPrices;
        setFn(prev => ({
            ...prev,
            [id]: {
                ...(prev[id] || (isAdditional 
                    ? { additionalId: id, montoFijo: 0, porcentajeSP: 0, enLista: true }
                    : { determinationId: id, cantidadNBU: 0, montoFijo: 0, precio: 0, enLista: true })),
                [field]: value
            }
        }));
    };

    const savePrice = async (id: string, isAdditional: boolean = false) => {
        if (!selectedOS) return;
        setSaving(id);
        const config = (isAdditional ? additionalPrices[id] : prices[id]) || 
            (isAdditional 
                ? { additionalId: id, montoFijo: 0, porcentajeSP: 0, enLista: true }
                : { determinationId: id, cantidadNBU: 0, montoFijo: 0, precio: 0, enLista: true });
        
        try {
            const res = await fetch("/api/prices-os", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...config,
                    healthInsuranceId: selectedOS,
                    type: isAdditional ? "additionals" : "determinations",
                    laboratoryId: selectedLabId
                })
            });

            if (!res.ok) throw new Error("Error al guardar");
            toast.success("Precio guardado");
        } catch (error) {
            toast.error("Error al guardar el precio");
        } finally {
            setSaving(null);
        }
    };

    const saveOSNbu = async () => {
        if (!selectedOS) return;
        setShowConfirmModal(true);
    };

    const executeSaveOSNbu = async (propagate: boolean) => {
        setSavingOS(true);
        try {
            const res = await fetch(`/api/health-insurances/${selectedOS}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    valorNBU: osNbuValue,
                    propagateNBU: propagate
                })
            });

            if (!res.ok) throw new Error("Error al guardar");
            toast.success(propagate ? "Valor NBU y precios actualizados" : "Valor NBU actualizado");
            
            // Refresh local list
            setHealthInsurances(prev => prev.map(os => os.id === selectedOS ? { ...os, valorNBU: osNbuValue } : os));
            
            // If propagated, we need to refresh the prices on the screen
            if (propagate) {
                await loadPrices(selectedOS);
            }
        } catch (error) {
            toast.error("Error al actualizar valor NBU");
        } finally {
            setSavingOS(false);
            setShowConfirmModal(false);
        }
    };

    const calculateFromNBU = (detId: string) => {
        const det = determinations.find(d => d.id === detId);
        if (!det) return;

        const config = prices[detId] || { determinationId: detId, cantidadNBU: det.ub || 0, montoFijo: 0, precio: 0, enLista: true };
        const currentNbu = config.cantidadNBU ?? (det.ub || 0);
        const cantidadNBU = currentNbu !== 0 ? currentNbu : (det.ub || 0);
        
        const newPrecio = (cantidadNBU * osNbuValue) + (config.montoFijo || 0);
        
        handlePriceChange(detId, "cantidadNBU", cantidadNBU);
        handlePriceChange(detId, "precio", newPrecio);
    };

    const filteredDeterminations = determinations.filter(d => {
        const matchesSearch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
            
        if (!hideZeros) return matchesSearch;
        
        const config = prices[d.id];
        const hasNbuValue = config && config.cantidadNBU !== 0;
        return matchesSearch && hasNbuValue;
    });

    const filteredAdditionals = additionals.filter(a => 
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedDets);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedDets(newSet);
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 w-full overflow-x-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                        <Calculator size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Lista de Precios</h1>
                        <p className="text-sm text-zinc-500 font-medium">Gestiona aranceles por obra social</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative w-full sm:w-64">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <select
                            value={selectedOS}
                            onChange={(e) => setSelectedOS(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm appearance-none cursor-pointer font-bold"
                        >
                            <option value="">Seleccionar Obra Social...</option>
                            {healthInsurances.map(os => (
                                <option key={os.id} value={os.id}>{os.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full sm:w-64 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {selectedOS && (
                <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center text-violet-500 shadow-sm border border-violet-100 dark:border-violet-800">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Configuración de {healthInsurances.find(o => o.id === selectedOS)?.nombre}</h4>
                            <p className="text-xs text-zinc-500 italic">El valor NBU se utiliza para cálculos automáticos.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 ml-1">Valor NBU ($)</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={osNbuValue}
                                    onChange={(e) => setOsNbuValue(parseFloat(e.target.value) || 0)}
                                    className="w-32 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button
                                    onClick={saveOSNbu}
                                    disabled={savingOS}
                                    className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {savingOS ? "..." : <Save size={16} />}
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!selectedOS ? (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-4xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-20 text-center">
                    <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Calculator className="text-zinc-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Selecciona una Obra Social</h3>
                    <p className="text-sm text-zinc-500 max-w-xs mx-auto">Para comenzar a administrar los precios, elige una obra social del menú superior.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pr-4">
                        <div className="flex">
                        <button
                            onClick={() => setActiveTab("determinations")}
                            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === "determinations" ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Beaker size={16} />
                                Determinaciones
                            </div>
                            {activeTab === "determinations" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("additionals")}
                            className={`px-8 py-4 text-sm font-bold transition-all relative ${activeTab === "additionals" ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            <div className="flex items-center gap-2">
                                <PlusSquare size={16} />
                                Adicionales
                            </div>
                            {activeTab === "additionals" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400" />}
                        </button>
                        </div>
                        
                        {activeTab === "determinations" && (
                            <div className="flex items-center gap-2 px-4 py-2">
                                <input
                                    type="checkbox"
                                    id="hideZeros"
                                    checked={hideZeros}
                                    onChange={(e) => setHideZeros(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                />
                                <label htmlFor="hideZeros" className="text-sm font-bold text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                                    Ocultar NBU = 0
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto w-full custom-scrollbar">
                            {activeTab === "determinations" ? (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-12 text-center">#</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Estudio</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-32 text-center">Cant. NBU</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-32 text-center">Monto Fijo</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-40 text-center">Precio Final</th>
                                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400 w-24">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {filteredDeterminations.map((det) => {
                                            const config = prices[det.id] || { determinationId: det.id, cantidadNBU: 0, montoFijo: 0, precio: 0, enLista: true };
                                            const isExpanded = expandedDets.has(det.id);

                                            return (
                                                <React.Fragment key={det.id}>
                                                    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                                        <td className="px-6 py-4 text-center">
                                                            <button onClick={() => toggleExpand(det.id)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                            </button>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-zinc-900 dark:text-zinc-100">{det.nombre}</span>
                                                                <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">{det.codigo || "(sin código)"}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                value={config.cantidadNBU}
                                                                onChange={(e) => handlePriceChange(det.id, "cantidadNBU", parseFloat(e.target.value) || 0)}
                                                                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-center outline-none focus:ring-2 focus:ring-violet-500 mx-auto block"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input
                                                                type="number"
                                                                value={config.montoFijo}
                                                                onChange={(e) => handlePriceChange(det.id, "montoFijo", parseFloat(e.target.value) || 0)}
                                                                className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-center outline-none focus:ring-2 focus:ring-violet-500 mx-auto block"
                                                            />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={config.precio}
                                                                    onChange={(e) => handlePriceChange(det.id, "precio", parseFloat(e.target.value) || 0)}
                                                                    className="w-32 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50 rounded-xl text-sm font-bold text-violet-600 dark:text-violet-400 text-center outline-none focus:ring-2 focus:ring-violet-500"
                                                                />
                                                                <button
                                                                    onClick={() => calculateFromNBU(det.id)}
                                                                    title="Calcular desde NBU"
                                                                    className="p-1.5 text-zinc-400 hover:text-violet-500 transition-colors"
                                                                >
                                                                    <Calculator size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => savePrice(det.id)}
                                                                disabled={saving === det.id}
                                                                className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50 shadow-sm"
                                                            >
                                                                {saving === det.id ? "..." : <Save size={14} />}
                                                                Guardar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {isExpanded && (
                                                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/10">
                                                            <td colSpan={7} className="px-12 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                                                                <div className="flex items-center gap-2 text-zinc-500 mb-3 px-2">
                                                                    <Layers size={14} />
                                                                    <span className="text-[11px] font-bold uppercase tracking-wider">Sub-determinaciones</span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                                    {det.subDeterminations?.length > 0 ? det.subDeterminations.map((sub: any) => (
                                                                        <div key={sub.id} className="p-3 bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl flex items-center justify-between shadow-sm">
                                                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{sub.nombre}</span>
                                                                            <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-500">{sub.activa ? 'ACT' : 'INA'}</span>
                                                                        </div>
                                                                    )) : (
                                                                        <p className="text-[11px] text-zinc-400 italic col-span-full">Sin sub-determinaciones configuradas.</p>
                                                                    )}
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                                                                    <button 
                                                                        onClick={() => router.push(`/admin/sub-determinaciones?determinationId=${det.id}`)}
                                                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                                                                    >
                                                                        Ir a configuración detallada
                                                                        <ExternalLink size={12} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-12 text-center">#</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Adicional</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-32 text-center">Monto Fijo</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-32 text-center">Porcentaje (%)</th>
                                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-32 text-center">En Lista</th>
                                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400 w-24">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                        {filteredAdditionals.map((add, idx) => {
                                            const config = additionalPrices[add.id] || { additionalId: add.id, montoFijo: 0, porcentajeSP: 0, enLista: true };
                                            return (
                                                <tr key={add.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                                    <td className="px-6 py-4 text-center text-zinc-300 font-mono text-xs">{idx + 1}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-900 dark:text-zinc-100">{add.nombre}</span>
                                                            <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">{add.codigo || "(sin código)"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            value={config.montoFijo}
                                                            onChange={(e) => handlePriceChange(add.id, "montoFijo", parseFloat(e.target.value) || 0, true)}
                                                            className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-center outline-none focus:ring-2 focus:ring-violet-500 mx-auto block"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <input
                                                            type="number"
                                                            value={config.porcentajeSP}
                                                            onChange={(e) => handlePriceChange(add.id, "porcentajeSP", parseFloat(e.target.value) || 0, true)}
                                                            className="w-24 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-center outline-none focus:ring-2 focus:ring-violet-500 mx-auto block"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={config.enLista}
                                                            onChange={(e) => handlePriceChange(add.id, "enLista", e.target.checked, true)}
                                                            className="w-4 h-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => savePrice(add.id, true)}
                                                            disabled={saving === add.id}
                                                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all disabled:opacity-50 shadow-sm"
                                                        >
                                                            {saving === add.id ? "..." : <Save size={14} />}
                                                            Guardar
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                open={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={() => executeSaveOSNbu(true)}
                onCancel={() => executeSaveOSNbu(false)}
                title="¿Actualizar todos los valores?"
                description="Se recalcularán los precios de todas las determinaciones multiplicando su cantidad de NBU por el nuevo valor. <br/><br/><b>'Si, actualizar todo'</b> recalcula todo.<br/><b>'Solo NBU'</b> únicamente cambiará el valor base."
                confirmLabel="Si, actualizar todo"
                cancelLabel="Solo NBU"
                variant="info"
                loading={savingOS}
            />
            {/* We might need a second button for 'No' but currently ConfirmModal has Cancel/Confirm. 
                Wait, if 'Cancel' means 'Solo NBU', then I should probably update the onClose logic.
                Actually, I'll pass a custom logic if needed.
            */}
        </div>
    );
}
