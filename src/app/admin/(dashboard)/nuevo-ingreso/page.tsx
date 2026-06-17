"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, UserPlus, ArrowRight, Activity, Calendar, X, Printer, CheckCircle2, Info, DollarSign, Zap, Trash2, StickyNote, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { PatientModal, type Patient } from "@/components/admin/PatientModal";
import { DoctorModal } from "@/components/admin/DoctorModal";
import { SubDeterminationsInfoModal } from "@/components/admin/SubDeterminationsInfoModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAudit } from "@/hooks/useAudit";
import { get } from "idb-keyval";

export default function NuevoIngresoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("edit");
    const [search, setSearch] = useState("");
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeLabId, setActiveLabId] = useState<string>("");
    const [patientModalOpen, setPatientModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
    const [doctorSearch, setDoctorSearch] = useState("");
    const [showDoctorList, setShowDoctorList] = useState(false);
    const [doctorModalOpen, setDoctorModalOpen] = useState(false);
    const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [determinations, setDeterminations] = useState<any[]>([]);
    const [selectedDeterminations, setSelectedDeterminations] = useState<any[]>([]);
    const [detSearch, setDetSearch] = useState("");
    const [showDetList, setShowDetList] = useState(false);
    const [loadingDets, setLoadingDets] = useState(false);
    const [generatingProtocol, setGeneratingProtocol] = useState(false);
    const [activeDetIndex, setActiveDetIndex] = useState(0);
    const [activeDoctorIndex, setActiveDoctorIndex] = useState(0);
    const [activePatientIndex, setActivePatientIndex] = useState(0);
    const [infoModalOpen, setInfoModalOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const determinationsListRef = useRef<HTMLDivElement>(null);


    const [infoDetId, setInfoDetId] = useState<string | null>(null);
    const [infoDetName, setInfoDetName] = useState<string | null>(null);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetData, setBudgetData] = useState<any>(null);
    const [calculatingBudget, setCalculatingBudget] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingProtocol, setDeletingProtocol] = useState(false);
    const { logAction } = useAudit();

    const fetchDoctors = async () => {
        setLoadingDoctors(true);
        try {
            const res = await fetch("/api/doctors");
            if (res.ok) {
                const data = await res.json();
                setDoctors(data);
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const fetchDeterminations = async () => {
        setLoadingDets(true);
        try {
            const res = await fetch("/api/determinations");
            if (res.ok) {
                const data = await res.json();
                setDeterminations(data);
            }
        } catch (error) {
            console.error("Error fetching determinations:", error);
        } finally {
            setLoadingDets(false);
        }
    };

    // Load protocol for editing
    useEffect(() => {
        if (editId) {
            const fetchProtocol = async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/protocols/${editId}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedPatient(data.patient);
                        setSelectedDoctorId(data.doctorId || "");
                        setSelectedDeterminations(data.results.map((r: any) => ({
                            ...r.determination,
                            precio: r.precio,
                            assigned: r.asignado,
                            printed: r.etiquetaImpresa
                        })));
                        // Set doctor search name if doctor exists
                        if (data.doctor) {
                            setDoctorSearch(`${data.doctor.apellido}, ${data.doctor.nombre}`);
                        }
                        if (data.notes && data.notes.length > 0) {
                            setNotes(data.notes[0].text);
                        }
                    } else {

                        toast.error("No se pudo cargar el protocolo para editar.");
                    }
                } catch (error) {
                    console.error("Error loading protocol for edit:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProtocol();
        }
    }, [editId]);

    useEffect(() => {
        const handleLabChange = () => {
            const savedLab = localStorage.getItem('selectedLaboratoryId');
            if (savedLab) {
                setActiveLabId(savedLab);
            }
        };
        handleLabChange();
        fetchDoctors();
        fetchDeterminations();
        window.addEventListener('laboratoryChanged', handleLabChange);
        window.addEventListener('laboratoryChanged', fetchDoctors);
        window.addEventListener('laboratoryChanged', fetchDeterminations);
        return () => {
            window.removeEventListener('laboratoryChanged', handleLabChange);
            window.removeEventListener('laboratoryChanged', fetchDoctors);
            window.removeEventListener('laboratoryChanged', fetchDeterminations);
        };
    }, []);

    useEffect(() => {
        if (determinationsListRef.current) {
            determinationsListRef.current.scrollTop = determinationsListRef.current.scrollHeight;
        }
    }, [selectedDeterminations.length]);

    const searchPatients = useCallback(async (q: string, labId: string) => {
        if (!q.trim()) {
            setPatients([]);
            return;
        }
        setLoading(true);
        try {
            const url = new URL("/api/patients", window.location.origin);
            url.searchParams.set("q", q);
            if (labId) url.searchParams.set("laboratoryId", labId);

            const res = await fetch(url.toString());
            const data = await res.json();
            setPatients(Array.isArray(data) ? data.slice(0, 5) : []); // solo mostrar hasta 5 resultados rapidos
        } catch (error) {
            console.error("Error searching patients:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handlePatientKeyDown = (e: React.KeyboardEvent) => {
        if (patients.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActivePatientIndex(prev => (prev < patients.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActivePatientIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selected = patients[activePatientIndex];
            if (selected) {
                handleSelectPatient(selected);
            }
        }
    };

    useEffect(() => {
        const t = setTimeout(() => {
            searchPatients(search, activeLabId);
            setActivePatientIndex(0);
        }, 400);
        return () => clearTimeout(t);
    }, [search, activeLabId, searchPatients]);

    const handleSelectPatient = (patient: Patient) => {

        setSelectedPatient(patient);
        logAction({
            action: "SELECCION_PACIENTE",
            entity: "Patient",
            entityId: patient.id,
            details: `Paciente seleccionado: ${patient.apellido}, ${patient.nombre}`
        });
    };

    const handlePatientSaved = (patient: Patient) => {
        setPatients(prev => {
            const exists = prev.find(p => p.id === patient.id);
            if (exists) return prev.map(p => p.id === patient.id ? patient : p);
            return [patient, ...prev];
        });
        setPatientModalOpen(false);
        setSelectedPatient(patient);
        toast.success(`Paciente ${patient.apellido} registrado y seleccionado.`);
    }

    const handleCalculateBudget = async () => {
        if (!selectedPatient || selectedDeterminations.length === 0) return;
        setCalculatingBudget(true);
        try {
            const defaultHI = selectedPatient.healthInsurances?.find(h => h.isDefault) || selectedPatient.healthInsurances?.[0];
            const hiId = defaultHI?.healthInsuranceId;
            const hiNombre = defaultHI?.healthInsurance?.nombre || "PARTICULAR";

            const items = await Promise.all(selectedDeterminations.map(async (det) => {
                let price = det.precio || 0;
                
                // Solo calculamos si el precio es 0 o indefinido
                if (!price) {
                    const queryParams = new URLSearchParams();
                    if (hiId) queryParams.set("hiId", hiId);
                    const labToUse = activeLabId || localStorage.getItem("selectedLaboratoryId");
                    if (labToUse) queryParams.set("labId", labToUse);

                    const res = await fetch(`/api/determinations/${det.id}/price?${queryParams.toString()}`);
                    if (res.ok) {
                        const data = await res.json();
                        price = data.price;
                    }
                }
                
                return {
                    ...det,
                    precio: price,
                    healthInsuranceNombre: hiNombre
                };
            }));

            setBudgetData({
                patient: selectedPatient,
                hiNombre,
                items,
                total: items.reduce((sum, item) => sum + item.precio, 0)
            });
            setShowBudgetModal(true);
        } catch (error) {
            console.error("Error calculating budget:", error);
            toast.error("Error al calcular el presupuesto.");
        } finally {
            setCalculatingBudget(false);
        }
    };

    const handleExportCM260 = async () => {
        if (!editId) return;
        const loadingToast = toast.loading("Preparando archivo para CM260...");
        try {
            const res = await fetch(`/api/protocols/${editId}/cm260-export`);
            if (!res.ok) throw new Error("Error al generar exportación");
            
            const data = await res.json();
            
            // Try to use Local Directory Handle if configured for this equipment
            let savedToLocal = false;
            try {
                const handle = await get(`directory_handle_${data.equipmentId}`);
                if (handle) {
                    // Request permission (browsers require this after page refresh)
                    // @ts-ignore
                    if (await handle.queryPermission({ mode: 'readwrite' }) !== 'granted') {
                        // @ts-ignore
                        if (await handle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
                            throw new Error("Permiso denegado para el directorio");
                        }
                    }

                    // @ts-ignore
                    const fileHandle = await handle.getFileHandle(data.fileName, { create: true });
                    
                    // Logic to APPEND
                    // @ts-ignore
                    const file = await fileHandle.getFile();
                    const existingContent = await file.text();
                    
                    // Check for duplicates (by sequential number)
                    const protocolNumber = data.content.split(';')[0];
                    const isDuplicate = existingContent.split('\n').some((line: string) => line.trim().startsWith(protocolNumber + ';'));
                    
                    if (isDuplicate) {
                        toast.error(`El protocolo ${protocolNumber} ya fue enviado al equipo`, { id: loadingToast });
                        return;
                    }
                    
                    // Add newline if file is not empty and doesn't end with one
                    let newContent = existingContent;
                    if (existingContent && !existingContent.endsWith('\n')) {
                        newContent += '\n';
                    }
                    newContent += data.content;

                    // @ts-ignore
                    const writable = await fileHandle.createWritable();
                    await writable.write(newContent);
                    await writable.close();
                    savedToLocal = true;
                    toast.success(`Protocolo agregado a ${data.fileName}`, { id: loadingToast });
                }
            } catch (err: any) {
                console.warn("Could not save to local directory, falling back to download", err);
            }

            if (!savedToLocal) {
                // Fallback: Trigger normal download
                const blob = new Blob([data.content], { type: "text/plain" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = data.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Archivo descargado correctamente", { id: loadingToast });
            }
            
            logAction({
                action: "EXPORT_CM260",
                entity: "Protocol",
                entityId: editId,
                details: `Exportación generada para equipo CM260: ${data.fileName} (${savedToLocal ? 'Directorio PC' : 'Descarga'})`
            });
        } catch (error: any) {
            toast.error(error.message || "Error al exportar", { id: loadingToast });
        }
    };

    const handleDeleteProtocol = async () => {
        if (!editId) return;
        
        setDeletingProtocol(true);
        const loadingToast = toast.loading("Eliminando protocolo...");
        try {
            const res = await fetch(`/api/protocols/${editId}`, {
                method: "DELETE"
            });
            
            if (!res.ok) throw new Error("Error al eliminar el protocolo");
            
            toast.success("Protocolo eliminado correctamente", { id: loadingToast });
            setShowDeleteConfirm(false);
            router.push("/admin/libro-de-entradas");
        } catch (error: any) {
            toast.error(error.message || "Error al eliminar el protocolo", { id: loadingToast });
        } finally {
            setDeletingProtocol(false);
        }
    };

    const handleGenerateProtocol = async () => {
        if (!selectedPatient) return;
        setGeneratingProtocol(true);
        try {
            const method = editId ? "PATCH" : "POST";
            const url = editId ? `/api/protocols/${editId}` : "/api/protocols";

            const rep = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    laboratoryId: activeLabId,
                    doctorId: selectedDoctorId || null,
                    determinationIds: selectedDeterminations.map(d => d.id),
                    customPrices: selectedDeterminations.reduce((acc: any, it: any) => {
                        acc[it.id] = it.precio;
                        return acc;
                    }, {}),
                    assignedFlags: selectedDeterminations.reduce((acc: any, it: any) => {
                        acc[it.id] = it.assigned || false;
                        return acc;
                    }, {}),
                    printedFlags: selectedDeterminations.reduce((acc: any, it: any) => {
                        acc[it.id] = it.printed || false;
                        return acc;
                    }, {}),
                    notes: notes.trim() || null,
                })
            });

            if (!rep.ok) throw new Error(editId ? "Error al actualizar el protocolo" : "Error al generar el protocolo");
            
            const data = await rep.json();
            toast.success(editId ? "Protocolo actualizado exitosamente" : `Protocolo generado exitosamente: ${data.numeroSecuencial}`);

            // Redirigir o resetear
            if (editId) {
                router.push("/admin/protocolos");
            } else {
                setSelectedPatient(null);
                setSelectedDoctorId("");
                setDoctorSearch("");
                setSearch("");
                setPatients([]);
                setSelectedDeterminations([]);
                setDetSearch("");
                setNotes("");
            }

            logAction({
                action: editId ? "ACTUALIZAR_PROTOCOLO" : "GENERAR_PROTOCOLO",
                entity: "Protocol",
                entityId: data.id,
                details: `${editId ? 'Protocolo actualizado' : 'Protocolo generado'}: ${data.numeroSecuencial} para el paciente ${selectedPatient.apellido}`
            });
        } catch (error: any) {
            toast.error(error.message || "Error al procesar.");
        } finally {
            setGeneratingProtocol(false);
        }
    };

    const filteredDoctors = React.useMemo(() => {
        const searchLower = doctorSearch.toLowerCase().trim();
        // Option "SIN MÉDICO / PARTICULAR" will always be there, but let's handle the filter
        const list = doctors.filter(doc => {
            if (!searchLower) return true;

            if (searchLower.includes(',')) {
                const [ape, nom] = searchLower.split(',').map(s => s.trim());
                return doc.apellido.toLowerCase().includes(ape) &&
                    doc.nombre.toLowerCase().includes(nom);
            }

            const parts = searchLower.split(/\s+/).filter(Boolean);
            if (parts.length > 1) {
                return parts.every(part =>
                    doc.apellido.toLowerCase().includes(part) ||
                    doc.nombre.toLowerCase().includes(part) ||
                    (doc.matriculaProvincial && doc.matriculaProvincial.toLowerCase().includes(part))
                );
            }

            return (
                doc.apellido.toLowerCase().includes(searchLower) ||
                doc.nombre.toLowerCase().includes(searchLower) ||
                (doc.matriculaProvincial && doc.matriculaProvincial.toLowerCase().includes(searchLower))
            );
        });
        return list;
    }, [doctorSearch, doctors]);

    const handleDoctorKeyDown = (e: React.KeyboardEvent) => {
        if (!showDoctorList) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveDoctorIndex(prev => (prev < filteredDoctors.length ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveDoctorIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeDoctorIndex < filteredDoctors.length) {
                const doc = filteredDoctors[activeDoctorIndex];
                if (doc) {
                    setSelectedDoctorId(doc.id);
                    setDoctorSearch(`${doc.apellido}, ${doc.nombre}`);
                    setShowDoctorList(false);
                    logAction({
                        action: "SELECCION_MEDICO",
                        entity: "Doctor",
                        entityId: doc.id,
                        details: `Médico seleccionado: ${doc.apellido}, ${doc.nombre}`
                    });
                }
            } else if (activeDoctorIndex === filteredDoctors.length) {
                // SIN MÉDICO / PARTICULAR
                setSelectedDoctorId("");
                setDoctorSearch("SIN MÉDICO / PARTICULAR");
                setShowDoctorList(false);
                logAction({
                    action: "SELECCION_MEDICO",
                    details: "Médico seleccionado: SIN MÉDICO / PARTICULAR"
                });
            }
        } else if (e.key === "Escape") {
            setShowDoctorList(false);
        }
    };


    const filteredDets = React.useMemo(() => {

        if (!detSearch.trim()) return [];
        const searchLower = detSearch.toLowerCase().trim();
        return determinations
            .filter(det => {
                const isAlreadySelected = selectedDeterminations.some(d => d.id === det.id);
                if (isAlreadySelected) return false;

                const codigo = String(det.codigo || "").toLowerCase();
                const nombre = String(det.nombre || "").toLowerCase();
                const abreviatura = String(det.abreviatura || "").toLowerCase();

                const parts = searchLower.split(/\s+/).filter(Boolean);
                if (parts.length > 1) {
                    return parts.every(part =>
                        codigo.includes(part) ||
                        nombre.includes(part) ||
                        abreviatura.includes(part)
                    );
                }

                return (
                    codigo.includes(searchLower) ||
                    nombre.includes(searchLower) ||
                    abreviatura.includes(searchLower)
                );
            })
            .sort((a, b) => {
                const aExact = a.codigo?.toLowerCase() === searchLower;
                const bExact = b.codigo?.toLowerCase() === searchLower;
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aStarts = a.codigo?.toLowerCase().startsWith(searchLower);
                const bStarts = b.codigo?.toLowerCase().startsWith(searchLower);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return 0;
            })
            .slice(0, 15);
    }, [detSearch, determinations, selectedDeterminations]);

    const handleDetKeyDown = (e: React.KeyboardEvent) => {
        if (!showDetList || filteredDets.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveDetIndex(prev => (prev < filteredDets.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveDetIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selected = filteredDets[activeDetIndex];
            if (selected) {
                setSelectedDeterminations(prev => [...prev, { ...selected, assigned: false }]);
                setDetSearch("");
                setShowDetList(false);
                setActiveDetIndex(0);
            }
        } else if (e.key === "Escape") {
            setShowDetList(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 pt-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 ${selectedPatient ? "mb-4" : "mb-8 flex-col text-center"}`}
            >
                <div className={`${selectedPatient ? "w-9 h-9 rounded-xl" : "w-14 h-14 rounded-2xl mb-1"} bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shadow-sm border border-blue-100 dark:border-blue-500/20 transition-all duration-500`}>
                    <Activity size={selectedPatient ? 18 : 24} className="text-blue-500" />
                </div>
                <div className={selectedPatient ? "flex flex-col" : ""}>
                    <h1 className={`${selectedPatient ? "text-lg" : "text-2xl"} font-extrabold tracking-tight transition-all duration-500 uppercase`}>
                        {editId ? "Editar Protocolo" : "Nuevo Ingreso"}
                    </h1>
                    {!selectedPatient && (
                        <p className="text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto mt-3 text-sm">
                            Busque un paciente para generar un protocolo o registre uno nuevo.
                        </p>
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl p-5 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 border border-zinc-100 dark:border-zinc-800"
            >
                {selectedPatient ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                        {/* Header Grid: Paciente y Datos del Protocolo */}
                        <div className="grid lg:grid-cols-2 gap-3">
                            {/* Card Paciente Compacta */}
                            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-blue-900/30 flex items-center justify-center font-bold text-blue-600 shadow-sm text-[10px] shrink-0">
                                        {selectedPatient.apellido.charAt(0)}{selectedPatient.nombre.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100 truncate leading-none">
                                                {selectedPatient.apellido}, {selectedPatient.nombre}
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setPatientToEdit(selectedPatient);
                                                    setPatientModalOpen(true);
                                                }}
                                                className="p-1 rounded-md text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-colors"
                                            >
                                                <Info size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-blue-600/70 dark:text-blue-400/70 font-bold tracking-tight uppercase">
                                            <span>DNI: {selectedPatient.documento}</span>
                                            {selectedPatient.edad && <span>• {selectedPatient.edad}a</span>}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-900/60 rounded-lg transition-all border border-blue-200/50 dark:border-blue-800/50 shrink-0 ml-2"
                                >
                                    Cambiar
                                </button>
                            </div>

                            {/* Datos del Protocolo Compactos (Médico) */}
                            <div className="flex flex-col">
                                {selectedDoctorId || doctorSearch === "SIN MÉDICO / PARTICULAR" ? (
                                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 tracking-tight h-full">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-zinc-900/30 flex items-center justify-center font-black text-zinc-500 shadow-sm text-[10px] shrink-0">
                                                DR
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-xs text-zinc-800 dark:text-zinc-100 truncate leading-none mb-1">
                                                    {selectedDoctorId
                                                        ? `${doctors.find(d => d.id === selectedDoctorId)?.apellido}, ${doctors.find(d => d.id === selectedDoctorId)?.nombre}`
                                                        : "SIN MÉDICO / PARTICULAR"}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-black uppercase">
                                                    {selectedDoctorId && doctors.find(d => d.id === selectedDoctorId)?.matriculaProvincial
                                                        ? `Mat. ${doctors.find(d => d.id === selectedDoctorId)?.matriculaProvincial}`
                                                        : "Particular"}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setSelectedDoctorId("");
                                                setDoctorSearch("");
                                                setShowDoctorList(true);
                                            }}
                                            className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-all border border-zinc-200 dark:border-zinc-700 shrink-0 ml-2"
                                        >
                                            Cambiar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-100 dark:border-zinc-800/50 relative h-full flex items-center">
                                        <div className="relative group w-full">
                                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                value={doctorSearch}
                                                onChange={(e) => {
                                                    setDoctorSearch(e.target.value);
                                                    setShowDoctorList(true);
                                                    setActiveDoctorIndex(0);
                                                }}
                                                onFocus={() => {
                                                    setShowDoctorList(true);
                                                    setActiveDoctorIndex(0);
                                                }}
                                                onKeyDown={handleDoctorKeyDown}
                                                placeholder="Seleccionar médico..."
                                                className="w-full h-9 pl-10 pr-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500/50 rounded-xl text-xs outline-none transition-all placeholder:text-zinc-400 font-medium shadow-sm"
                                            />

                                            {showDoctorList && (
                                                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 top-full left-0">
                                                    <div className="max-h-60 overflow-y-auto p-2">
                                                        {filteredDoctors.map((doc, index) => {
                                                            return (
                                                                <div
                                                                    key={doc.id}
                                                                    onClick={() => {
                                                                        setSelectedDoctorId(doc.id);
                                                                        setDoctorSearch(`${doc.apellido}, ${doc.nombre}`);
                                                                        setShowDoctorList(false);
                                                                        logAction({
                                                                            action: "SELECCION_MEDICO",
                                                                            entity: "Doctor",
                                                                            entityId: doc.id,
                                                                            details: `Médico seleccionado: ${doc.apellido}, ${doc.nombre}`
                                                                        });
                                                                    }}
                                                                    onMouseEnter={() => setActiveDoctorIndex(index)}
                                                                    className={cn(
                                                                        "p-3 rounded-xl cursor-pointer transition-colors",
                                                                        activeDoctorIndex === index
                                                                            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 font-bold"
                                                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                                    )}
                                                                >
                                                                    <div className="text-sm font-bold">{doc.apellido}, {doc.nombre}</div>
                                                                    {doc.matriculaProvincial && (
                                                                        <div className="text-[10px] opacity-60 uppercase tracking-tighter">Mat. {doc.matriculaProvincial}</div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        <div
                                                            onClick={() => {
                                                                setSelectedDoctorId("");
                                                                setDoctorSearch("SIN MÉDICO / PARTICULAR");
                                                                setShowDoctorList(false);
                                                                logAction({
                                                                    action: "SELECCION_MEDICO",
                                                                    details: "Médico seleccionado: SIN MÉDICO / PARTICULAR"
                                                                });
                                                            }}
                                                            onMouseEnter={() => setActiveDoctorIndex(filteredDoctors.length)}
                                                            className={cn(
                                                                "p-3 mt-1 mb-1 rounded-xl cursor-pointer text-xs font-bold transition-colors border-t border-zinc-100 dark:border-zinc-800 pt-4",
                                                                activeDoctorIndex === filteredDoctors.length
                                                                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                                                                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                            )}
                                                        >
                                                            SIN MÉDICO / PARTICULAR
                                                        </div>

                                                        <div className="p-2 mt-1 border-t border-zinc-100 dark:border-zinc-800">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDoctorModalOpen(true);
                                                                    setShowDoctorList(false);
                                                                }}
                                                                className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-blue-500/20"
                                                            >
                                                                <UserPlus size={14} /> Nuevo Médico
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                        {showDoctorList && (
                                            <div className="fixed inset-0 z-40" onClick={() => setShowDoctorList(false)} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grid de Determinaciones */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-2">
                                <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Análisis seleccionados</h4>
                                {selectedDeterminations.length > 0 && (
                                    <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                                        {selectedDeterminations.length} ITEMS
                                    </span>
                                )}
                            </div>

                            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-xl shadow-zinc-200/50 dark:shadow-black/20 overflow-hidden flex flex-col">
                                <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                                    <div className="relative group max-w-2xl mx-auto">
                                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            value={detSearch}
                                            onChange={(e) => {
                                                setDetSearch(e.target.value);
                                                setShowDetList(true);
                                                setActiveDetIndex(0);
                                            }}
                                            onFocus={() => {
                                                setShowDetList(true);
                                                setActiveDetIndex(0);
                                            }}
                                            onKeyDown={handleDetKeyDown}
                                            placeholder="Buscar código o nombre para agregar..."
                                            className="w-full h-10 pl-11 pr-5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-blue-500/30 rounded-xl text-xs outline-none transition-all placeholder:text-zinc-400 font-medium shadow-sm"
                                        />

                                        {showDetList && (
                                            <div className="absolute top-full z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden min-h-[100px]">
                                                <div className="max-h-60 overflow-y-auto p-2">
                                                    {filteredDets.length > 0 ? filteredDets.map((det, index) => (
                                                        <div
                                                            key={det.id}
                                                            onClick={() => {
                                                                setSelectedDeterminations(prev => [...prev, { ...det, assigned: false }]);
                                                                setDetSearch("");
                                                                setShowDetList(false);
                                                                setActiveDetIndex(0);
                                                            }}
                                                            onMouseEnter={() => setActiveDetIndex(index)}
                                                            className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${activeDetIndex === index ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {det.codigo && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                                                                        {det.codigo}
                                                                    </span>
                                                                )}
                                                                <div className="text-sm font-bold">{det.nombre}</div>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="p-4 text-center text-zinc-400 text-xs italic">
                                                            No se encontraron resultados
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {showDetList && (
                                            <div className="fixed inset-0 z-40" onClick={() => setShowDetList(false)} />
                                        )}
                                    </div>
                                </div>
                                <div 
                                    ref={determinationsListRef}
                                    className="overflow-x-auto min-h-[100px] max-h-[400px] overflow-y-auto custom-scrollbar"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                                                <th className="px-5 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Código</th>
                                                <th className="px-5 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Determinación</th>
                                                <th className="px-5 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-wider">Sección</th>
                                                <th className="px-5 py-2 text-[9px] font-black text-zinc-400 uppercase tracking-wider text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                            {selectedDeterminations.length > 0 ? (
                                                selectedDeterminations.map((det) => (
                                                    <tr key={det.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors h-10">
                                                        <td className="px-5 py-1">
                                                            {det.codigo ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-100 dark:border-blue-800/30">
                                                                    {det.codigo}
                                                                </span>
                                                            ) : <span className="text-zinc-300">—</span>}
                                                        </td>
                                                        <td className="px-5 py-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-bold text-xs text-zinc-800 dark:text-zinc-100">
                                                                    {det.nombre}
                                                                </div>
                                                                <button
                                                                    onClick={() => {
                                                                        setInfoDetId(det.id);
                                                                        setInfoDetName(det.nombre);
                                                                        setInfoModalOpen(true);
                                                                    }}
                                                                    className="p-1 rounded-md text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all opacity-0 group-hover:opacity-100"
                                                                    title="Ver subdeterminaciones"
                                                                >
                                                                    <Activity size={10} />
                                                                </button>
                                                            </div>
                                                            {det.abreviatura && (
                                                                <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter opacity-70 leading-none">{det.abreviatura}</div>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-1">
                                                            {det.section ? (
                                                                <span className="text-[10px] font-black text-zinc-400 flex items-center gap-1.5 uppercase tracking-tighter">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                                                                    {det.section.nombre}
                                                                </span>
                                                            ) : <span className="text-zinc-300">—</span>}
                                                        </td>
                                                        <td className="px-5 py-1 text-right">
                                                            <div className="flex items-center justify-end gap-0.5">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedDeterminations(prev => prev.map(d =>
                                                                            d.id === det.id ? { ...d, assigned: !d.assigned } : d
                                                                        ));
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border transition-all ${det.assigned
                                                                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                                                        : "text-zinc-300 border-transparent hover:text-emerald-500 hover:bg-emerald-50"
                                                                        }`}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        toast.info(`Imprimiendo: ${det.nombre}`);
                                                                        setSelectedDeterminations(prev => prev.map(d =>
                                                                            d.id === det.id ? { ...d, printed: true } : d
                                                                        ));
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border transition-all ${det.printed
                                                                        ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                                                                        : "text-zinc-300 border-transparent hover:text-blue-500 hover:bg-blue-50"
                                                                        }`}
                                                                >
                                                                    <Printer size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => setSelectedDeterminations(prev => prev.filter(d => d.id !== det.id))}
                                                                    className="p-1.5 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                                                        No hay análisis seleccionados. Use el buscador superior para agregar.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        </div>

                        {/* Notas del Protocolo */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                             <div className="flex items-center gap-2 mb-2 px-2">
                                 <StickyNote className="text-amber-500" size={16} />
                                 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Notas y Observaciones</h4>
                             </div>
                             <textarea
                                 value={notes}
                                 onChange={(e) => setNotes(e.target.value)}
                                 placeholder="Observaciones internas..."
                                 className="w-full min-h-[60px] p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium resize-none placeholder:text-zinc-400 shadow-inner"
                             />
                        </div>

                        {/* Acciones Finales */}
                        <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                {editId && (
                                    <button
                                        onClick={() => window.open(`/admin/protocolos/${editId}/labels`, '_blank')}
                                        className="px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors flex items-center gap-2 border border-amber-100 dark:border-amber-500/20"
                                    >
                                        Etiquetas
                                        <Tag size={13} />
                                    </button>
                                )}
                                <button
                                    onClick={handleCalculateBudget}
                                    disabled={calculatingBudget || selectedDeterminations.length === 0}
                                    className="px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors flex items-center gap-2 border border-emerald-100 dark:border-emerald-500/20"
                                >
                                    {calculatingBudget ? "..." : (editId ? "Costo" : "Presupuesto")}
                                    <DollarSign size={13} />
                                </button>
                                {editId && (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 border border-red-100 dark:border-red-500/20"
                                    >
                                        Borrar
                                        <Trash2 size={13} />
                                    </button>
                                )}
                                <button
                                    onClick={handleGenerateProtocol}
                                    disabled={generatingProtocol || selectedDeterminations.length === 0}
                                    className="inline-flex items-center justify-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                                >
                                    {generatingProtocol ? "..." : editId ? "Guardar" : "Generar"}
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative mb-8">
                            <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handlePatientKeyDown}
                                placeholder="Buscar por DNI, apellido o nombre..."
                                autoFocus
                                className="w-full h-16 pl-16 pr-6 bg-zinc-50 dark:bg-zinc-950 border-2 border-transparent focus:border-blue-500/30 rounded-3xl text-lg outline-none transition-all placeholder:text-zinc-400 font-medium"
                            />
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-zinc-400 animate-pulse">
                                Buscando pacientes...
                            </div>
                        ) : search.trim().length > 0 && patients.length === 0 ? (
                            <div className="py-10 text-center">
                                <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus size={24} className="text-zinc-400" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">No se encontraron pacientes</h3>
                                <p className="text-zinc-500 mb-6">No hay registros que coincidan con la búsqueda.</p>
                                <button
                                    onClick={() => {
                                        setPatientToEdit(null);
                                        setPatientModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                                >
                                    <UserPlus size={18} /> Registrar Nuevo Paciente
                                </button>
                            </div>
                        ) : patients.length > 0 ? (
                            <div className="space-y-3">
                                {patients.map((patient, index) => (
                                    <div
                                        key={patient.id}
                                        onClick={() => handleSelectPatient(patient)}
                                        onMouseEnter={() => setActivePatientIndex(index)}
                                        className={cn(
                                            "group flex items-center justify-between p-4 rounded-3xl border cursor-pointer transition-all duration-200",
                                            activePatientIndex === index
                                                ? "border-blue-200 bg-blue-50/50"
                                                : "border-zinc-100 dark:border-zinc-800 hover:border-blue-200 hover:bg-blue-50/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 transition-colors",
                                                activePatientIndex === index && "bg-blue-100 text-blue-600"
                                            )}>
                                                {patient.apellido.charAt(0)}{patient.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className={cn("font-bold text-lg transition-colors", activePatientIndex === index && "text-blue-600")}>
                                                    {patient.apellido}, {patient.nombre}
                                                </h4>
                                                <div className="flex items-center gap-3 text-sm text-zinc-500 mt-0.5">
                                                    <span className="font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-xs">
                                                        DNI: {patient.documento}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={13} /> {patient.edad ? `${patient.edad} años` : "Edad N/A"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight size={18} className={cn("text-zinc-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all", activePatientIndex === index && "text-blue-500 translate-x-1")} />
                                    </div>
                                ))}
                            </div>

                        ) : (
                            <div className="py-12 text-center text-zinc-400">
                                Comience a escribir para buscar un paciente
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            <PatientModal
                patient={patientToEdit}
                open={patientModalOpen}
                onClose={() => {
                    setPatientModalOpen(false);
                    setPatientToEdit(null);
                }}
                onSaved={handlePatientSaved}
                laboratoryId={activeLabId}
            />

            <DoctorModal
                open={doctorModalOpen}
                onClose={() => setDoctorModalOpen(false)}
                onSaved={fetchDoctors}
            />

            <SubDeterminationsInfoModal
                open={infoModalOpen}
                onClose={() => setInfoModalOpen(false)}
                determinationId={infoDetId}
                determinationName={infoDetName}
            />

            <AnimatePresence>
                {showBudgetModal && budgetData && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-zinc-100 dark:border-zinc-800"
                        >
                            <div className="p-8 pb-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                                        <DollarSign className="text-emerald-500" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">Presupuesto Estimado</h2>
                                        <p className="text-xs text-zinc-500 font-medium">Valores basados en la cobertura actual</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowBudgetModal(false)}
                                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                                <div className="space-y-6">
                                    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Paciente</div>
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {budgetData.patient.apellido}, {budgetData.patient.nombre}
                                        </div>
                                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight mt-1">
                                            {budgetData.hiNombre}
                                        </div>
                                                 <div className="space-y-3">
                                         <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">Análisis</div>
                                         <div className="space-y-2">
                                             {budgetData.items.map((item: any) => (
                                                 <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-xl border border-zinc-100/50 dark:border-zinc-800/50">
                                                     <div className="flex flex-col">
                                                         <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                                             {item.nombre}
                                                         </span>
                                                         {item.codigo && (
                                                             <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tight">
                                                                 {item.codigo}
                                                             </span>
                                                         )}
                                                     </div>
                                                     <div className="flex items-center gap-1.5">
                                                         <span className="text-sm font-bold text-zinc-400">$</span>
                                                         <input 
                                                            type="number"
                                                            value={item.precio || 0}
                                                            step="0.01"
                                                            onChange={(e) => {
                                                                const newPrice = parseFloat(e.target.value) || 0;
                                                                const newItems = budgetData.items.map((it: any) => 
                                                                    it.id === item.id ? { ...it, precio: newPrice } : it
                                                                );
                                                                setBudgetData({
                                                                    ...budgetData,
                                                                    items: newItems,
                                                                    total: newItems.reduce((sum: number, it: any) => sum + it.precio, 0)
                                                                });
                                                            }}
                                                            className="w-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-sm font-bold text-emerald-600 dark:text-emerald-400 outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-right"
                                                         />
                                                     </div>
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             </div>

                             <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
                                 <div className="flex items-center justify-between px-1 mb-6">
                                     <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Total Estimado</div>
                                     <div className="text-2xl font-black text-emerald-500">
                                         $ {budgetData.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                     </div>
                                 </div>

                                 <div className="flex gap-3">
                                     <button
                                         onClick={() => setShowBudgetModal(false)}
                                         className="flex-1 h-12 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                                     >
                                         Cerrar
                                     </button>
                                     <button
                                         onClick={async () => {
                                            if (editId) {
                                                // If editing existing protocol, we can save these prices to results
                                                const loadingToast = toast.loading("Actualizando precios...");
                                                try {
                                                    const res = await fetch(`/api/protocols/${editId}/update-prices`, {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            prices: budgetData.items.map((it: any) => ({
                                                                determinationId: it.id,
                                                                precio: it.precio
                                                            }))
                                                        })
                                                    });
                                                    if (!res.ok) throw new Error("Error al actualizar precios");
                                                    toast.success("Precios actualizados", { id: loadingToast });
                                                } catch (err) {
                                                    toast.error("Error al guardar precios", { id: loadingToast });
                                                }
                                            }
                                            setShowBudgetModal(false);
                                            setSelectedDeterminations(budgetData.items);
                                         }}
                                         className="flex-[2] h-12 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                     >
                                         {editId ? "Guardar Precios" : "Confirmar Precios"}
                                     </button>
                                 </div>
                             </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal 
                open={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteProtocol}
                title="¿Eliminar Protocolo?"
                description="¿Está seguro que desea eliminar este protocolo y todos sus resultados? Esta acción no se puede deshacer."
                confirmLabel="Eliminar Protocolo"
                loading={deletingProtocol}
                variant="danger"
            />
        </div>
    );
}
