"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, Mail, Calendar, Hash, UserCircle, Phone, Info, MapPin, Plus, Trash2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HealthInsuranceModal } from "./HealthInsuranceModal";
import { Alert } from "@/components/ui/Alert";

export interface Patient {
    id: string;
    apellido: string;
    nombre: string;
    sexo: string;
    tipoDocumento: string;
    documento: string;
    fechaNacimiento: string; // ISO String
    edad: number | null;
    telefono: string | null;
    email: string | null;
    direccion?: string | null;
    entreCalles?: string | null;
    ciudad?: string | null;
    provincia?: string | null;
    codigoPostal?: string | null;
    healthInsurances?: Array<{
        id?: string;
        healthInsuranceId: string;
        nroAfiliado: string | null;
        isDefault: boolean;
        healthInsurance?: { nombre: string };
    }>;
    notifiedUserId?: string | null;
    notifiedUser?: {
        id: string;
        apellido: string;
        nombre: string | null;
        email: string;
        enviarUnaCopia: boolean;
    } | null;
    codigoExterno?: string | null;
    laboratoryId: string | null;
    createdAt?: string;
    updatedAt?: string;
}

interface PatientModalProps {
    open: boolean;
    onClose: () => void;
    patient?: Patient | null;
    laboratoryId?: string;
    onSaved: (p: Patient) => void;
}

