"use client";

import { useEffect, useState, use } from "react";
import { Loader2 } from "lucide-react";

interface WorksheetResult {
    id: string;
    protocol: {
        id: string;
        numeroSecuencial: string;
        patient: {
            apellido: string;
            nombre: string;
        };
        doctor?: {
            apellido: string;
            nombre: string;
        } | null;
    };
    determination: {
        nombre: string;
        abreviatura: string | null;
        sectionId: string | null;
    };
    sectionId: string | null;
    subResults?: any[];
}

interface SectionData {
    info: {
        id: string;
        nombre: string;
        worksheet?: { codigo: string } | null;
    };
    results: WorksheetResult[];
}

export default function HojasDeTrabajoAllPrintPage(props: { 
    searchParams: Promise<{ ids?: string }> 
}) {
    const searchParams = use(props.searchParams);
    const [sections, setSections] = useState<SectionData[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!searchParams.ids) return;

        try {
            const res = await fetch(`/api/sections/print-data-all?ids=${searchParams.ids}`);
            if (!res.ok) throw new Error("Failed to fetch print data");
            const data: SectionData[] = await res.json();
            setSections(data);
        } catch (error) {
            console.error("Error loading multiple sections print data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [searchParams.ids]);

    useEffect(() => {
        if (!loading && sections.length > 0) {
            // Set document title for filename when printing/saving
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;
            document.title = `Hojas de trabajo - ${timestamp}`;

            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading, sections]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950 no-print">
                <div className="flex flex-col items-center gap-4 text-zinc-400">
                    <Loader2 className="animate-spin" size={32} />
                    <p className="font-bold uppercase tracking-widest text-sm">Preparando Impresión Masiva...</p>
                </div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('es-AR');

    const renderSection = (section: SectionData) => {
        const worksheetCode = section.info.worksheet?.codigo || "OPP";
        const results = section.results;

        let content;

        if (worksheetCode === "OPD" || worksheetCode === "ISD") {
            const detMap = new Map<string, any>();
            results.forEach(r => {
                const detName = r.determination.nombre;
                if (!detMap.has(detName)) {
                    detMap.set(detName, {
                        name: detName,
                        results: []
                    });
                }
                detMap.get(detName).results.push(r);
            });
            const groupedByDet = Array.from(detMap.values());

            if (worksheetCode === "OPD") {
                content = (
                    <div className="space-y-4">
                        {groupedByDet.map((group, gIdx) => (
                            <div key={gIdx} className="break-inside-avoid">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className="px-3 py-1 rounded-full bg-sky-500 text-white text-[9px] font-black uppercase tracking-widest italic shadow-sm">
                                        {group.name}
                                    </div>
                                    <div className="flex-1 h-px bg-zinc-100" />
                                    <div className="text-[7px] font-black text-zinc-300 uppercase tracking-widest italic">{section.info.nombre}</div>
                                </div>
                                <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full border-collapse text-[9px]">
                                        <thead>
                                            <tr className="bg-zinc-50/50 border-b border-zinc-100">
                                                <th className="px-3 py-1 text-left font-black text-zinc-400 uppercase tracking-tighter w-12">ID</th>
                                                <th className="px-3 py-1 text-left font-black text-zinc-400 uppercase tracking-tighter">Paciente</th>
                                                <th className="px-4 py-1 text-right font-black text-zinc-400 uppercase tracking-tighter w-[65%]">Anotar / Resultado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-50">
                                            {group.results.map((r: any, rIdx: number) => (
                                                <tr key={rIdx} className="group even:bg-zinc-50/10">
                                                    <td className="px-3 py-2.5 font-mono font-black text-zinc-400 text-[8px]">
                                                        {r.protocol.numeroSecuencial}
                                                    </td>
                                                    <td className="px-3 py-2.5">
                                                        <span className="font-bold text-zinc-700 uppercase truncate">
                                                            {r.protocol.patient.apellido}, {r.protocol.patient.nombre}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-2.5 border-l border-zinc-50 text-zinc-100 text-right text-[7px] w-[65%]">
                                                        __________________________________________________________________________________________
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            } else {
                content = (
                    <div className="space-y-8">
                        {groupedByDet.map((group, gIdx) => (
                            <div key={gIdx} className="break-inside-avoid">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="px-4 py-1.5 rounded-full bg-sky-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-sky-500/20 italic">
                                        {group.name}
                                    </div>
                                    <div className="flex-1 h-px bg-zinc-100" />
                                    <div className="text-[8px] font-black text-zinc-300 uppercase tracking-widest italic">{section.info.nombre}</div>
                                </div>
                                <div className="space-y-5">
                                {group.results.map((r: any, rIdx: number) => (
                                    <div key={rIdx} className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm break-inside-avoid">
                                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-50/50 border-b border-zinc-100/50">
                                            <div className="px-2 py-0.5 rounded-lg bg-white border border-zinc-200 font-mono font-black text-[10px] text-zinc-500 shadow-sm">
                                                {r.protocol.numeroSecuencial}
                                            </div>
                                            <div className="flex-1 font-black text-[11px] uppercase tracking-wide text-zinc-800">
                                                {r.protocol.patient.apellido}, {r.protocol.patient.nombre}
                                            </div>
                                        </div>
                                        <div className="bg-white">
                                            {r.subResults && r.subResults.length > 0 ? (
                                                <div className="divide-y divide-zinc-50">
                                                    {r.subResults.map((sr: any, srIdx: number) => (
                                                        <div key={srIdx} className="flex divide-x divide-zinc-50">
                                                            <div className="w-[35%] py-2 px-4 flex items-center gap-3 text-[10px] font-bold uppercase text-zinc-600 truncate">
                                                                {sr.subDetermination.nombre}
                                                            </div>
                                                            <div className="w-[65%] py-2 px-6 flex items-center justify-end text-zinc-200 text-[8px] italic">
                                                                ____________________________________________________________________________________
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex divide-x divide-zinc-50 py-4 italic">
                                                    <div className="w-[35%] px-6 text-[10px] font-bold text-zinc-400 uppercase">Anotar Resultado</div>
                                                    <div className="w-[65%] px-8 text-right text-zinc-100">____________________________________________________________________________________</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
        } else {
            // Group by Protocol (OPP)
            const map = new Map<string, any>();
            results.forEach(r => {
                const protocolId = r.protocol.id;
                if (!map.has(protocolId)) {
                    map.set(protocolId, {
                        numeroSecuencial: r.protocol.numeroSecuencial,
                        patientName: `${r.protocol.patient.apellido}, ${r.protocol.patient.nombre}`,
                        doctorName: r.protocol.doctor ? `${r.protocol.doctor.apellido},, ${r.protocol.doctor.nombre}` : "SIN MÉDICO",
                        determinations: []
                    });
                }
                const detText = r.determination.abreviatura || r.determination.nombre;
                if (!map.get(protocolId)!.determinations.includes(detText)) {
                    map.get(protocolId)!.determinations.push(detText);
                }
            });
            const grouped = Array.from(map.values());

            content = (
                <div className="grid grid-cols-2 gap-x-3 gap-y-2 items-start">
                    {grouped.map((p: any, idx: number) => (
                        <div key={idx} className="border border-zinc-200 rounded-xl overflow-hidden break-inside-avoid shadow-sm print:shadow-none">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50/70 border-b border-zinc-100">
                                <div className="px-2 py-0.5 rounded-lg bg-white border border-zinc-200 font-mono font-black text-[10px] text-zinc-600 shadow-sm">
                                    {p.numeroSecuencial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-[10px] uppercase tracking-wider text-zinc-800 truncate">
                                        {p.patientName}
                                    </div>
                                    <div className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter truncate opacity-80">
                                        Médico: {p.doctorName}
                                    </div>
                                </div>
                            </div>
                            <div className={`px-3 py-1.5 bg-white ${worksheetCode === 'DER' ? 'divide-y divide-zinc-50' : 'space-y-1'}`}>
                                {p.determinations.map((det: string, dIdx: number) => (
                                    <div key={dIdx} className={`flex items-start gap-3 ${worksheetCode === 'DER' ? 'py-3 min-h-[55px]' : 'items-center gap-2'}`}>
                                        <div className={`rounded-full bg-sky-400/50 ${worksheetCode === 'DER' ? 'w-2 h-2 mt-1' : 'w-1 h-1'}`} />
                                        <span className="font-bold text-[9px] text-zinc-600 uppercase tracking-tighter leading-tight">
                                            {det}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div key={section.info.id} className="page-section mb-12 last:mb-0">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 italic">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Fecha</span>
                        <span className="text-xs font-black text-zinc-900">{today}</span>
                    </div>
                    <div className="text-center flex flex-col items-center">
                        <h1 className="text-lg font-black uppercase tracking-tighter text-zinc-900 leading-none">Hoja de Trabajo</h1>
                        <div className="w-10 h-1 bg-sky-500 rounded-full mt-1" />
                    </div>
                    <div className="text-right flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 leading-none mb-1">Sección</span>
                        <span className="text-xs font-black text-sky-600 uppercase italic leading-none">{section.info.nombre}</span>
                    </div>
                </div>
                {content}
            </div>
        );
    }

    return (
        <div className="bg-white text-zinc-900 min-h-screen p-4 font-sans antialiased print:p-0">
            {sections.map(section => renderSection(section))}

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 1cm;
                    }
                    body {
                        background: white;
                        color: black;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .page-section {
                        page-break-after: always;
                        min-height: 100vh;
                    }
                    .page-section:last-child {
                        page-break-after: auto !important;
                        min-height: auto !important;
                    }
                }
            `}</style>
        </div>
    );
}

