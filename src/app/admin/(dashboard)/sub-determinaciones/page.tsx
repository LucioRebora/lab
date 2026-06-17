"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Layers, Beaker, Search, Info, XCircle, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { SubDeterminationModal, type SubDetermination } from "@/components/admin/SubDeterminationModal";
import { ReferenceValueSettingsModal } from "@/components/admin/ReferenceValueSettingsModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { toast } from "sonner";

export default function SubDeterminationsPage() {
    const [subDeterminations, setSubDeterminations] = useState<SubDetermination[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSub, setSelectedSub] = useState<SubDetermination | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVrSub, setSelectedVrSub] = useState<SubDetermination | null>(null);
    const [vrModalOpen, setVrModalOpen] = useState(false);
    const [determinations, setDeterminations] = useState<any[]>([]);
    const [selectedDetId, setSelectedDetId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("active");
    const [confirmDelete, setConfirmDelete] = useState<SubDetermination | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const determinationIdFromUrl = searchParams.get("determinationId");

    const loadSubDeterminations = async () => {
        setLoading(true);
        try {
            const labId = localStorage.getItem("selectedLaboratoryId");
            // Load ALL sub-determinations for the laboratory (including inactive ones)
            const res = await fetch(`/api/sub-determinations?laboratoryId=${labId}&all=true`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setSubDeterminations(data);
        } catch (error) {
            toast.error("Error al cargar las sub-determinaciones");
        } finally {
            setLoading(false);
        }
    };

    const loadDeterminations = async () => {
        try {
            const res = await fetch("/api/determinations");
            if (res.ok) setDeterminations(await res.json());
        } catch (error) {
            console.error("Error fetching determinations", error);
        }
    };

    useEffect(() => {
        if (determinationIdFromUrl) {
            setSelectedDetId(determinationIdFromUrl);
        } else {
            setSelectedDetId(null);
        }
    }, [determinationIdFromUrl]);

    useEffect(() => {
        loadSubDeterminations();
        loadDeterminations();
        const handleLabChange = () => {
            loadSubDeterminations();
            loadDeterminations();
        };
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (sub: SubDetermination) => {
        setSelectedSub(sub);
        setModalOpen(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/sub-determinations/${confirmDelete.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Sub-determinación eliminada");
            setConfirmDelete(null);
            loadSubDeterminations();
        } catch (error) {
            toast.error("Error al eliminar");
        } finally {
            setDeleteLoading(false);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filtered = subDeterminations.filter(sub => {
        const matchesSearch =
            sub.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.determination?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDet = !selectedDetId || sub.determinationId === selectedDetId;

        const matchesStatus =
            statusFilter === "all" ? true :
                statusFilter === "active" ? sub.activa : !sub.activa;

        return matchesSearch && matchesDet && matchesStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDetId, statusFilter]);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando...</div>;
    }

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Sub-Determinaciones</h1>
                        <p className="text-sm text-zinc-500 font-medium">Componentes detallados de los análisis</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group sm:w-80 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                            <select
                                value={selectedDetId || ""}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedDetId(val || null);
                                    if (val) router.push(`/admin/sub-determinaciones?determinationId=${val}`, { scroll: false });
                                    else router.push('/admin/sub-determinaciones', { scroll: false });
                                }}
                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm appearance-none cursor-pointer font-medium"
                            >
                                <option value="">Todas las determinaciones</option>
                                {determinations.map(d => (
                                    <option key={d.id} value={d.id}>{d.nombre}</option>
                                ))}
                            </select>
                            {selectedDetId && (
                                <button
                                    onClick={() => {
                                        setSelectedDetId(null);
                                        router.push('/admin/sub-determinaciones', { scroll: false });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-rose-500 transition-colors"
                                    title="Limpiar determinación"
                                >
                                    <XCircle size={16} />
                                </button>
                            )}
                        </div>
                    </div>

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
                            placeholder="Buscar..."
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
                            setSelectedSub(null);
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
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Nombre</th>
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Determinación</th>
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Unidad</th>
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Formato</th>
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-center">Estado</th>
                                <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400 text-center">Config</th>
                                <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {paginatedItems.length > 0 ? (
                                paginatedItems.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100 break-words max-w-[200px]">
                                            {sub.nombre}
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 text-xs font-bold border border-violet-100 dark:border-violet-800/30 break-words">
                                                <Beaker size={12} className="shrink-0" />
                                                {sub.determination?.nombre}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                            {sub.unit?.nombre || <span className="text-zinc-300">—</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                                                {sub.formato || "TXT"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${sub.activa ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800/30'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${sub.activa ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                {sub.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {sub.informar && <span title="Se informa" className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />}
                                                {sub.calcular && <span title="Se calcula" className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40" />}
                                                {sub.informarVR && <span title="Informa VR" className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/40" />}
                                                {sub.informarCorteDespues && <span title="Salto de línea" className="w-2 h-2 rounded-full bg-purple-500 shadow-sm shadow-purple-500/40" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 transition-opacity">
                                                <button
                                                    onClick={() => {
                                                        setSelectedVrSub(sub);
                                                        setVrModalOpen(true);
                                                    }}
                                                    title="Configurar Valores de Referencia"
                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-blue-500 hover:text-blue-600 border border-zinc-200 dark:border-zinc-700 shadow-sm"
                                                >
                                                    <Info size={14} />
                                                </button>
                                                <button onClick={() => handleEdit(sub)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"><Edit2 size={14} /></button>
                                                <button onClick={() => setConfirmDelete(sub)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500 hover:bg-rose-50 border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                            <Layers className="text-zinc-400" size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin sub-determinaciones</h3>
                                        <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                            {searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay sub-determinaciones configuradas."}
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
                                    if (end === totalPages) start = Math.max(1, end - maxVisible + 1);
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

            <SubDeterminationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadSubDeterminations}
                subDetermination={selectedSub}
            />

            <ReferenceValueSettingsModal
                open={vrModalOpen}
                onClose={() => setVrModalOpen(false)}
                subDeterminationId={selectedVrSub?.id || null}
                subDeterminationName={selectedVrSub?.nombre || null}
            />

            <ConfirmModal
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title="¿Eliminar Sub-Determinación?"
                description={`Esta acción eliminará permanentemente el componente <b>${confirmDelete?.nombre}</b> y sus vinculaciones. ¿Deseas continuar?`}
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
                variant="danger"
            />
        </div>
    );
}
