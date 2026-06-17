import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const patientId = searchParams.get("patientId");
        const determinationId = searchParams.get("determinationId");

        if (!patientId || !determinationId) {
            return NextResponse.json({ error: "Faltan parámetros: patientId y determinationId son requeridos" }, { status: 400 });
        }

        const results = await (prisma as any).result.findMany({
            where: {
                protocol: {
                    patientId: patientId
                },
                determinationId: determinationId,
                asignado: true // Solo resultados asignados/validados si aplica
            },
            include: {
                protocol: {
                    select: {
                        createdAt: true,
                        numeroSecuencial: true
                    }
                },
                subResults: {
                    orderBy: {
                        subDetermination: {
                            createdAt: 'asc'
                        }
                    }
                }
            },
            orderBy: {
                protocol: {
                    createdAt: 'asc'
                }
            }
        });

        // Formatear para el gráfico
        const history = results.map((r: any) => {
            // Buscamos el primer valor numérico o el único valor
            // Si hay muchos sub-resultados, tomamos el primero por ahora
            const firstSub = r.subResults[0];
            let value = firstSub?.valor || "";
            
            // Limpieza básica de valor numérico para el gráfico
            // Reemplazamos coma por punto si es necesario
            let numericValue = null;
            if (value) {
                const cleanVal = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                numericValue = parseFloat(cleanVal);
                if (isNaN(numericValue)) numericValue = null;
            }

            return {
                id: r.id,
                date: r.protocol.createdAt,
                protocol: r.protocol.numeroSecuencial,
                value: value,
                numericValue: numericValue,
            };
        }).filter((h: any) => h.numericValue !== null); // Solo los que tienen valor numérico para el gráfico

        return NextResponse.json(history);
    } catch (error: any) {
        console.error("Error in history API:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
