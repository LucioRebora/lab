"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Type, Search } from "lucide-react";
import { AbbreviationModal, type Abbreviation } from "@/components/admin/AbbreviationModal";
import { toast } from "sonner";

export default function AbbreviationsPage() {
    const [abbreviations, setAbbreviations] = useState<Abbreviation[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAbbr, setSelectedAbbr] = useState<Abbreviation | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const loadAbbreviations = async () => {
        setLoading(true);
        try {
            const labId = localStorage.getItem("selectedLaboratoryId");
            const res = await fetch(`/api/abbreviations?laboratoryId=${labId}`);
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setAbbreviations(data);
        } catch (error) {
            toast.error("Error al cargar las abreviaturas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAbbreviations();
        const handleLabChange = () => loadAbbreviations();
        window.addEventListener('laboratoryChanged', handleLabChange);
        return () => window.removeEventListener('laboratoryChanged', handleLabChange);
    }, []);

    const handleEdit = (abbr: Abbreviation) => {
        setSelectedAbbr(abbr);
        setModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        toast("¿Está seguro de eliminar esta abreviatura?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/abbreviations/${id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Error al eliminar");
                        toast.success("Abreviatura eliminada");
                        loadAbbreviations();
                    } catch (error) {
                        toast.error("Error al eliminar");
                    }
                }
            },
            cancel: {
                label: "Cancelar",
                onClick: () => { }
            }
        });
    };

    const filtered = abbreviations.filter(abbr =>
        abbr.resultado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        abbr.abreviatura.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Cargando...</div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center">
                        <Type size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Abreviatura de Resultados</h1>
                        <p className="text-sm text-zinc-500 font-medium">Atajos de texto para resultados frecuentes</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-violet-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSelectedAbbr(null);
                            setModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm"
                    >
                        <Plus size={18} />
                        Nueva
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-4xl border border-zinc-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Resultado</th>
                            <th className="px-6 py-4 font-semibold text-zinc-600 dark:text-zinc-400">Abreviatura</th>
                            <th className="px-6 py-4 font-semibold text-right text-zinc-600 dark:text-zinc-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {filtered.length > 0 ? (
                            filtered.map((abbr) => (
                                <tr key={abbr.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-100">
                                        {abbr.resultado}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                                            {abbr.abreviatura}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(abbr)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(abbr.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 text-rose-500 hover:bg-rose-50 border border-zinc-200 dark:border-zinc-700 shadow-sm"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                                        <Type className="text-zinc-400" size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Sin abreviaturas</h3>
                                    <p className="text-sm text-zinc-500 max-w-sm mx-auto whitespace-normal">
                                        {searchTerm ? "No se encontraron resultados para tu búsqueda." : "No hay abreviaturas configuradas."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <AbbreviationModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={loadAbbreviations}
                abbreviation={selectedAbbr}
            />
        </div>
    );
}
