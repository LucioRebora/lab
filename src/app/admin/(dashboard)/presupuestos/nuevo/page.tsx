"use client";
import { toast } from "sonner";

import React, { useState, useEffect, useCallback } from "react";
import { Receipt, Search, Plus, Trash2, Save, ArrowLeft, Beaker, ShieldCheck, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface HealthInsurance {
    id: string;
    nombre: string;
    valorNBU: number;
}

interface Determination {
    id: string;
    codigo: number;
    determinacion: string;
    abreviatura?: string;
    isAdditional: boolean;
}

interface SelectedDetermination extends Determination {
    healthInsuranceId: string;
    healthInsuranceNombre: string;
    valorNBU: number;
    valor: number;
    ub?: number;
}

export default function NewBudgetPage() {
    const router = useRouter();
    const [healthInsurances, setHealthInsurances] = useState<HealthInsurance[]>([]);
    const [determinations, setDeterminations] = useState<Determination[]>([]);
    const [defaultHealthInsuranceId, setDefaultHealthInsuranceId] = useState("");
    const [paciente, setPaciente] = useState("");
    const [telefono, setTelefono] = useState("");
    const [email, setEmail] = useState("");
    const [selectedDeterminations, setSelectedDeterminations] = useState<SelectedDetermination[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    const [showConfirmHIChange, setShowConfirmHIChange] = useState<string | null>(null);
    const [pendingHIChange, setPendingHIChange] = useState<string | null>(null);

    // Patient search states
    const [isExistingPatient, setIsExistingPatient] = useState(false);
    const [patients, setPatients] = useState<any[]>([]);
    const [showPatientList, setShowPatientList] = useState(false);
    const [activePatientIndex, setActivePatientIndex] = useState(0);
    const [searchingPatients, setSearchingPatients] = useState(false);


    // Fetch patients
    const searchExistingPatients = useCallback(async (q: string) => {
        if (!q.trim() || !isExistingPatient) {
            setPatients([]);
            return;
        }
        setSearchingPatients(true);
        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}&laboratoryId=${labId}`);
            if (res.ok) {
                const data = await res.json();
                setPatients(Array.isArray(data) ? data.slice(0, 5) : []);
                setSelectedIndex(0); // For patient list
            }
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setSearchingPatients(false);
        }
    }, [isExistingPatient]);

    useEffect(() => {
        if (!isExistingPatient || paciente.length < 2) {
            setPatients([]);
            return;
        }
        const t = setTimeout(() => {
            searchExistingPatients(paciente);
        }, 400);
        return () => clearTimeout(t);
    }, [paciente, isExistingPatient, searchExistingPatients]);

    const handlePatientSelect = (p: any) => {
        setPaciente(`${p.apellido}, ${p.nombre}`);
        setTelefono(p.telefono || "");
        setEmail(p.email || p.notifiedUser?.email || "");
        
        // Also try to set health insurance if patient has defaults

        if (p.healthInsurances?.length > 0) {
            const def = p.healthInsurances.find((hi: any) => hi.isDefault) || p.healthInsurances[0];
            if (def && healthInsurances.some(h => h.id === def.healthInsuranceId)) {
                setDefaultHealthInsuranceId(def.healthInsuranceId);
            }
        }
        
        setShowPatientList(false);
        setPatients([]);
    };


    // Load health insurances
    useEffect(() => {
        const labId = localStorage.getItem('selectedLaboratoryId') || '';
        fetch(`/api/health-insurances?labId=${labId}&filter=budget`).then(res => res.json()).then(setHealthInsurances);
    }, []);

    // Load determinations
    useEffect(() => {
        if (searchQuery.length < 2) {
            setDeterminations([]);
            return;
        }
        const t = setTimeout(() => {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            fetch(`/api/determinations/search?q=${encodeURIComponent(searchQuery)}&labId=${labId}`)
                .then(async res => {
                    if (!res.ok) {
                        console.error('API Error:', await res.text());
                        return [];
                    }
                    return res.json();
                })
                .then((data) => {
                    setDeterminations(data);
                    setSelectedIndex(0);
                })
                .catch(err => {
                    console.error("Fetch error:", err);
                    setDeterminations([]);
                });
        }, 300);
        return () => clearTimeout(t);
    }, [searchQuery]);

    const activeDefaultHI = healthInsurances.find(h => h.id === defaultHealthInsuranceId);

    const handleHealthInsuranceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newHiId = e.target.value;
        setDefaultHealthInsuranceId(newHiId);

        if (!newHiId) return;

        const hi = healthInsurances.find(h => h.id === newHiId);
        if (!hi) return;

        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const currentAdditionals = selectedDeterminations.filter(s => s.isAdditional);
            
            if (currentAdditionals.length > 0) {
                setPendingHIChange(newHiId);
                setShowConfirmHIChange(newHiId);
                return;
            }

            await applyHIChange(newHiId);
        } catch (error) {
            console.error("Error handling always-add additionals", error);
        }
    };

    const applyHIChange = async (newHiId: string, updateExistingAdditionals = false) => {
        const hi = healthInsurances.find(h => h.id === newHiId);
        if (!hi) return;

        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const currentAdditionals = selectedDeterminations.filter(s => s.isAdditional);
            const existingAdditionalsData: Record<string, { valor: number, ub: number }> = {};

            if (updateExistingAdditionals && currentAdditionals.length > 0) {
                for (const add of currentAdditionals) {
                    try {
                        const priceRes = await fetch(`/api/additionals/${add.id}/price?hiId=${newHiId}&labId=${labId}`);
                        if (priceRes.ok) {
                            const priceData = await priceRes.json();
                            existingAdditionalsData[add.id] = {
                                valor: priceData.price,
                                ub: priceData.ub || 0
                            };
                        }
                    } catch (e) {
                        console.error("Error fetching price for existing additional", e);
                    }
                }
            }

            const res = await fetch(`/api/additionals?laboratoryId=${labId}`);
            if (!res.ok) return;
            const allAdditionals = await res.json();
            const alwaysAdd = allAdditionals.filter((a: any) => a.agregarSiempre);

            const newItems: SelectedDetermination[] = [];

            for (const add of alwaysAdd) {
                try {
                    const priceRes = await fetch(`/api/additionals/${add.id}/price?hiId=${newHiId}&labId=${labId}`);
                    if (priceRes.ok) {
                        const priceData = await priceRes.json();
                        newItems.push({
                            id: add.id,
                            codigo: add.codigo ? parseInt(add.codigo) : 0,
                            determinacion: add.nombre,
                            abreviatura: add.abreviatura,
                            isAdditional: true,
                            ub: priceData.ub || 0,
                            healthInsuranceId: hi.id,
                            healthInsuranceNombre: hi.nombre,
                            valorNBU: hi.valorNBU || 0,
                            valor: priceData.price,
                        });
                    }
                } catch (e) {
                    console.error("Error fetching price for always-add additional", e);
                }
            }

            setSelectedDeterminations(prev => {
                let nextItems = [...prev];

                if (updateExistingAdditionals) {
                    nextItems = nextItems.map(item => {
                        if (item.isAdditional && existingAdditionalsData[item.id]) {
                            return {
                                ...item,
                                healthInsuranceId: hi.id,
                                healthInsuranceNombre: hi.nombre,
                                valorNBU: hi.valorNBU || 0,
                                valor: existingAdditionalsData[item.id].valor,
                                ub: existingAdditionalsData[item.id].ub
                            };
                        }
                        return item;
                    });
                }

                if (newItems.length > 0) {
                    const toAdd = newItems.filter(newItem => !nextItems.some(p => p.id === newItem.id));
                    nextItems = [...nextItems, ...toAdd];
                }

                return nextItems;
            });
        } catch (error) {
            console.error("Error in applyHIChange", error);
        }
    };

    const changeHIForItem = useCallback(async (itemId: string, hiId: string, isAdditional: boolean) => {
        const hi = healthInsurances.find(h => h.id === hiId);
        if (!hi) return;

        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const endpoint = isAdditional ? `/api/additionals/${itemId}/price` : `/api/determinations/${itemId}/price`;
            const res = await fetch(`${endpoint}?hiId=${hiId}&labId=${labId}`);
            if (!res.ok) throw new Error();
            const data = await res.json();

            setSelectedDeterminations(prev => prev.map(s => {
                if (s.id === itemId) {
                    return {
                        ...s,
                        healthInsuranceId: hi.id,
                        healthInsuranceNombre: hi.nombre,
                        valorNBU: hi.valorNBU,
                        valor: data.price,
                        ub: data.ub || 0
                    };
                }
                return s;
            }));
        } catch (error) {
            toast.error("Error al recalcular el precio.");
        }
    }, [healthInsurances]);

    const addDetermination = async (det: Determination) => {
        if (!defaultHealthInsuranceId) {
            toast.error("Por favor selecciona una Obra Social por defecto primero para calcular el valor inicial.");
            return;
        }

        const exists = selectedDeterminations.find(s => s.id === det.id);
        if (exists) return;

        setLoading(true);
        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const endpoint = det.isAdditional ? `/api/additionals/${det.id}/price` : `/api/determinations/${det.id}/price`;
            const res = await fetch(`${endpoint}?hiId=${defaultHealthInsuranceId}&labId=${labId}`);
            if (!res.ok) throw new Error();
            const priceData = await res.json();

            setSelectedDeterminations(prev => [...prev, {
                ...det,
                healthInsuranceId: activeDefaultHI!.id,
                healthInsuranceNombre: activeDefaultHI!.nombre,
                valorNBU: activeDefaultHI!.valorNBU || 0,
                valor: priceData.price,
                ub: priceData.ub || 0
            }]);
            setSearchQuery("");
            setDeterminations([]);
        } catch (error) {
            toast.error("Error al obtener el costo.");
        } finally {
            setLoading(false);
        }
    };

    const removeDetermination = (id: string) => {
        setSelectedDeterminations(prev => prev.filter(s => s.id !== id));
    };

    const total = selectedDeterminations.reduce((acc, s) => acc + s.valor, 0);

    const handleSave = async (andSend = false) => {
        if (selectedDeterminations.length === 0) return;
        if (andSend && !email) {
            toast.error("Para enviar el presupuesto se requiere un email.");
            return;
        }

        setSaving(true);
        if (andSend) setSending(true);

        try {
            const res = await fetch("/api/budgets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paciente,
                    telefono,
                    email,
                    healthInsuranceId: defaultHealthInsuranceId || null,
                    labId: localStorage.getItem('selectedLaboratoryId') || '',
                    total,
                    items: selectedDeterminations.map(s => ({
                        determinationId: s.isAdditional ? null : s.id,
                        additionalId: s.isAdditional ? s.id : null,
                        isAdditional: s.isAdditional,
                        codigo: s.codigo,
                        nombre: s.determinacion,
                        ub: s.ub,
                        healthInsuranceId: s.healthInsuranceId,
                        healthInsuranceNombre: s.healthInsuranceNombre,
                        valor: s.valor
                    }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                const budgetId = data.id;

                if (andSend) {
                    const sendRes = await fetch(`/api/budgets/${budgetId}/send-email`, { method: "POST" });
                    if (!sendRes.ok) {
                        toast.error("Presupuesto guardado pero hubo un error al enviar el email.");
                    }
                }

                router.push("/admin/presupuestos");
                router.refresh();
            } else {
                toast.error("Error al guardar el presupuesto.");
            }
        } catch (error) {
            toast.error("Error de conexión al servidor.");
        } finally {
            setSaving(false);
            setSending(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-5">
                <div className="flex items-center gap-4">
                    <Link href="/admin/presupuestos" className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 transition-colors shrink-0">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Nuevo Presupuesto</h1>
                        <p className="text-xs md:text-sm text-zinc-500 font-medium tracking-tight">Cruce de determinaciones y obras sociales / prepagas</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={() => handleSave(false)}
                        disabled={saving || selectedDeterminations.length === 0}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-2xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                        {saving && !sending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={saving || selectedDeterminations.length === 0}
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                    >
                        {sending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                        Guardar y Enviar
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Config */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Paciente y Obra Social */}
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-4xl border border-zinc-100 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-zinc-400 pb-1">
                                <ShieldCheck size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Información del Solicitante</span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-fit">
                                    <button
                                        onClick={() => {
                                            setIsExistingPatient(false);
                                            setPatients([]);
                                        }}
                                        className={cn(
                                            "px-4 py-1 text-[10px] font-bold rounded-lg transition-all",
                                            !isExistingPatient ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                        )}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        onClick={() => setIsExistingPatient(true)}
                                        className={cn(
                                            "px-4 py-1 text-[10px] font-bold rounded-lg transition-all",
                                            isExistingPatient ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
                                        )}
                                    >
                                        Existente
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        setPaciente("");
                                        setTelefono("");
                                        setEmail("");
                                        setPatients([]);
                                    }}
                                    className="text-[10px] font-bold text-zinc-300 hover:text-rose-500 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                >
                                    <Trash2 size={10} />
                                    Limpiar
                                </button>
                            </div>

                        </div>


                        <div className="space-y-1.5 relative">
                            <label className="text-sm font-medium text-zinc-500">
                                {isExistingPatient ? "Buscar Paciente" : "Nombre del Paciente"}
                            </label>
                            <div className="relative group">
                                {isExistingPatient && (
                                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
                                )}
                                <input
                                    value={paciente}
                                    onChange={(e) => {
                                        setPaciente(e.target.value);
                                        if (isExistingPatient) setShowPatientList(true);
                                    }}
                                    onFocus={() => {
                                        if (isExistingPatient) setShowPatientList(true);
                                    }}
                                    onKeyDown={(e) => {
                                        if (!isExistingPatient || patients.length === 0) return;
                                        if (e.key === "ArrowDown") {
                                            e.preventDefault();
                                            setActivePatientIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
                                        } else if (e.key === "ArrowUp") {
                                            e.preventDefault();
                                            setActivePatientIndex(prev => (prev > 0 ? prev - 1 : 0));
                                        } else if (e.key === "Enter") {
                                            e.preventDefault();
                                            handlePatientSelect(patients[activePatientIndex]);
                                        } else if (e.key === "Escape") {
                                            setShowPatientList(false);
                                        }
                                    }}
                                    placeholder={isExistingPatient ? "DNI, Apellido o Nombre..." : "Ej: Juan Pérez"}
                                    className={cn(
                                        "w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400",
                                        isExistingPatient && "pl-10"
                                    )}
                                />
                                {searchingPatients && (
                                    <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin" />
                                )}
                            </div>

                            {/* Patient Search Results */}
                            <AnimatePresence>
                                {isExistingPatient && showPatientList && patients.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-1.5"
                                    >
                                        {patients.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                onClick={() => handlePatientSelect(p)}
                                                onMouseEnter={() => setActivePatientIndex(idx)}
                                                className={cn(
                                                    "p-2.5 rounded-xl cursor-pointer transition-colors",
                                                    activePatientIndex === idx ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                )}
                                            >
                                                <div className={cn("text-xs font-bold", activePatientIndex === idx ? "text-blue-600" : "text-zinc-800 dark:text-zinc-200")}>
                                                    {p.apellido}, {p.nombre}
                                                </div>
                                                <div className="text-[10px] text-zinc-400 font-medium">
                                                    DNI: {p.documento} {p.email && `• ${p.email}`}
                                                </div>
                                            </div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {isExistingPatient && showPatientList && (
                                <div className="fixed inset-0 z-40" onClick={() => setShowPatientList(false)} />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-500">Teléfono</label>
                            <input
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                placeholder="Ej: 11 1234 5678"
                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-500">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Ej: paciente@mail.com"
                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                            />
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-sm font-medium text-zinc-500">Obra Social / Prepaga por defecto</label>
                            <select
                                value={defaultHealthInsuranceId}
                                onChange={handleHealthInsuranceChange}
                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Seleccionar OS / Prepaga...</option>
                                {healthInsurances.map(hi => (
                                    <option key={hi.id} value={hi.id}>{hi.nombre} (NBU: ${hi.valorNBU || 0})</option>
                                ))}
                            </select>
                            <p className="text-[10px] text-zinc-400 mt-1 italic">Esta OS se asignará a las nuevas determinaciones que agregues.</p>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="bg-black text-white p-8 rounded-4xl shadow-xl space-y-6">
                        <div className="space-y-1">
                            <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Estimado</span>
                            <div className="text-4xl font-bold tracking-tight">
                                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <div className="flex justify-between text-sm text-zinc-400">
                                <span>Total Determinaciones</span>
                                <span>{selectedDeterminations.length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Items */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Add Determination */}
                    <div className="relative">
                        <div className="relative">
                            <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        setSelectedIndex(prev => (prev < determinations.length - 1 ? prev + 1 : prev));
                                    } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
                                    } else if (e.key === 'Enter' && determinations.length > 0 && selectedIndex >= 0) {
                                        e.preventDefault();
                                        addDetermination(determinations[selectedIndex]);
                                    }
                                }}
                                placeholder="Buscar determinación por nombre o código..."
                                className="w-full h-14 pl-14 pr-6 bg-white dark:bg-zinc-900 border-2 border-transparent focus:border-zinc-900 dark:focus:border-white/20 rounded-3xl text-base shadow-sm outline-none transition-all"
                            />
                        </div>

                        {/* Dropdown Results */}
                        <AnimatePresence>
                            {determinations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl z-10 max-h-64 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar"
                                >
                                    {determinations.map((det, index) => (
                                        <button
                                            key={det.id}
                                            onClick={() => addDetermination(det)}
                                            onMouseMove={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-2xl transition-colors text-left",
                                                index === selectedIndex ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                det.isAdditional ? "bg-amber-50 dark:bg-amber-500/10" : "bg-zinc-100 dark:bg-zinc-800"
                                            )}>
                                                <Beaker size={16} className={cn(det.isAdditional ? "text-amber-500" : "text-zinc-500")} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold border border-blue-100 dark:border-blue-800/30 font-mono">
                                                        {det.codigo}
                                                    </span>
                                                    <span className="text-sm font-bold truncate text-zinc-900 dark:text-zinc-100">
                                                        {det.determinacion}
                                                        {det.isAdditional && (
                                                            <span className="ml-2 text-[8px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800/30">
                                                                Adicional
                                                            </span>
                                                        )}
                                                        {det.abreviatura && (
                                                            <span className="ml-2 text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                                                ({det.abreviatura})
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <Plus size={16} className="text-zinc-300 mr-2" />
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* List of determination items */}
                    <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800 shadow-sm min-h-[400px]">
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <h3 className="font-bold flex items-center gap-2">
                                <Receipt size={16} className="text-zinc-400" />
                                Detalle de Determinaciones
                            </h3>
                        </div>

                        <div className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                            {selectedDeterminations.length > 0 ? (
                                selectedDeterminations.map((item) => (
                                    <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-zinc-50/50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-400 font-mono text-[10px]">
                                            {item.codigo}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold truncate leading-tight flex items-center gap-2">
                                                {item.determinacion}
                                                {item.isAdditional && (
                                                    <span className="text-[8px] px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800/30">
                                                        Adicional
                                                    </span>
                                                )}
                                                {item.abreviatura && (
                                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                                                        ({item.abreviatura})
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-1">
                                                <select
                                                    value={item.healthInsuranceId}
                                                    onChange={(e) => changeHIForItem(item.id, e.target.value, item.isAdditional)}
                                                    className="bg-transparent text-[11px] font-bold text-zinc-400 outline-none hover:text-zinc-600 transition-colors cursor-pointer"
                                                >
                                                    {healthInsurances.map(hi => (
                                                        <option key={hi.id} value={hi.id}>{hi.nombre} (NBU: ${hi.valorNBU || 0})</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end justify-center">
                                            <div className="text-sm font-bold font-mono">
                                                ${item.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeDetermination(item.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all ml-2"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                                        <Beaker size={32} />
                                    </div>
                                    <div className="max-w-[240px] mx-auto">
                                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Empezá a agregar determinaciones</p>
                                        <p className="text-xs text-zinc-400 mt-1">Buscá los análisis arriba por nombre o código para incluirlos en el presupuesto.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e4e4e7;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                }
            `}</style>

            <ConfirmModal 
                open={!!showConfirmHIChange}
                onClose={() => {
                    if (pendingHIChange) applyHIChange(pendingHIChange, false);
                    setShowConfirmHIChange(null);
                    setPendingHIChange(null);
                }}
                onConfirm={() => {
                    if (pendingHIChange) applyHIChange(pendingHIChange, true);
                    setShowConfirmHIChange(null);
                    setPendingHIChange(null);
                }}
                title="Actualizar Adicionales"
                description="¿Desea cambiar la Obra Social de los adicionales ya agregados a la que acaba de seleccionar?"
                confirmLabel="Actualizar"
                cancelLabel="Mantener actuales"
                variant="info"
            />
        </div>
    );
}
