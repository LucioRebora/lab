"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Printer, ChevronLeft, MapPin, Phone, Mail, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Text } from 'recharts';

const HistoricalChart = ({ patientId, determinationId, determinationName }: { patientId: string, determinationId: string, determinationName: string }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`/api/protocols/history?patientId=${patientId}&determinationId=${determinationId}`);
                if (res.ok) {
                    const data = await res.json();
                    // Formatear fechas para mostrar en el eje X
                    const formattedData = data.map((d: any) => ({
                        ...d,
                        formattedDate: new Date(d.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
                        formattedTime: new Date(d.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
                    }));
                    setHistory(formattedData);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (patientId && determinationId) fetchHistory();
    }, [patientId, determinationId]);

    if (loading || history.length < 2) return null;

    const isDense = history.length > 20;

    return (
        <div className="mt-4 mb-8 p-4 bg-zinc-50/30 border border-zinc-100 rounded-2xl page-break-inside-avoid">
            <h4 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0 flex items-center gap-2">
                <Globe size={10} />
                Evolución Histórica: {determinationName}
            </h4>
            <div className="h-[240px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 60, right: 30, left: -20, bottom: isDense ? 60 : 30 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                        <XAxis 
                            dataKey="formattedDate" 
                            axisLine={false} 
                            tickLine={false}
                            height={isDense ? 60 : 30}
                            tick={({ x, y, payload }) => (
                                <g transform={`translate(${x},${Number(y) + (isDense ? 10 : 0)})`}>
                                    {isDense ? (
                                        <g transform="rotate(-90)">
                                            <text x={0} y={0} dy={0} textAnchor="end" fill="#71717a" className="text-[8px] font-bold">
                                                {payload.value}
                                            </text>
                                            <text x={0} y={7} dy={0} textAnchor="end" fill="#a1a1aa" className="text-[7px] font-medium">
                                                {history[payload.index].formattedTime} HS
                                            </text>
                                        </g>
                                    ) : (
                                        <>
                                            <text x={0} y={0} dy={10} textAnchor="middle" fill="#71717a" className="text-[8px] font-bold">
                                                {payload.value}
                                            </text>
                                            <text x={0} y={10} dy={10} textAnchor="middle" fill="#a1a1aa" className="text-[7px] font-medium">
                                                {history[payload.index].formattedTime}
                                            </text>
                                        </>
                                    )}
                                </g>
                            )}
                            interval={0}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 8, fontWeight: 'bold' }}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip 
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-white p-2 border border-zinc-100 shadow-xl rounded-lg">
                                            <p className="text-[10px] font-black text-zinc-900">{payload[0].value}</p>
                                            <p className="text-[8px] text-zinc-500">{payload[0].payload.formattedDate}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="numericValue" 
                            stroke="#881337" 
                            strokeWidth={2} 
                            dot={{ r: 4, fill: '#881337', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#881337', strokeWidth: 0 }}
                            label={({ x, y, index }) => (
                                <g transform={`translate(${x},${y})`}>
                                    {isDense ? (
                                        <text x={0} y={0} dx={8} transform="rotate(-90)" textAnchor="start" fill="#881337" className="text-[9px] font-black">
                                            {typeof index === 'number' ? history[index]?.value : ''}
                                        </text>
                                    ) : (
                                        <text x={0} y={0} dy={-10} textAnchor="middle" fill="#881337" className="text-[9px] font-black">
                                            {typeof index === 'number' ? history[index]?.value : ''}
                                        </text>
                                    )}
                                </g>
                            )}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default function ProtocolPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [protocol, setProtocol] = useState<any>(null);
    const [laboratory, setLaboratory] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const searchParams = new URLSearchParams(window.location.search);
                const key = searchParams.get("key");
                const authToken = searchParams.get("auth_token");

                let apiUrl = `/api/protocols/${id}?`;
                if (key) apiUrl += `key=${key}&`;
                if (authToken) apiUrl += `auth_token=${authToken}`;

                const res = await fetch(apiUrl);
                if (res.ok) {
                    const data = await res.json();
                    setProtocol(data);
                    
                    // Set document title for printing/save as PDF
                    if (data.patient) {
                        document.title = `${data.patient.apellido} ${data.patient.nombre} - Inf. ${data.numeroSecuencial}`;
                    }

                    // Fetch laboratory data
                    if (data.laboratoryId) {
                        const labRes = await fetch(`/api/laboratories`);
                        if (labRes.ok) {
                            const labs = await labRes.json();
                            const currentLab = labs.find((l: any) => l.id === data.laboratoryId);
                            setLaboratory(currentLab);
                        }
                    }
                } else if (res.status === 401) {
                    // Si no tiene acceso, redirigir al login
                    router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                } else {
                    toast.error("No se pudo cargar el protocolo.");
                }
            } catch (error) {
                console.error("Error loading data:", error);
                toast.error("Ocurrió un error inesperado.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchData();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium">Generando informe...</p>
            </div>
        );
    }

    if (!protocol || !laboratory) return null;

    const { patient, doctor, results, createdAt } = protocol;
    const date = new Date(createdAt);
    const isInternalAccess = typeof window !== 'undefined' && 
        !new URLSearchParams(window.location.search).has('auth_token') && 
        !new URLSearchParams(window.location.search).has('key');

    return (
        <div className="min-h-screen bg-zinc-100 print:bg-white py-8 px-4 sm:px-8 print:p-0">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-[21cm] mx-auto mb-6 flex items-center justify-end print:hidden">
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-95"
                >
                    <Printer size={18} />
                    Imprimir Informe
                </button>
            </div>

            {/* Paper Sheet */}
            <div className="print-container w-full max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none sm:min-h-[29.7cm] p-4 sm:p-[1.5cm] print:p-0 flex flex-col print:block overflow-x-hidden">
                
                {/* Header: Laboratory Info */}
                <header className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-zinc-900 pb-2 mb-3 gap-6 sm:gap-0">
                    <div className="flex flex-col sm:flex-row gap-5">
                        {laboratory.logo && (
                            <img src={laboratory.logo} alt="Logo" className="w-16 h-16 object-contain" />
                        )}
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 leading-none mb-1">
                                {laboratory.nombre}
                            </h1>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed max-w-[300px]">
                                Laboratorio de Análisis Clínicos y Bacteriológicos
                            </p>
                            <div className="mt-2 space-y-1 text-[10px] text-zinc-600 font-medium">
                                {laboratory.direccion && (
                                    <div className="flex items-center gap-1.5 leading-none">
                                        <MapPin size={10} className="text-zinc-400" />
                                        <span>{laboratory.direccion}, {laboratory.ciudad}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    {laboratory.telefono && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone size={10} className="text-zinc-400" />
                                            <span>{laboratory.telefono}</span>
                                        </div>
                                    )}
                                    {laboratory.email && (
                                        <div className="flex items-center gap-1.5">
                                            <Mail size={10} className="text-zinc-400" />
                                            <span>{laboratory.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Protocolo</div>
                        <div className="text-xl font-black text-zinc-900">{protocol.numeroSecuencial}</div>
                        <div className="mt-1.5 text-[10px] font-bold text-zinc-500">
                            {date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })} • {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })} HS
                        </div>
                    </div>
                </header>

                {/* Patient Info Bar */}
                <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 mb-3.5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Paciente</span>
                        <span className="block text-xs font-black text-zinc-900 uppercase">
                            {patient?.apellido}, {patient?.nombre}
                        </span>
                        <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">DNI: {patient?.documento}</span>
                    </div>
                    <div className="sm:border-x sm:border-zinc-200 sm:px-6">
                        <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Médico Derivante</span>
                        <span className="block text-xs font-black text-zinc-900 uppercase">
                            {doctor ? `DR. ${doctor.apellido}, ${doctor.nombre}` : 'Particular'}
                        </span>
                        {doctor?.matriculaProvincial && (
                            <span className="block text-[10px] text-zinc-500 font-mono mt-0.5">MP: {doctor.matriculaProvincial}</span>
                        )}
                    </div>
                    <div className="sm:pl-6 text-left sm:text-right">
                        <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Edad / Sexo</span>
                        <span className="block text-xs font-black text-zinc-900">
                            {patient?.edad || '—'} AÑOS / {patient?.sexo === 'F' ? 'FEMENINO' : 'MASCULINO'}
                        </span>
                    </div>
                </section>

                            <div className="overflow-x-auto w-full">
                                <table className="w-full border-collapse min-w-[600px] sm:min-w-0">
                                    <thead>
                                        <tr className="border-b-2 border-zinc-900">
                                            <th className="py-3 text-left text-[10px] font-black text-zinc-900 uppercase tracking-widest">Análisis</th>
                                            <th className="py-3 text-center text-[10px] font-black text-zinc-900 uppercase tracking-widest">Resultado</th>
                                            <th className="py-3 text-right text-[10px] font-black text-zinc-900 uppercase tracking-widest">Valores de Referencia</th>
                                        </tr>
                                    </thead>
                                    {results?.map((res: any) => {
                                        const det = res.determination;
                                        const subs = res.subResults || [];
                                        
                                        return (
                                            <tbody key={res.id} className="divide-y divide-zinc-100">
                                                <tr className="group">
                                                    <td colSpan={3} className="py-2 align-top">
                                                        <div className="flex flex-col border-l-4 border-zinc-900 pl-4">
                                                            <span className="text-[11px] font-black text-zinc-900 uppercase tracking-tighter leading-none">{det?.nombre}</span>
                                                            {det?.method?.nombre && (
                                                                <span className="text-[9px] text-zinc-400 font-bold uppercase italic mt-0.5">Método: {det.method.nombre}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
    
                                                {(() => {
                                                    const subRows: any[][] = [];
                                                    subs.forEach((sub: any) => {
                                                        if (sub.subDetermination?.informar2C && subRows.length > 0) {
                                                            subRows[subRows.length - 1].push(sub);
                                                        } else {
                                                            subRows.push([sub]);
                                                        }
                                                    });
    
                                                    return subRows.map((row, rowIdx) => {
                                                        const firstSub = row[0];
                                                        const currentGroup = firstSub.subDetermination?.informarTextoAntes;
                                                        const prevSub = rowIdx > 0 ? subRows[rowIdx - 1][0] : null;
                                                        const prevGroup = prevSub?.subDetermination?.informarTextoAntes;
                                                        const showHeader = currentGroup && currentGroup !== prevGroup;
    
                                                        return (
                                                            <React.Fragment key={`row-${rowIdx}`}>
                                                                {showHeader && (
                                                                    <tr className="bg-zinc-50/50">
                                                                        <td colSpan={3} className="py-2 pl-4">
                                                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                                                                {currentGroup}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                                <tr className="border-zinc-50 border-t">
                                                                    <td className="py-1 pl-8 align-top w-[40%]">
                                                                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider leading-tight">
                                                                            {firstSub.subDetermination?.nombre}
                                                                        </span>
                                                                    </td>
                                                                    <td className="py-1 align-top text-left w-[20%]">
                                                                        <div className="flex items-center gap-0">
                                                                            {row.map((sub, sIdx) => (
                                                                                <div key={sub.id} className="flex items-center gap-1.5 focus-within:ring-1 focus-within:ring-zinc-400">
                                                                                    <span className={`text-[11px] font-black font-mono text-zinc-900 inline-block min-w-[4rem] ${(() => {
                                                                                        const val = sub.valor || '';
                                                                                        const isText = val === ":" || /[^0-9.,<> \s\-]/.test(val);
                                                                                        return isText ? "text-left" : "text-right";
                                                                                    })()} whitespace-pre-wrap`}>
                                                                                        {sub.valor === ":" ? sub.comentario : (sub.valor || '—')}
                                                                                    </span>
                                                                                    {sub.subDetermination?.unit?.nombre && (
                                                                                        <span className="text-[8px] font-bold text-zinc-400 inline-block w-12 whitespace-nowrap">
                                                                                            {sub.subDetermination.unit.nombre}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-1 align-top text-right pr-2 w-[40%]">
                                                                        <div className="text-[9px] text-zinc-400 font-medium whitespace-pre-wrap leading-tight italic">
                                                                            {(() => {
                                                                                const subDet = firstSub.subDetermination;
                                                                                if (!subDet?.informarVR) return '';
                                                                                
                                                                                const rv = subDet?.referenceValues || [];
                                                                                const unitSuffix = subDet?.unit?.nombre ? ` ${subDet.unit.nombre}` : '';
    
                                                                                if (rv.length === 0) return subDet?.valorMinimo ? `${subDet.valorMinimo} - ${subDet.valorMaximo}${unitSuffix}` : '—';
                                                                                
                                                                                return rv.map((v: any) => 
                                                                                    (v.categoria ? `${v.categoria}: ${v.valoresNormales}` : v.valoresNormales) + unitSuffix
                                                                                ).join('\n');
                                                                            })()}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            </React.Fragment>
                                                        );
                                                    });
                                                })()}
                                                
                                                {/* Gráfico Histórico al final de la determinación */}
                                                {det?.imprimirHistorico && patient?.id && det?.id && (
                                                    <tr>
                                                        <td colSpan={3} className="py-2 pl-4">
                                                            <HistoricalChart 
                                                                patientId={patient.id} 
                                                                determinationId={det.id} 
                                                                determinationName={det.nombre} 
                                                            />
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        );
                                    })}
                                </table>
                            </div>

                {/* Footer: Signatures etc. */}
                <footer className="mt-5 pt-3 border-t border-zinc-100 flex justify-between items-end">
                    <div className="w-1/2">
                        <p className="text-[9px] text-zinc-400 font-medium max-w-[300px] leading-relaxed italic">
                            Los resultados de este informe deben ser interpretados por el profesional médico derivante en el contexto clínico del paciente.
                        </p>
                    </div>
                    <div className="flex flex-col items-center min-w-[200px]">
                        {protocol.biochemist ? (
                            <div className="flex flex-col items-center">
                                <span className="text-[11px] font-black text-zinc-900 uppercase tracking-tight mb-0.5">
                                    {protocol.biochemist.apellido}, {protocol.biochemist.nombre}
                                </span>
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Bioq. Matrícula: {protocol.biochemist.codigo || '—'}
                                </span>
                                <div className="w-32 h-px bg-zinc-200 mt-2 mb-1"></div>
                                <span className="text-[7px] font-black text-zinc-400 uppercase tracking-[0.2em]">Responsable Técnico</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-48 h-px bg-zinc-300 mb-2"></div>
                                <p className="text-[9px] font-black text-zinc-900 uppercase tracking-widest text-center">
                                    Firma del Profesional
                                </p>
                                <p className="text-[8px] text-zinc-500 font-bold uppercase text-center mt-1">
                                    Bioq. Responsable Técnico
                                </p>
                            </div>
                        )}
                    </div>
                </footer>


            </div>

            {/* Print Styles */}
            <style jsx global>{`
                /* Eliminar scrollbars globalmente en esta página */
                html, body {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                html::-webkit-scrollbar, body::-webkit-scrollbar {
                    display: none !important;
                }

                /* Vista web: Fondo ligero y centrado */
                @media screen {
                    body {
                        background: #f4f4f5 !important;
                    }
                }

                @media print {
                    @page {
                        size: A4;
                        margin: 1.5cm;
                    }
                    html, body {
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    /* Remove shadow and max-width for actual print */
                    .print-container {
                        display: block !important;
                        max-width: none !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        min-height: auto !important;
                        background: white !important;
                    }
                    /* Avoid breaking table blocks */
                    tr {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                    /* Ensure headers/footers allow flex layout from JSX */
                    header, footer {
                        display: flex !important;
                        page-break-inside: avoid;
                    }
                }
            `}</style>
        </div>
    );
}
