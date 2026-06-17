"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Printer, ChevronLeft } from "lucide-react";
import JsBarcode from "jsbarcode";

// Component for a single label to handle its own barcode generation
function BarcodeLabel({ protocolNum, patientName, date, labelType }: { 
    protocolNum: string, 
    patientName: string, 
    date: string, 
    labelType: string 
}) {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (svgRef.current) {
            JsBarcode(svgRef.current, protocolNum, {
                format: "CODE128",
                width: 1.2, // Estrecho para que quepa bien
                height: 40,
                displayValue: false,
                margin: 0,
                background: "transparent"
            });
        }
    }, [protocolNum]);

    return (
        <div className="label-container bg-white border border-dashed border-zinc-200 print:border-none w-[50mm] h-[25mm] p-[2mm] flex flex-col justify-between overflow-hidden shadow-sm print:shadow-none mb-4 print:mb-0 print:m-0 print:break-after-page relative box-border">
            {/* Top Row: Date and P: Num */}
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-black">{date}</span>
                <span className="text-[10px] font-black text-black">P: {protocolNum}</span>
                <span className="w-8"></span> {/* Spacer to balance the right side if needed */}
            </div>
            
            {/* Middle Row: Barcode and Circle Label */}
            <div className="flex items-center justify-between px-1 flex-1">
                <div className="flex-1 flex justify-start">
                    <svg ref={svgRef}></svg>
                </div>
                
                {/* Identifier Circle (EDTA, S, etc.) */}
                <div className="w-10 h-10 rounded-full border border-black flex items-center justify-center shrink-0 ml-2">
                    <span className="text-[9px] font-black text-black text-center leading-tight">
                        {labelType || 'S'}
                    </span>
                </div>
            </div>

            {/* Bottom Row: Patient Name */}
            <div className="px-1 border-t border-transparent">
                <p className="text-[10px] font-black text-black truncate uppercase leading-none pb-0.5">
                    {patientName}
                </p>
            </div>
        </div>
    );
}

export default function ProtocolLabelsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [protocol, setProtocol] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/protocols/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setProtocol(data);
                    document.title = `Etiquetas - ${data.numeroSecuencial}`;
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
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium italic">Preparando etiquetas...</p>
            </div>
        );
    }

    if (!protocol) return null;

    const { patient, results, createdAt, numeroSecuencial } = protocol;
    const dateFormatted = new Date(createdAt).toLocaleDateString('es-AR');
    const patientName = `${patient?.apellido}, ${patient?.nombre}`;

    // Group by unique label type from tags (linked to sections)
    const labelTypes = Array.from(new Set(
        results.map((r: any) => r.determination?.section?.tag?.etiqueta || r.determination?.section?.etiqueta || "S")
    )) as string[];

    return (
        <div className="min-h-screen bg-zinc-100 print:bg-white py-8 px-4 print:p-0">
            {/* Toolbar - Hidden when printing */}
            <div className="max-w-[10cm] mx-auto mb-8 flex items-center justify-between print:hidden">
                <button 
                    onClick={() => window.close()}
                    className="flex items-center gap-2 text-zinc-500 hover:text-black transition-colors font-bold text-sm"
                >
                    <ChevronLeft size={18} />
                    Cerrar
                </button>
                <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-95"
                >
                    <Printer size={18} />
                    Imprimir {labelTypes.length} {labelTypes.length === 1 ? 'Etiqueta' : 'Etiquetas'}
                </button>
            </div>

            {/* Labels Container */}
            <div className="flex flex-col items-center">
                {labelTypes.map((type, idx) => (
                    <BarcodeLabel 
                        key={idx}
                        protocolNum={numeroSecuencial}
                        patientName={patientName}
                        date={dateFormatted}
                        labelType={type}
                    />
                ))}
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: 50mm 25mm;
                        margin: 0;
                    }
                    html, body {
                        width: 50mm;
                        height: 25mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                    .print-hidden {
                        display: none !important;
                    }
                }
                .label-container {
                    width: 50mm;
                    height: 25mm;
                    page-break-after: always;
                    box-sizing: border-box;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
            `}</style>
        </div>
    );
}
