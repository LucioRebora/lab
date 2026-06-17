"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
    ArrowLeft, History, Calendar, User, Phone, Mail, 
    CreditCard, MapPin, Search, FileText, ChevronRight,
    Activity, ClipboardList, Beaker, Stethoscope
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PatientHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("protocols");

    const fetchPatient = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/patients/${params.id}`);
            if (res.ok) {
                const data = await res.json();
                setPatient(data);
            } else {
                toast.error("Error al cargar el paciente");
                router.push("/admin/pacientes");
            }
        } catch (error) {
            console.error("Fetch patient error:", error);
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        if (params.id) fetchPatient();
    }, [params.id, fetchPatient]);

    if (loading) {
        return (
            <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">Cargando historia clínica...</p>
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 font-sans">
            {/* Navigation */}
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group mb-4"
            >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-200 dark:group-hover:border-zinc-700 shadow-sm">
                    <ArrowLeft size={16} />
                </div>
                <span className="text-sm font-semibold">Volver al listado</span>
            </button>

            {/* Patient Header Card */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden"
            >
                <div className="p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar / Icon */}
                        <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 border-4 border-white dark:border-zinc-900 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 ${
                            patient.sexo === 'F' ? 'bg-pink-500 text-white' : 
                            patient.sexo === 'M' ? 'bg-blue-500 text-white' : 'bg-zinc-500 text-white'
                        }`}>
                            <span className="text-4xl font-black">{patient.apellido?.[0]}{patient.nombre?.[0]}</span>
                        </div>

                        <div className="flex-1 space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                                            {patient.apellido}, {patient.nombre}
                                        </h1>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            patient.sexo === 'F' ? 'bg-pink-100 text-pink-600 dark:bg-pink-500/20' : 
                                            patient.sexo === 'M' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20' : 'bg-zinc-100 text-zinc-600'
                                        }`}>
                                            {patient.sexo === 'F' ? 'Femenino' : patient.sexo === 'M' ? 'Masculino' : 'Otro'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-zinc-400" />
                                            {patient.fechaNacimiento ? new Date(patient.fechaNacimiento).toLocaleDateString('es-AR') : '—'}
                                            {patient.edad && <span className="text-zinc-300 dark:text-zinc-700 ml-1">({patient.edad} años)</span>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-zinc-400" />
                                            {patient.tipoDocumento} {patient.documento}
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-50 dark:border-zinc-800/50">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        <Phone size={10} /> Contacto
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        {patient.telefono || '—'}
                                    </p>
                                    <p className="text-xs text-zinc-500">{patient.email || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        <MapPin size={10} /> Dirección
                                    </div>
                                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                        {patient.direccion || '—'}
                                    </p>
                                    <p className="text-xs text-zinc-500">{patient.localidad || '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        <Activity size={10} /> Obras Sociales
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {patient.healthInsurances?.map((hi: any) => (
                                            <span 
                                                key={hi.id}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                                                    hi.isDefault 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20' 
                                                    : 'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700'
                                                }`}
                                            >
                                                {hi.healthInsurance?.nombre} 
                                                {hi.nroAfiliado && <span className="ml-1 opacity-60">#{hi.nroAfiliado}</span>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* History Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                            <ClipboardList size={20} />
                        </div>
                        <h2 className="text-xl font-bold">Historia de Protocolos</h2>
                        <span className="text-sm text-zinc-400">({patient.protocols?.length || 0})</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {patient.protocols?.map((protocol: any, index: number) => (
                        <motion.div
                            key={protocol.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                        >
                            <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
                                {/* Date Column */}
                                <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl min-w-[100px] border border-zinc-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Fecha</span>
                                    <span className="text-xl font-black text-zinc-900 dark:text-zinc-100">
                                        {new Date(protocol.createdAt).getDate()}
                                    </span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                        {new Date(protocol.createdAt).toLocaleDateString('es-AR', { month: 'short' })} {new Date(protocol.createdAt).getFullYear()}
                                    </span>
                                </div>

                                {/* Main Info Column */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-bold">Protocolo #{protocol.numeroSecuencial}</h3>
                                                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 text-[10px] font-bold uppercase tracking-wider">
                                                    Completado
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                                                <div className="flex items-center gap-1.5">
                                                    <Stethoscope size={13} className="text-zinc-400" />
                                                    {protocol.doctor ? `${protocol.doctor.apellido}, ${protocol.doctor.nombre}` : 'PARTICULAR'}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Beaker size={13} className="text-zinc-400" />
                                                    {protocol.results?.length} Determinaciones
                                                </div>
                                            </div>
                                        </div>
                                        <Link 
                                            href={`/admin/protocolos/${protocol.id}`}
                                            className="flex items-center gap-2 px-4 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-900 dark:hover:bg-zinc-100 hover:text-white dark:hover:text-zinc-900 transition-all text-xs font-bold"
                                        >
                                            Ver Protocolo <ChevronRight size={14} />
                                        </Link>
                                    </div>
                                    
                                    {/* Determinations Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {protocol.results?.map((res: any) => (
                                            <span 
                                                key={res.id}
                                                className="px-2 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/30 text-[10px] font-medium text-zinc-500 border border-zinc-100 dark:border-zinc-800"
                                            >
                                                {res.determination?.abreviatura || res.determination?.nombre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {(!patient.protocols || patient.protocols.length === 0) && (
                        <div className="p-20 text-center bg-zinc-50 dark:bg-zinc-800/30 rounded-[3rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                            <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-800">
                                <History size={24} className="text-zinc-300" />
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Sin historia de protocolos</h3>
                            <p className="text-sm text-zinc-500 mt-1">Este paciente aún no registra ingresos en el laboratorio.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
