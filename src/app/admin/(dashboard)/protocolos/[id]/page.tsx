"use client";

import React, { useState, useEffect } from "react";
import {
    ChevronLeft,
    Printer,
    User,
    Stethoscope,
    Activity,
    Calendar,
    Clock,
    Link as LinkIcon,
    Beaker,
    MapPin,
    Mail,
    Phone,
    FileText,
    ClipboardCheck,
    AlertCircle,
    CheckCircle2,
    Printer as PrinterIcon,
    X,
    ChevronDown,
    ChevronRight,
    StickyNote,
    Send,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProtocolDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [protocol, setProtocol] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [newNote, setNewNote] = useState("");
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);

    useEffect(() => {
        const fetchProtocol = async () => {
            try {
                const res = await fetch(`/api/protocols/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProtocol(data);

                    // Initialize all rows as expanded by default
                    if (data.results) {
                        const initialExpanded: Record<string, boolean> = {};
                        data.results.forEach((item: any) => {
                            initialExpanded[item.id] = true;
                        });
                        setExpandedRows(initialExpanded);
                    }
                } else {
                    toast.error("No se pudo cargar el protocolo.");
                    router.push("/admin/protocolos");
                }
            } catch (error) {
                console.error("Error loading protocol:", error);
                toast.error("Ocurrió un error inesperado.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProtocol();
    }, [id, router]);

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsSubmittingNote(true);
        try {
            const res = await fetch(`/api/protocols/${id}/notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newNote })
            });

            if (res.ok) {
                const note = await res.json();
                setProtocol((prev: any) => ({
                    ...prev,
                    notes: [note, ...(prev?.notes || [])]
                }));
                setNewNote("");
                toast.success("Nota agregada correctamente");
            } else {
                toast.error("Error al guardar la nota");
            }
        } catch (error) {
            console.error("Error adding note:", error);
            toast.error("Ocurrió un error inesperado al guardar la nota");
        } finally {
            setIsSubmittingNote(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium italic">Obteniendo detalles del protocolo...</p>
            </div>
        );
    }

    if (!protocol) return null;

    const patient = protocol.patient;
    const doctor = protocol.doctor;
    const items = protocol.results || [];
    const createdAt = new Date(protocol.createdAt);

    return (
        <div className="p-8 max-w-5xl mx-auto pb-24">
            {/* Nav & Actions */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
                >
                    <div className="p-2 rounded-xl group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider">Volver</span>
                </button>
                <div className="flex gap-3">
                    <Link
                        href={`/admin/protocolos/${id}/print`}
                        target="_blank"
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95"
                    >
                        <PrinterIcon size={14} />
                        Generar Informe
                    </Link>
                </div>
            </div>

            {/* Main Layout */}
            <div className="space-y-8">
                {/* Top Row: Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Patient Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900 dark:bg-black rounded-4xl p-8 text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between"
                    >
                        {/* Background Ornament */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                        <div className="flex items-start justify-between mb-8 relative">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-xl text-emerald-400 border border-white/10 backdrop-blur-md shadow-inner">
                                    {patient?.apellido?.charAt(0)}{patient?.nombre?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-xl leading-tight truncate">{patient?.apellido}, {patient?.nombre}</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">
                                        <span>DNI {patient?.documento}</span>
                                        <span className="text-white/20">•</span>
                                        <span>{patient?.sexo === 'F' ? 'Femenino' : 'Masculino'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">EDAD</div>
                                <div className="text-sm font-black text-emerald-400">{patient?.edad ? `${patient.edad} AÑOS` : '—'}</div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 relative flex items-center justify-between">
                            <div className="flex gap-6">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Nacimiento</span>
                                    <span className="text-xs font-bold">{patient?.fechaNacimiento ? new Date(patient.fechaNacimiento).toLocaleDateString('es-AR') : '—'}</span>
                                </div>
                                {patient?.telefono && (
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Teléfono</span>
                                        <span className="text-xs font-bold">{patient.telefono}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {patient?.email && (
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/50" title={patient.email}>
                                        <Mail size={14} />
                                    </div>
                                )}
                                {patient?.direccion && (
                                    <div className="p-2 rounded-xl bg-white/5 border border-white/5 text-white/50" title={patient.direccion}>
                                        <MapPin size={14} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Protocol Reference */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-4xl p-8 border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                                    <Activity className="text-emerald-600" size={24} />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">CÓDIGO PROTOCOLO</div>
                                    <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{protocol.numeroSecuencial}</h1>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">REGISTRADO EL</div>
                                <div className="flex flex-col items-end">
                                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{createdAt.toLocaleDateString('es-AR', { timeZone: 'UTC' })}</span>
                                    <span className="text-[11px] font-bold text-emerald-500">{createdAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} HS</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center border border-zinc-100 dark:border-zinc-700/30">
                                    <Stethoscope size={18} className="text-emerald-500" />
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1.5">MÉDICO DERIVANTE</span>
                                    {doctor ? (
                                        <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100 uppercase">
                                            DR. {doctor.apellido}, {doctor.nombre} <span className="text-zinc-400 font-medium ml-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">MP {doctor.matriculaProvincial || 'S/D'}</span>
                                        </div>
                                    ) : (
                                        <div className="text-sm font-bold text-zinc-300 italic uppercase">Atención Particular</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Notes Highlights (Prominent placement requested) */}
                {protocol.notes?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[2.5rem] p-6 shadow-sm"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                                <StickyNote className="text-amber-600 dark:text-amber-400" size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-widest">Observaciones del Protocolo</h4>
                                    <span className="text-[10px] font-bold text-amber-600/50 uppercase">{protocol.notes.length} {protocol.notes.length === 1 ? 'Nota' : 'Notas'}</span>
                                </div>
                                <div className="space-y-3">
                                    {protocol.notes.slice(0, 3).map((note: any) => (
                                        <div key={note.id} className="flex flex-col gap-1">
                                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                                {note.text}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-amber-600/60 font-black uppercase tracking-tighter">
                                                    Escrito por {note.user?.name || 'Sistema'}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-bold">•</span>
                                                <span className="text-[10px] text-zinc-400 font-bold">
                                                    {new Date(note.createdAt).toLocaleDateString('es-AR')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Bottom Row: Analysis Table */}
                <div className="w-full">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden"
                    >
                        <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <ClipboardCheck className="text-emerald-500" size={20} />
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Análisis Solicitados</h3>
                            </div>
                            <span className="text-[11px] font-black bg-zinc-900 dark:bg-white text-white dark:text-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-lg shadow-zinc-900/10 dark:shadow-none">
                                {items.length} ITÉMS
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Código</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Determinación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                    {items.length > 0 ? items.map((item: any) => {
                                        const det = item.determination;
                                        const subResults = item.subResults || [];
                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr className={`group hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10 transition-colors ${item.suspender ? 'opacity-60 bg-red-50/10' : ''}`}>
                                                    <td className="px-6 py-4">
                                                        {det?.codigo ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-100 dark:border-blue-800/30">
                                                                {det.codigo}
                                                            </span>
                                                        ) : <span className="text-zinc-300">—</span>}
                                                    </td>
                                                    <td className="px-6 py-4 cursor-pointer" onClick={() => {
                                                        setExpandedRows(prev => ({
                                                            ...prev,
                                                            [item.id]: !prev[item.id]
                                                        }));
                                                    }}>
                                                        <div className="flex items-center gap-3">
                                                            {subResults.length > 0 && (
                                                                <div className="text-zinc-400">
                                                                    {expandedRows[item.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                </div>
                                                            )}
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{det?.nombre}</span>
                                                                <div className="flex flex-col">
                                                                    {det?.abreviatura && (
                                                                        <span className="text-[10px] text-zinc-400 font-medium uppercase">{det.abreviatura}</span>
                                                                    )}
                                                                    {det?.method?.nombre && (
                                                                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                                                                            Método: {det.method.nombre}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {subResults.length > 0 && expandedRows[item.id] && (
                                                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/10">
                                                        <td colSpan={3} className="p-0 border-t border-zinc-100 dark:border-zinc-800/50">
                                                            <div className="pl-6 pr-6 pt-2 pb-4 space-y-2 relative">

                                                                {(() => {
                                                                    const rows: any[][] = [];
                                                                    subResults.forEach((sub: any) => {
                                                                        if (sub.subDetermination?.informar2C && rows.length > 0) {
                                                                            rows[rows.length - 1].push(sub);
                                                                        } else {
                                                                            rows.push([sub]);
                                                                        }
                                                                    });

                                                                    return rows.map((row: any[], rowIdx: number) => {
                                                                        const firstSub = row[0];
                                                                        const currentGroup = firstSub.subDetermination?.informarTextoAntes;
                                                                        const prevSub = rowIdx > 0 ? rows[rowIdx - 1][0] : null;
                                                                        const prevGroup = prevSub?.subDetermination?.informarTextoAntes;
                                                                        const showHeader = currentGroup && currentGroup !== prevGroup;

                                                                        return (
                                                                            <div key={`row-${rowIdx}`} className="grid grid-cols-[30%_35%_35%] gap-0 relative">
                                                                                {row.map((sub: any, subIdx: number) => (
                                                                                    <div key={sub.id} className="flex justify-start gap-4 items-center py-0.5 pr-4">
                                                                                        {subIdx === 0 && (
                                                                                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold max-w-[220px] truncate uppercase tracking-wider min-w-[150px]">
                                                                                                {sub.subDetermination?.nombre}
                                                                                            </span>
                                                                                        )}
                                                                                        <div className="flex items-center gap-1.5">
                                                                                             {sub.comentario && sub.valor !== ":" && (
                                                                                                 <span className="text-[10px] text-zinc-400 italic bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-100 dark:border-zinc-800">
                                                                                                     {sub.comentario}
                                                                                                 </span>
                                                                                             )}
                                                                                             <div className="flex items-center gap-1.5">
                                                                                                 <span className={`text-xs font-bold font-mono px-3 py-0.5 rounded-lg inline-block min-w-16 ${(() => {
                                                                                                    const val = sub.valor || '';
                                                                                                    const isText = val === ":" || /[^0-9.,<> \s\-]/.test(val);
                                                                                                    return isText ? "text-left" : "text-right";
                                                                                                 })()} whitespace-pre-wrap ${sub.valor ? 'bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-400 italic'
                                                                                                      }`}>
                                                                                                      {sub.valor === ":" ? sub.comentario : (sub.valor || '—')}
                                                                                                  </span>
                                                                                                {sub.subDetermination?.unit?.nombre && (
                                                                                                    <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap inline-block w-14 ml-1">
                                                                                                        {sub.subDetermination.unit.nombre}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    });
                                                                })()}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="p-20 text-center text-zinc-400 italic text-sm">
                                                No hay análisis registrados para este protocolo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
}

