import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { limit, updateExisting, laboratoryId: reqLabId } = body;

        const laboratoryId = session.user.laboratoryId || reqLabId;
        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const SUB_BATCH_SIZE = 2000;
        const takeLimit = limit && limit > 0 ? limit : 10000;

        const allRecords = await prisma.externalRecord.findMany({
            where: {
                nombreTabla: 'PRO SubResultados',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: takeLimit,
            orderBy: { createdAt: 'asc' }
        });

        if (allRecords.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        // Fetching common dependencies in advance for the whole set to minimize queries
        const idResultadoExts = [...new Set(allRecords.map(r => String((r.datos as any).idResultado ?? (r.datos as any).IDResultado)))];
        const idSubDetExts = [...new Set(allRecords.map(r => String((r.datos as any).idSubDeterminacion ?? (r.datos as any).IDSubDeterminacion)))];
        const resExtIds = allRecords.map(r => String((r.datos as any).idSubResultado ?? (r.datos as any).IDSubResultado ?? r.codigoExterno));

        const [results, subDeterminations, existingSubResults] = await Promise.all([
            prisma.result.findMany({ where: { codigoExterno: { in: idResultadoExts }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.subDetermination.findMany({ where: { codigoExterno: { in: idSubDetExts }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.subResult.findMany({ where: { codigoExterno: { in: resExtIds } }, select: { id: true, codigoExterno: true } })
        ]);

        const resultMap = new Map(results.map(r => [r.codigoExterno, r.id]));
        const subDetMap = new Map(subDeterminations.map(sd => [sd.codigoExterno, sd.id]));
        const existingMap = new Map(existingSubResults.map(esr => [esr.codigoExterno, esr.id]));

        let totalCreated = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;

        // Process in sub-batches of 2000 as requested
        for (let i = 0; i < allRecords.length; i += SUB_BATCH_SIZE) {
            const recordsLot = allRecords.slice(i, i + SUB_BATCH_SIZE);
            const toCreateData: any[] = [];
            const toUpdateList: { id: string, data: any, recordId: string }[] = [];
            const processedInThisLot: string[] = [];

            for (const record of recordsLot) {
                try {
                    const d = record.datos as any;
                    const codigoExt = String(d.idSubResultado ?? d.IDSubResultado ?? record.codigoExterno);
                    const resultId = resultMap.get(String(d.idResultado ?? d.IDResultado));
                    const subDetId = subDetMap.get(String(d.idSubDeterminacion ?? d.IDSubDeterminacion));

                    if (!resultId || !subDetId) {
                        throw new Error(`Dependencias no encontradas: Result=${!!resultId}, SubDet=${!!subDetId}`);
                    }

                    const subResultData = {
                        codigoExterno: codigoExt,
                        resultId,
                        subDeterminationId: subDetId,
                        valor: (d.resultado !== undefined && d.resultado !== null) ? String(d.resultado) : (d.Resultado !== undefined && d.Resultado !== null ? String(d.Resultado) : null),
                        comentario: d.comentario ?? d.Comentario ?? null,
                        laboratoryId
                    };

                    const existingId = existingMap.get(codigoExt);
                    if (existingId) {
                        if (updateExisting) {
                            toUpdateList.push({ id: existingId, data: subResultData, recordId: record.id });
                        } else {
                            totalSkipped++;
                            processedInThisLot.push(record.id);
                        }
                    } else {
                        toCreateData.push({ ...subResultData, recordId: record.id });
                    }
                } catch (err: any) {
                    totalErrors++;
                    await prisma.externalRecord.update({ 
                        where: { id: record.id }, 
                        data: { error: err.message, intentos: { increment: 1 } } 
                    });
                }
            }

            // Execute "Commit" for current lot (Insertions)
            if (toCreateData.length > 0) {
                const prismaInsertData = toCreateData.map(({ recordId, ...rest }) => rest);
                await prisma.subResult.createMany({ data: prismaInsertData, skipDuplicates: true });
                toCreateData.forEach(item => processedInThisLot.push(item.recordId));
                totalCreated += toCreateData.length;
            }

            // Execute "Commit" for current lot (Updates)
            if (toUpdateList.length > 0) {
                const CONCURRENCY = 75;
                for (let j = 0; j < toUpdateList.length; j += CONCURRENCY) {
                    const subChunk = toUpdateList.slice(j, j + CONCURRENCY);
                    await Promise.all(subChunk.map(async (item) => {
                        try {
                            await prisma.subResult.update({ where: { id: item.id }, data: { ...item.data, updatedAt: new Date() } });
                            processedInThisLot.push(item.recordId);
                            totalUpdated++;
                        } catch (e: any) {
                            totalErrors++;
                            await prisma.externalRecord.update({ where: { id: item.recordId }, data: { error: e.message, intentos: { increment: 1 } } });
                        }
                    }));
                }
            }

            // Execute "Commit" for current lot (Status Updates)
            if (processedInThisLot.length > 0) {
                const chunkIdSize = 100;
                for (let k = 0; k < processedInThisLot.length; k += chunkIdSize) {
                    await prisma.externalRecord.updateMany({
                        where: { id: { in: processedInThisLot.slice(k, k + chunkIdSize) } },
                        data: { procesado: 1, error: null }
                    });
                }
            }
        }

        const processedCount = totalCreated + totalUpdated;
        await createAuditLog({ 
            action: "SYNC_SUBRESULTS_LOTE_2000", 
            entity: "Procesos", 
            details: `SubResults sync complete (Lots of 2000): ${processedCount} Success (C:${totalCreated}, U:${totalUpdated}), ${totalErrors} Errors, ${totalSkipped} Skipped`, 
            laboratoryId, 
            userId: session.user.id, 
            userName: session.user.name 
        });
        
        return NextResponse.json({ 
            success: true, 
            summary: { 
                totalRecords: allRecords.length,
                processed: processedCount, 
                created: totalCreated, 
                updated: totalUpdated, 
                skipped: totalSkipped,
                errors: totalErrors
            } 
        });

    } catch (error: any) {
        console.error("Critical error in sync-subresults lot processing:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar sub-resultados por lotes" }, { status: 500 });
    }
}
