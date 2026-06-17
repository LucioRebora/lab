"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Beaker, LibraryBig, Search, Activity, XCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { DeterminationModal, type Determination } from "@/components/admin/DeterminationModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function DeterminationsPage() {
    const [determinations, setDeterminations] = useState<Determination[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDetermination, setSelectedDetermination] = useState<Determination | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [methods, setMethods] = useState<any[]>([]);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
    const [currentPage, setCurrentPage] = useState(1);
    const [confirmDelete, setConfirmDelete] = useState<Determination | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const itemsPerPage = 10;
    const router = useRouter();

    const loadDeterminations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/determinations");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDeterminations(data);
        } catch (error) {
            toast.error("Error al cargar las determinaciones");
        } finally {
            setLoading(false);
        }
    };

    const loadMethods = async () => {
        try {
            const res = await fetch("/api/methods");
            if (res.ok) {
                const data = await res.json();
                setMethods(data);
            }
        } catch (error) {
            console.error("Failed to load methods");
        }
    };

    useEffect(() => {
        loadDeterminations();
        loadMethods();
        const handleLabChange = () => {
            loadDeterminations();
            loadMethods();
        };
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (det: Determination) => {
        setSelectedDetermination(det);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/determinations/${confirmDelete.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Determinación eliminada");
            setConfirmDelete(null);
            loadDeterminations();
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filtered = determinations.filter(det => {
        const methodName = methods.find(m => m.id === (det as any).methodId)?.nombre || (det as any).method?.nombre || "";
        const matchesStatus =
            statusFilter === "all" ? true :
                statusFilter === "active" ? det.activa : !det.activa;

        return (
            det.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            det.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            det.abreviatura?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            methodName.toLowerCase().includes(searchTerm.toLowerCase())
        ) && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center">
                        <Beaker size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Determinaciones</h1>
                        <p className="text-sm text-zinc-500 font-medium">Estudios base para presupuestos y perfiles</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm appearance-none cursor-pointer font-medium"
                        >
                            <option value="active">Solo Activas</option>
                            <option value="inactive">Solo Inactivas</option>
                            <option value="all">Todas</option>
                        </select>
                    </div>
                    <div className="relative group sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por código o nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500 transition-colors animate-in fade-in zoom-in-75 duration-200"
                            >
                                <XCircle size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => {
                            setSelectedDetermination(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nueva
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto custom-scrollbar w-full">
                    <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-24">Código</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 min-w-[200px]">Nombre</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 w-24">Abrev.</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Sección</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Método</th>
                            <th className="px-6 py-4 font-semibold text-center text-zinc-600 dark:text-zinc-400 w-24">Estado</th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400 w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {paginatedItems.length > 0 ? (
                            paginatedItems.map((det) => (
                                <tr key={det.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        {det.codigo ? (
                                            <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-100 dark:border-blue-800/30 text-[11px] uppercase tracking-wider">
                                                {det.codigo}
                                            </span>
                                        ) : (
                                            <span className="text-zinc-300">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 whitespace-normal">
                                        {det.nombre}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                        {det.abreviatura ? <span className="inline-flex px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">{det.abreviatura}</span> : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                        {det.section ? <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-bold"><LibraryBig size={12} />{det.section.nombre}</span> : "—"}
                                    </td>
                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                                        {(() => {
                                            const method = methods.find(m => m.id === (det as any).methodId) || (det as any).method;
                                            if (!method) return "—";
                                            const name = method.nombre || "";
                                            const truncated = name.length > 30 ? name.substring(0, 30) + "..." : name;
                                            return (
                                                <span 
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/30"
                                                    title={name}
                                                >
                                                    <Beaker size={12} />
                                                    {truncated}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${det.activa ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${det.activa ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                            {det.activa ? 'Activa' : 'Inactiva'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/sub-determinaciones?determinationId=${det.id}`)}
                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-blue-500 hover:text-blue-600 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                                title="Configurar Sub-Determinaciones"
                                            >
                                                <Activity size={14} />
                                            </button>
                                            <button onClick={() => handleEdit(det)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"><Edit2 size={14} /></button>
                                            <button onClick={() => setConfirmDelete(det)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500 hover:bg-rose-50 border border-zinc-200 dark:border-zinc-700 shadow-sm"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                        <Beaker className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin determinaciones</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                        {searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay determinaciones configuradas para este laboratorio."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-800/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider order-2 sm:order-1">
                        Mostrando <span className="text-zinc-900 dark:text-zinc-100 font-black">{((currentPage - 1) * itemsPerPage) + 1}</span> a <span className="text-zinc-900 dark:text-zinc-100 font-black">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> de <span className="text-zinc-900 dark:text-zinc-100 font-black">{filtered.length}</span> resultados
                    </p>
                    <div className="flex items-center gap-1.5 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {(() => {
                                const pages = [];
                                const maxVisible = 5;
                                let start = Math.max(1, currentPage - 2);
                                let end = Math.min(totalPages, start + maxVisible - 1);
                                
                                if (end === totalPages) {
                                    start = Math.max(1, end - maxVisible + 1);
                                }

                                for (let i = start; i <= end; i++) {
                                    pages.push(
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i)}
                                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentPage === i
                                                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105'
                                                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                                                }`}
                                        >
                                            {i}
                                        </button>
                                    );
                                }
                                return pages;
                            })()}
                        </div>

                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-30 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>

            <DeterminationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadDeterminations}
                determination={selectedDetermination}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="¿Eliminar Determinación?"
                description={`Esta acción eliminará permanentemente la determinación <b>${confirmDelete?.nombre}</b> y todas sus configuraciones asociadas.`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
