import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { content, laboratoryId, filterProtocolNum } = await request.json();
        if (!content || !laboratoryId) {
            return NextResponse.json({ error: "Contenido y laboratorio requeridios" }, { status: 400 });
        }

        const lines = content.split('\n').filter((l: string) => l.trim().length > 0);
        const results_summary = [];

        // Identify CM260 equipment
        const equipment = await (prisma as any).equipment.findFirst({
            where: { nombre: { contains: 'CM260', mode: 'insensitive' } }
        });

        if (!equipment) {
            return NextResponse.json({ error: "Equipo CM260 no encontrado en el sistema" }, { status: 404 });
        }

        for (const line of lines) {
            const parts = line.split(';').map((p: string) => p.trim());
            if (parts.length < 10) continue;

            const protocolSeq = parts[0];
            
            // Filter if requested
            if (filterProtocolNum && protocolSeq !== filterProtocolNum) continue;

            const numResults = parseInt(parts[9]);

            // Find protocol
            const protocol = await (prisma as any).protocol.findUnique({
                where: {
                    numeroSecuencial_laboratoryId: {
                        numeroSecuencial: protocolSeq,
                        laboratoryId: laboratoryId
                    }
                },
                include: {
                    results: true
                }
            });

            if (!protocol) {
                results_summary.push({ protocol: protocolSeq, status: "No encontrado" });
                continue;
            }

            let loadedCount = 0;

            // Process result triplets
            for (let i = 0; i < numResults; i++) {
                const codeIdx = 10 + (i * 3);
                const valIdx = 11 + (i * 3);
                
                if (codeIdx >= parts.length || valIdx >= parts.length) break;

                const tecnicaCode = parts[codeIdx];
                const rawValue = parts[valIdx].replace(',', '.'); // Handle comma to dot

                // Find mapping for this tecnica
                const mapping = await (prisma as any).mapperCM260.findFirst({
                    where: {
                        tecnica: tecnicaCode,
                        equipmentId: equipment.id,
                        laboratoryId: laboratoryId
                    },
                    include: {
                        subDetermination: true
                    }
                });

                if (mapping) {
                    let formattedValue = rawValue;
                    const format = mapping.subDetermination.formato;
                    
                    if (format && !isNaN(parseFloat(rawValue))) {
                        const num = parseFloat(rawValue);
                        if (format === "INTEGER") {
                            formattedValue = Math.round(num).toString();
                        } else if (format === "DECIMAL_1") {
                            formattedValue = num.toFixed(1);
                        } else if (format === "DECIMAL_2") {
                            formattedValue = num.toFixed(2);
                        }
                    }

                    // Find if this subdetermination is expected in this protocol
                    // We need to find which "Result" (determination) has this subdetermination
                    const targetSubDetId = mapping.subDeterminationId;
                    
                    // Fetch all results for this protocol to find the one containing the subdetermination
                    const results = await (prisma as any).result.findMany({
                        where: { protocolId: protocol.id },
                        include: {
                            determination: {
                                include: {
                                    subDeterminations: true
                                }
                            }
                        }
                    });

                    const targetResult = results.find((r: any) => 
                        r.determination.subDeterminations.some((sd: any) => sd.id === targetSubDetId)
                    );

                    if (targetResult) {
                        // Update or Create SubResult
                        await (prisma as any).subResult.upsert({
                            where: {
                                resultId_subDeterminationId: {
                                    resultId: targetResult.id,
                                    subDeterminationId: targetSubDetId
                                }
                            },
                            update: { valor: formattedValue },
                            create: {
                                resultId: targetResult.id,
                                subDeterminationId: targetSubDetId,
                                valor: formattedValue,
                                laboratoryId: laboratoryId
                            }
                        });
                        loadedCount++;
                    }
                }
            }

            results_summary.push({ protocol: protocolSeq, status: `Cargados ${loadedCount} resultados` });
            
            // Optional: Update protocol status to IN_PROCESS if it was NEW
            if (protocol.status === "NEW" && loadedCount > 0) {
                await (prisma as any).protocol.update({
                    where: { id: protocol.id },
                    data: { status: "IN_PROCESS" }
                });
            }
        }

        return NextResponse.json({ summary: results_summary });

    } catch (error: any) {
        console.error("Error importing results:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