export function PatientModal({ open, onClose, patient, laboratoryId, onSaved }: PatientModalProps) {
    const defaultData = {
        apellido: "",
        nombre: "",
        sexo: "F",
        tipoDocumento: "DNI",
        documento: "",
        fechaNacimiento: "",
        edad: "",
        telefonoPais: "+54 9",
        telefonoArea: "3446",
        telefonoNumero: "",
        email: "",
        direccion: "",
        entreCalles: "",
        ciudad: "",
        provincia: "",
        codigoPostal: "",
        showDireccion: false,
        healthInsurances: [],
        enviarNotificacionOtro: false,
        notifiedUserId: "",
        codigoExterno: ""
    } as any;

    const [formData, setFormData] = useState<any>(defaultData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState<{ [key: string]: string }>({});
    const [healthInsurances, setHealthInsurances] = useState<any[]>([]);
    const [notifiedUsers, setNotifiedUsers] = useState<any[]>([]);
    const [showHealthInsuranceModal, setShowHealthInsuranceModal] = useState(false);
    const [searchUser, setSearchUser] = useState("");
    const [showUserList, setShowUserList] = useState(false);

    const loadHealthInsurances = () => {
        if (!laboratoryId) return;
        fetch("/api/health-insurances?laboratoryId=" + laboratoryId)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setHealthInsurances(data);
            }).catch(err => console.error("Failed to load health insurances:", err));
    };

    useEffect(() => {
        if (!open || !laboratoryId) return;

        const loadNotifiedUsers = async () => {
            try {
                const url = new URL("/api/notified-users", window.location.origin);
                url.searchParams.set("laboratoryId", laboratoryId);
                if (searchUser) url.searchParams.set("q", searchUser);

                const res = await fetch(url.toString());
                const data = await res.json();
                if (Array.isArray(data)) setNotifiedUsers(data);
            } catch (err) {
                console.error("Failed to load notified users:", err);
            }
        };

        const t = setTimeout(loadNotifiedUsers, 300);
        return () => clearTimeout(t);
    }, [open, laboratoryId, searchUser]);

    useEffect(() => {
        if (open && laboratoryId) {
            setSearchUser("");
            loadHealthInsurances();
            fetch(`/api/settings?laboratoryId=${laboratoryId}`)
                .then(res => res.json())
                .then(data => {
                    setSettings(data);
                }).catch(err => console.error("Failed to load settings:", err));
        }
    }, [open, laboratoryId]);

    useEffect(() => {
        if (open) {
            if (patient) {
                let tPais = settings["DEFAULT_PHONE_COUNTRY"] || "+54 9";
                let tArea = settings["DEFAULT_PHONE_AREA"] || "3446";
                let tNum = "";
                if (patient.telefono) {
                    const t = patient.telefono;
                    if (t.startsWith("+5493446")) { tNum = t.slice(8); }
                    else if (t.startsWith("+543446")) { tNum = t.slice(7); }
                    else if (t.startsWith("+54")) {
                        const rest = t.slice(3).replace(/^9/, '');
                        tArea = rest.slice(0, 4);
                        tNum = rest.slice(4);
                    } else {
                        tNum = t;
                        tPais = "";
                        tArea = "";
                    }
                }

                setFormData({
                    apellido: patient.apellido,
                    nombre: patient.nombre,
                    sexo: patient.sexo,
                    tipoDocumento: patient.tipoDocumento,
                    documento: patient.documento || "",
                    fechaNacimiento: patient.fechaNacimiento ? new Date(patient.fechaNacimiento).toISOString().split('T')[0] : "",
                    edad: patient.edad?.toString() || "",
                    telefonoPais: tPais,
                    telefonoArea: tArea,
                    telefonoNumero: tNum,
                    email: patient.email || "",
                    direccion: patient.direccion || "",
                    entreCalles: patient.entreCalles || "",
                    ciudad: patient.ciudad || "",
                    provincia: patient.provincia || "",
                    codigoPostal: patient.codigoPostal || "",
                    healthInsurances: patient.healthInsurances || [],
                    showDireccion: !!(patient.direccion || patient.ciudad || patient.provincia),
                    enviarNotificacionOtro: !!patient.notifiedUserId,
                    notifiedUserId: patient.notifiedUserId || "",
                    codigoExterno: patient.codigoExterno || ""
                });
                if (patient.notifiedUser) {
                    setSearchUser(`${patient.notifiedUser.apellido}, ${patient.notifiedUser.nombre || ''}`);
                }
            } else {
                setFormData({
                    ...defaultData,
                    telefonoPais: settings["DEFAULT_PHONE_COUNTRY"] || "+54 9",
                    telefonoArea: settings["DEFAULT_PHONE_AREA"] || "3446",
                });
            }
            setError("");
        }
    }, [open, patient, settings]);

    useEffect(() => {
        if (formData.fechaNacimiento) {
            const today = new Date();
            const birthData = formData.fechaNacimiento.split('-');
            if (birthData.length !== 3) return;

            const birth = new Date(parseInt(birthData[0]), parseInt(birthData[1]) - 1, parseInt(birthData[2]));
            if (isNaN(birth.getTime())) return;

            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }

            if (age >= 0 && age.toString() !== formData.edad) {
                setFormData((prev: any) => ({ ...prev, edad: age.toString() }));
            }
        }
    }, [formData.fechaNacimiento]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const endpoint = patient ? `/api/patients/${patient.id}` : "/api/patients";
            const method = patient ? "PATCH" : "POST";

            let normalizedTelefono = null;
            if (formData.telefonoNumero) {
                const pais = formData.telefonoPais.replace(/[^\d+]/g, ''); // "+549" if "+54 9"
                const area = formData.telefonoArea.replace(/\D/g, '');
                let numero = formData.telefonoNumero.replace(/\D/g, '');

                // Construct normalized: add 9 for mobile in Argentina if not present
                const hasNine = pais === '+549' || pais === '+54' && false; // already has 9 if +54 9
                normalizedTelefono = `${pais === '+54' ? '+549' : pais}${area}${numero}`;
            }

            const payload = {
                apellido: formData.apellido,
                nombre: formData.nombre,
                sexo: formData.sexo,
                tipoDocumento: formData.tipoDocumento,
                documento: formData.documento,
                fechaNacimiento: formData.fechaNacimiento,
                edad: formData.edad ? parseInt(formData.edad) : null,
                telefono: normalizedTelefono,
                email: formData.email,
                direccion: formData.showDireccion ? formData.direccion : null,
                entreCalles: formData.showDireccion ? formData.entreCalles : null,
                ciudad: formData.showDireccion ? formData.ciudad : null,
                provincia: formData.showDireccion ? formData.provincia : null,
                codigoPostal: formData.showDireccion ? formData.codigoPostal : null,
                healthInsurances: formData.healthInsurances.map((hi: any) => ({
                    healthInsuranceId: hi.healthInsuranceId,
                    nroAfiliado: hi.nroAfiliado || null,
                    isDefault: hi.isDefault
                })),
                notifiedUserId: formData.enviarNotificacionOtro ? formData.notifiedUserId : null,
                codigoExterno: formData.codigoExterno || null,
                laboratoryId
            };

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Ocurrió un error.");

            onSaved(data);
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center sm:p-6 overflow-hidden"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            className="bg-white dark:bg-zinc-900 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-4xl shadow-2xl border-0 sm:border border-zinc-100 dark:border-zinc-800 flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 md:p-8 shrink-0 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center">
                                        <UserPlus size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold tracking-tight">
                                            {patient ? "Editar Paciente" : "Nuevo Paciente"}
                                        </h2>
                                        <p className="text-sm text-zinc-500">
                                            Completa la información del paciente
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 md:p-8 overflow-y-auto flex-1">
                                <form id="patient-form" onSubmit={handleSubmit} className="space-y-6">
                                    {error && (
                                        <Alert 
                                            message={error} 
                                            variant="error" 
                                            onClose={() => setError("")}
                                            className="mb-4"
                                        />
                                    )}

                                    <div className="space-y-8">
                                        {/* Datos Personales Section */}
                                        <div className="space-y-6">
                                            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                                                <h3 className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-white uppercase">Datos Personales</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Apellido
                                                    </label>
                                                    <div className="relative">
                                                        <UserCircle size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                        <input
                                                            required
                                                            type="text"
                                                            value={formData.apellido}
                                                            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                                            className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                            placeholder="García"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Nombre
                                                    </label>
                                                    <input
                                                        required
                                                        type="text"
                                                        value={formData.nombre}
                                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                        placeholder="Juan Pérez"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Tipo Documento
                                                    </label>
                                                    <select
                                                        required
                                                        value={formData.tipoDocumento}
                                                        onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value })}
                                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                    >
                                                        <option value="DNI">DNI</option>
                                                        <option value="LE">LE</option>
                                                        <option value="LC">LC</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Nº Documento
                                                    </label>
                                                    <div className="relative">
                                                        <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                        <input
                                                            required
                                                            type="text"
                                                            value={formData.documento}
                                                            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                                                            className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all font-mono"
                                                            placeholder="Ej: 30123456"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Sexo
                                                    </label>
                                                    <select
                                                        required
                                                        value={formData.sexo}
                                                        onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                    >
                                                        <option value="F">Femenino (F)</option>
                                                        <option value="M">Masculino (M)</option>
                                                        <option value="O">Prefiero no decirlo</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Fecha Nacimiento
                                                    </label>
                                                    <div className="relative">
                                                        <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                        <input
                                                            required
                                                            type="date"
                                                            value={formData.fechaNacimiento}
                                                            onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                                            className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Edad
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={formData.edad}
                                                        onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                        placeholder="Edad en años"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4 pb-2 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">Obras Sociales | Prepagas</h3>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowHealthInsuranceModal(true)}
                                                            className="h-9 px-3 shrink-0 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-semibold"
                                                            title="Crear nueva obra social en la lista maestra"
                                                        >
                                                            <Plus size={14} /> Nueva
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    healthInsurances: [
                                                                        ...(formData.healthInsurances || []),
                                                                        { healthInsuranceId: "", nroAfiliado: "", isDefault: (formData.healthInsurances || []).length === 0 }
                                                                    ]
                                                                });
                                                            }}
                                                            className="h-9 px-3 shrink-0 bg-black dark:bg-white text-white dark:text-black rounded-xl flex items-center gap-1.5 transition-colors text-xs font-bold shadow-sm"
                                                        >
                                                            <Plus size={14} /> Agregar
                                                        </button>
                                                    </div>
                                                </div>

                                                {(formData.healthInsurances || []).length === 0 ? (
                                                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/10 border border-dashed border-zinc-200 dark:border-zinc-700 text-center text-sm text-zinc-500">
                                                        No hay obras sociales asociadas a este paciente.
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {(formData.healthInsurances || []).map((hi: any, idx: number) => (
                                                            <div key={idx} className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-100 dark:border-zinc-800 relative group">
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                                                        Obra Social / Prepaga
                                                                    </label>
                                                                    <select
                                                                        value={hi.healthInsuranceId || ""}
                                                                        onChange={(e) => {
                                                                            const newHi = [...formData.healthInsurances];
                                                                            newHi[idx].healthInsuranceId = e.target.value;
                                                                            setFormData({ ...formData, healthInsurances: newHi });
                                                                        }}
                                                                        className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all shadow-sm"
                                                                    >
                                                                        <option value="">Seleccione...</option>
                                                                        {healthInsurances.map((h: any) => (
                                                                            <option key={h.id} value={h.id}>{h.nombre}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                <div className="w-full sm:w-48">
                                                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                                                                        Nro Afiliado
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={hi.nroAfiliado || ""}
                                                                        onChange={(e) => {
                                                                            const newHi = [...formData.healthInsurances];
                                                                            newHi[idx].nroAfiliado = e.target.value;
                                                                            setFormData({ ...formData, healthInsurances: newHi });
                                                                        }}
                                                                        className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all shadow-sm"
                                                                        placeholder="Opcional"
                                                                    />
                                                                </div>
                                                                <div className="w-full sm:w-20 pt-1 sm:pt-6 flex justify-between sm:justify-end shrink-0 gap-2">
                                                                    <label className="flex items-center gap-2 sm:hidden text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                                                                        <input
                                                                            type="radio"
                                                                            name="defaultInsurance"
                                                                            checked={hi.isDefault}
                                                                            onChange={() => {
                                                                                const newHi = formData.healthInsurances.map((item: any, i: number) => ({
                                                                                    ...item,
                                                                                    isDefault: i === idx
                                                                                }));
                                                                                setFormData({ ...formData, healthInsurances: newHi });
                                                                            }}
                                                                            className="w-4 h-4 text-black border-zinc-300 focus:ring-black dark:focus:ring-white"
                                                                        />
                                                                        Principal
                                                                    </label>

                                                                    <div className="flex gap-2">
                                                                        <label className="hidden sm:flex items-center justify-center h-10 w-10 shrink-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm" title="Marcar como principal">
                                                                            <input
                                                                                type="radio"
                                                                                name="defaultInsuranceDesktop"
                                                                                checked={hi.isDefault}
                                                                                onChange={() => {
                                                                                    const newHi = formData.healthInsurances.map((item: any, i: number) => ({
                                                                                        ...item,
                                                                                        isDefault: i === idx
                                                                                    }));
                                                                                    setFormData({ ...formData, healthInsurances: newHi });
                                                                                }}
                                                                                className="w-4 h-4 text-black border-zinc-300 focus:ring-black dark:focus:ring-white cursor-pointer"
                                                                            />
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                const newHi = formData.healthInsurances.filter((_: any, i: number) => i !== idx);
                                                                                if (hi.isDefault && newHi.length > 0) newHi[0].isDefault = true;
                                                                                setFormData({ ...formData, healthInsurances: newHi });
                                                                            }}
                                                                            className="h-10 w-10 shrink-0 bg-rose-50 dark:bg-rose-950/30 text-rose-500 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-center hover:bg-rose-100 hover:border-rose-300 transition-colors"
                                                                            title="Eliminar esta cobertura"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contacto y Notificaciones Section */}
                                        <div className="space-y-6">
                                            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                                                <h3 className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-white uppercase">Contacto y Notificaciones</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                                <div className="md:col-span-1">
                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                        Teléfono (Celular)
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <div className="w-20 relative shrink-0">
                                                            <input
                                                                type="text"
                                                                value={formData.telefonoPais}
                                                                onChange={(e) => setFormData({ ...formData, telefonoPais: e.target.value })}
                                                                className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-center"
                                                                placeholder="+54 9"
                                                            />
                                                        </div>
                                                        <div className="w-24 relative shrink-0">
                                                            <input
                                                                type="text"
                                                                value={formData.telefonoArea}
                                                                onChange={(e) => setFormData({ ...formData, telefonoArea: e.target.value })}
                                                                className="w-full h-11 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-center"
                                                                placeholder="3446"
                                                            />
                                                        </div>
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="tel"
                                                                value={formData.telefonoNumero}
                                                                onChange={(e) => setFormData({ ...formData, telefonoNumero: e.target.value })}
                                                                className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                placeholder="15123456"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="mt-1 text-xs text-zinc-400">País - Área - Número</p>
                                                </div>

                                                {!formData.enviarNotificacionOtro ? (
                                                    <div>
                                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                            Email del Paciente
                                                        </label>
                                                        <div className="relative">
                                                            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                            <input
                                                                type="email"
                                                                value={formData.email}
                                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                                className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                placeholder="correo@ejemplo.com"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="hidden md:block"></div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.enviarNotificacionOtro}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                setFormData({
                                                                    ...formData,
                                                                    enviarNotificacionOtro: isChecked,
                                                                    ...(isChecked ? {} : { notifiedUserId: "" })
                                                                });
                                                            }}
                                                            className="peer sr-only"
                                                        />
                                                        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded flex items-center justify-center peer-checked:bg-black dark:peer-checked:bg-white peer-checked:border-black dark:peer-checked:border-white transition-all">
                                                            <svg viewBox="0 0 14 10" fill="none" className="w-3 h-3 text-white dark:text-black opacity-0 peer-checked:opacity-100 transition-opacity">
                                                                <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 relative group">
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Enviar resultados a un tercero</span>
                                                        <div className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                                                            <Info size={16} />
                                                        </div>
                                                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-black dark:bg-white text-white dark:text-black text-xs rounded shadow-lg z-10 transition-opacity">
                                                            Activa esta opción para vincular este paciente con un usuario de notificación (ej. familiares, médicos)
                                                        </div>
                                                    </div>
                                                </label>

                                                <AnimatePresence>
                                                    {formData.enviarNotificacionOtro && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="relative group">
                                                                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                    Buscar Usuario para Notificaciones
                                                                </label>
                                                                <div className="relative">
                                                                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                                    <input
                                                                        type="text"
                                                                        value={searchUser}
                                                                        onChange={(e) => {
                                                                            setSearchUser(e.target.value);
                                                                            if (!showUserList) setShowUserList(true);
                                                                        }}
                                                                        onFocus={() => setShowUserList(true)}
                                                                        placeholder="Buscar por apellido, nombre o email..."
                                                                        className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all shadow-sm"
                                                                    />
                                                                </div>

                                                                {showUserList && (
                                                                    <div className="absolute z-[100] w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                        <div className="max-h-60 overflow-y-auto p-2">
                                                                            {notifiedUsers.length > 0 ? (
                                                                                notifiedUsers.map((u: any) => (
                                                                                    <div
                                                                                        key={u.id}
                                                                                        onClick={() => {
                                                                                            setFormData({ ...formData, notifiedUserId: u.id });
                                                                                            setSearchUser(`${u.apellido}, ${u.nombre || ''}`);
                                                                                            setShowUserList(false);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between group/item",
                                                                                            formData.notifiedUserId === u.id
                                                                                                ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                                                                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                                                        )}
                                                                                    >
                                                                                        <div className="min-w-0">
                                                                                            <div className="text-sm">{u.apellido}, {u.nombre || ""}</div>
                                                                                            <div className={cn("text-[10px]", formData.notifiedUserId === u.id ? "text-white/50 dark:text-black/50" : "text-zinc-500")}>
                                                                                                {u.email}
                                                                                            </div>
                                                                                        </div>
                                                                                        {u.enviarUnaCopia && (
                                                                                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md",
                                                                                                formData.notifiedUserId === u.id ? "bg-white/10" : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600")}>
                                                                                                ADJUNTO
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <div className="p-4 text-center text-zinc-400 text-xs italic">
                                                                                    No se encontraron usuarios
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {showUserList && (
                                                                    <div className="fixed inset-0 z-[90]" onClick={() => setShowUserList(false)} />
                                                                )}
                                                            </div>

                                                            {formData.notifiedUserId && (
                                                                <div className="p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-900 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100 dark:border-emerald-500/10">
                                                                                <Mail size={18} />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-tight">Usuario Vinculado</p>
                                                                                <div className="flex items-center gap-2 text-[10px] text-emerald-600/70 font-bold">
                                                                                    {(() => {
                                                                                        const selected = notifiedUsers.find((u: any) => u.id === formData.notifiedUserId);
                                                                                        return selected ? (
                                                                                            <>
                                                                                                <span>{selected.email}</span>
                                                                                                {selected.enviarUnaCopia && <span className="px-1 py-0.25 bg-emerald-500 text-white rounded-md text-[8px]">RECIBE INFORME</span>}
                                                                                            </>
                                                                                        ) : "Cargando...";
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData({ ...formData, notifiedUserId: "" });
                                                                                setSearchUser("");
                                                                            }}
                                                                            className="p-2 text-emerald-600/40 hover:text-rose-500 transition-colors"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div>
                                                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                                    <div className="relative flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.showDireccion}
                                                            onChange={(e) => {
                                                                const isChecked = e.target.checked;
                                                                setFormData({
                                                                    ...formData,
                                                                    showDireccion: isChecked,
                                                                    ...(isChecked ? {} : { direccion: "" })
                                                                });
                                                            }}
                                                            className="peer sr-only"
                                                        />
                                                        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded flex items-center justify-center peer-checked:bg-black dark:peer-checked:bg-white peer-checked:border-black dark:peer-checked:border-white transition-all">
                                                            <svg viewBox="0 0 14 10" fill="none" className="w-3 h-3 text-white dark:text-black opacity-0 peer-checked:opacity-100 transition-opacity">
                                                                <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 relative group">
                                                        <span className="text-sm font-semibold text-zinc-900 dark:text-white">Cargar dirección postal</span>
                                                    </div>
                                                </label>

                                                <AnimatePresence>
                                                    {formData.showDireccion && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                                                                <div>
                                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                        Dirección del Paciente
                                                                    </label>
                                                                    <div className="relative">
                                                                        <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                                                        <input
                                                                            type="text"
                                                                            value={formData.direccion}
                                                                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                                            className="w-full h-11 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                            placeholder="Ej: San Martín 1500"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                        Entre Calles (Opcional)
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={formData.entreCalles}
                                                                        onChange={(e) => setFormData({ ...formData, entreCalles: e.target.value })}
                                                                        className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                        placeholder="Ej: 2 de Abril y Jujuy"
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    <div className="lg:col-span-1">
                                                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                            Cód. Postal
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={formData.codigoPostal}
                                                                            onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                                                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                            placeholder="Ej: 2820"
                                                                        />
                                                                    </div>
                                                                    <div className="sm:col-span-1 lg:col-span-1">
                                                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                            Ciudad
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={formData.ciudad}
                                                                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                            placeholder="Ej: Gualeguaychú"
                                                                        />
                                                                    </div>
                                                                    <div className="sm:col-span-2 lg:col-span-1">
                                                                        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                                                                            Provincia
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={formData.provincia}
                                                                            onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                                                                            className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-2xl text-sm focus:bg-white dark:focus:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all"
                                                                            placeholder="Ej: Entre Ríos"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            <div className="p-6 md:p-8 shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    form="patient-form"
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 h-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 dark:border-black/20 border-t-white dark:border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {patient ? "Guardar cambios" : "Crear paciente"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <HealthInsuranceModal
                open={showHealthInsuranceModal}
                onClose={() => setShowHealthInsuranceModal(false)}
                onSaved={() => {
                    setShowHealthInsuranceModal(false);
                    loadHealthInsurances();
                }}
            />
        </>
    );
}
