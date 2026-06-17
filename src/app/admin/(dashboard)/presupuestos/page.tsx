"use client";
import { toast } from "sonner";

import React, { useState, useEffect, useCallback } from "react";
import { Receipt, Plus, Search, Trash2, Calendar, User, Eye, Download, Mail, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface BudgetItem {
    id: string;
    nombre: string;
    codigo: number;
    ub: number;
    valor: number;
    healthInsuranceNombre: string;
}

interface Budget {
    id: string;
    paciente: string | null;
    telefono: string | null;
    email: string | null;
    total: number;
    healthInsuranceNombre: string;
    sentAt: string | null;
    createdAt: string;
    items?: BudgetItem[];
}

export default function AdminBudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [confirmDelete, setConfirmDelete] = useState<Budget | null>(null);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [downloadLoading, setDownloadLoading] = useState<string | null>(null);

    const load = useCallback(async (q = "", date = "") => {
        setLoading(true);
        try {
            const labId = localStorage.getItem('selectedLaboratoryId') || '';
            const res = await fetch(`/api/budgets?q=${encodeURIComponent(q)}&date=${date}&labId=${labId}`);
            const data = await res.json();
            setBudgets(data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(search, selectedDate); }, [load, search, selectedDate]);

    const handleDownloadPDF = async (budget: Budget) => {
        setDownloadLoading(budget.id);
        try {
            const res = await fetch(`/api/budgets/${budget.id}/download-pdf`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Presupuesto_${budget.paciente?.replace(/\s+/g, "_") || "LB_Lab"}.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                toast.error("Error al intentar descargar el HTML.");
            }
        } catch (error) {
            toast.error("Error de conexión al intentar descargar el HTML.");
        } finally {
            setDownloadLoading(null);
        }
    };

    const handleSendEmail = async (budget: Budget) => {
        if (!budget.email) {
            toast.error("Este presupuesto no tiene un email cargado.");
            return;
        }

        setSendingEmailId(budget.id);
        try {
            const res = await fetch(`/api/budgets/${budget.id}/send-email`, { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                const now = data.sentAt || new Date().toISOString();
                // Actualizar en la lista local
                setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, sentAt: now } : b));
                // Actualizar en el modal si está abierto
                if (selectedBudget?.id === budget.id) {
                    setSelectedBudget(prev => prev ? { ...prev, sentAt: now } : null);
                }
                toast.success("Email enviado correctamente a " + budget.email);
            } else {
                toast.error("Error: " + (data.error || "No se pudo enviar el email"));
            }
        } catch (error) {
            toast.error("Error de conexión al intentar enviar el email.");
        } finally {
            setSendingEmailId(null);
        }
    };

    const handleViewDetails = async (budget: Budget) => {
        setDetailsLoading(true);
        setSelectedBudget(budget);
        try {
            const res = await fetch(`/api/budgets/${budget.id}`);
            if (res.ok) {
                const fullData = await res.json();
                setSelectedBudget(fullData);
            }
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleDelete = async (budget: Budget) => {
        setDeleteLoading(true);
        const res = await fetch(`/api/budgets/${budget.id}`, { method: "DELETE" });
        if (res.ok) {
            setBudgets((prev) => prev.filter((b) => b.id !== budget.id));
        }
        setDeleteLoading(false);
        setConfirmDelete(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    };

    return (
        <>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Receipt size={22} className="text-zinc-400" />
                        <h1 className="text-2xl font-bold tracking-tight">Presupuestos</h1>
                        <span className="text-sm text-zinc-400">({budgets.length})</span>
                    </div>
                    <Link
                        href="/admin/presupuestos/nuevo"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                    >
                        <Plus size={16} /> Nuevo presupuesto
                    </Link>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por paciente u obra social / prepaga..."
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all placeholder:text-zinc-400"
                        />
                    </div>

                    <div className="relative w-full md:w-48">
                        <Calendar size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-all text-zinc-600 dark:text-zinc-300"
                        />
                    </div>

                    {selectedDate && (
                        <button
                            onClick={() => setSelectedDate("")}
                            className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-900 transition-colors"
                        >
                            Limpiar fecha
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 rounded-4xl overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-sm">
                    {loading ? (
                        <div className="p-20 text-center text-zinc-400 text-sm">Cargando presupuestos...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                                        <th className="px-5 py-4 font-semibold text-zinc-500">Paciente</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500">OS / Prepaga</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-right">Total</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-center">Enviado</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-center">Fecha</th>
                                        <th className="px-5 py-4 font-semibold text-zinc-500 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgets.length > 0 ? (
                                        budgets.map((budget) => (
                                            <tr
                                                key={budget.id}
                                                className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                                            <User size={14} className="text-zinc-500" />
                                                        </div>
                                                        <span className="font-medium">{budget.paciente || "Sin nombre"}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-medium">
                                                        {budget.healthInsuranceNombre || "Personalizado"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-right font-bold text-zinc-700 dark:text-zinc-200">
                                                    ${budget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    {budget.sentAt ? (
                                                        <div className="flex flex-col items-center gap-0.5" title={formatDate(budget.sentAt)}>
                                                            <div className="flex items-center gap-1 text-blue-500 font-bold text-[10px] uppercase">
                                                                <Mail size={10} />
                                                                Enviado
                                                            </div>
                                                            <span className="text-[10px] text-zinc-400 font-medium">
                                                                {new Date(budget.sentAt).toLocaleString('es-AR', {
                                                                    day: '2-digit',
                                                                    month: '2-digit',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: false
                                                                })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-zinc-300">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-center text-zinc-500 text-xs text-nowrap">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <Calendar size={12} />
                                                        {formatDate(budget.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleViewDetails(budget)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                                            title="Ver detalles"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                        <button
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-500 transition-colors disabled:opacity-50"
                                                            title="Enviar por email"
                                                            onClick={() => handleSendEmail(budget)}
                                                            disabled={sendingEmailId === budget.id}
                                                        >
                                                            {sendingEmailId === budget.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete(budget)}
                                                            className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-20 text-center text-zinc-400">
                                                {search ? `Sin resultados para "${search}"` : "No hay presupuestos generados."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* View Details Modal */}
            <AnimatePresence>
                {selectedBudget && (
                    <>
                        <motion.div
                            key="details-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setSelectedBudget(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            key="details-modal"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-0 flex items-center justify-center z-50 px-4"
                        >
                            <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight mb-1">Detalle del Presupuesto</h2>
                                        <p className="text-sm text-zinc-400">{selectedBudget.paciente || "Sin nombre"}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBudget(null)}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
                                    >
                                        <Plus size={18} className="rotate-45" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Paciente</span>
                                            <p className="text-sm font-medium">{selectedBudget.paciente || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Teléfono</span>
                                            <p className="text-sm font-medium">{selectedBudget.telefono || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1 text-right md:text-left">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</span>
                                            <p className="text-sm font-medium truncate">{selectedBudget.email || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Fecha</span>
                                            <p className="text-sm font-medium">{formatDate(selectedBudget.createdAt)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Último Envío</span>
                                            <p className={`text-sm font-medium ${selectedBudget.sentAt ? "text-blue-500 font-bold" : "text-zinc-400"}`}>
                                                {selectedBudget.sentAt ? formatDate(selectedBudget.sentAt) : "No enviado"}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">${selectedBudget.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold flex items-center gap-2">
                                            <Receipt size={14} className="text-zinc-400" />
                                            Determinaciones Incluidas
                                        </h3>
                                        <div className="border border-zinc-100 dark:border-zinc-800 rounded-3xl overflow-hidden divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                            {detailsLoading ? (
                                                <div className="p-12 text-center text-zinc-400 text-sm italic">Cargando determinaciones...</div>
                                            ) : selectedBudget.items?.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-zinc-400">
                                                            {item.codigo}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-sm font-bold truncate leading-tight">{item.nombre}</div>
                                                            <div className="text-[10px] text-zinc-400 font-medium">UB: {item.ub} • {item.healthInsuranceNombre}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold font-mono">
                                                            ${item.valor.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                                    <button
                                        onClick={() => handleDownloadPDF(selectedBudget)}
                                        disabled={downloadLoading === selectedBudget.id}
                                        className="h-11 px-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-white dark:hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {downloadLoading === selectedBudget.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Download size={16} />
                                        )}
                                        Descargar
                                    </button>
                                    <button
                                        onClick={() => handleSendEmail(selectedBudget)}
                                        disabled={sendingEmailId === selectedBudget.id}
                                        className="h-11 px-6 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {sendingEmailId === selectedBudget.id ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                                        Enviar por Email
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Delete Confirm */}
            <AnimatePresence>
                {confirmDelete && (
                    <>
                        <motion.div
                            key="del-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setConfirmDelete(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            key="del-modal"
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 12 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed inset-0 flex items-center justify-center z-50 px-4"
                        >
                            <div className="bg-white dark:bg-zinc-900 rounded-4xl shadow-2xl border border-zinc-100 dark:border-zinc-800 w-full max-w-sm p-8 text-center">
                                <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mx-auto mb-5">
                                    <Trash2 size={22} className="text-rose-500" />
                                </div>
                                <h2 className="text-lg font-bold mb-2">¿Eliminar presupuesto?</h2>
                                <p className="text-sm text-zinc-500 mb-8">
                                    Se borrará permanentemente de la lista.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="flex-1 h-11 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(confirmDelete)}
                                        disabled={deleteLoading}
                                        className="flex-1 h-11 bg-rose-500 text-white rounded-2xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
        </>
    );
}
