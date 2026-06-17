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
                nombreTabla: 'PRO Resultados',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: takeLimit,
            orderBy: { createdAt: 'asc' }
        });

        if (allRecords.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const protocolExtIds = [...new Set(allRecords.map((r: any) => String((r.datos as any).IDProtocolo)))];
        const determinationExtIds = [...new Set(allRecords.map((r: any) => String((r.datos as any).IDDeterminacion)))];
        const sectionExtIds = [...new Set(allRecords.map((r: any) => String((r.datos as any).IDSeccion)).filter((id: string) => id !== 'null'))];
        const osExtIds = [...new Set(allRecords.map((r: any) => String((r.datos as any).IDObraSocial)).filter((id: string) => id !== 'null'))];
        const resExtIds = allRecords.map((r: any) => String((r.datos as any).IDRenglonOS || (r.datos as any).IDResultado || r.codigoExterno));

        const [protocols, determinations, sections, hInsurances, existingResults] = await Promise.all([
            prisma.protocol.findMany({ where: { codigoExterno: { in: protocolExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.determination.findMany({ where: { codigoExterno: { in: determinationExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.section.findMany({ where: { codigoExterno: { in: sectionExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.healthInsurance.findMany({ where: { codigoExterno: { in: osExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.result.findMany({ where: { codigoExterno: { in: resExtIds } }, select: { id: true, codigoExterno: true } }),
        ]);

        const protocolMap = new Map(protocols.map((p: any) => [p.codigoExterno, p.id]));
        const detMap = new Map(determinations.map((d: any) => [d.codigoExterno, d.id]));
        const sectionMap = new Map(sections.map((s: any) => [s.codigoExterno, s.id]));
        const osMap = new Map(hInsurances.map((os: any) => [os.codigoExterno, os.id]));
        const existingMap = new Map(existingResults.map((er: any) => [er.codigoExterno, er.id]));

        let totalCreated = 0, totalUpdated = 0, totalSkipped = 0, totalErrors = 0;

        for (let i = 0; i < allRecords.length; i += SUB_BATCH_SIZE) {
            const recordsLot = allRecords.slice(i, i + SUB_BATCH_SIZE);
            const toCreateData: any[] = [];
            const toUpdateList: { id: string, data: any, recordId: string }[] = [];
            const processedInThisLot: string[] = [];

            for (const record of recordsLot) {
                try {
                    const d = record.datos as any;
                    const codigoExt = String(d.IDRenglonOS || d.IDResultado || record.codigoExterno);
                    const protocolId = protocolMap.get(String(d.IDProtocolo));
                    const determinationId = detMap.get(String(d.IDDeterminacion));

                    if (!protocolId || !determinationId) {
                        throw new Error(`Dependencias no encontradas: Protocol=${!!protocolId}, Det=${!!determinationId}`);
                    }

                    const resultData = {
                        codigoExterno: codigoExt,
                        protocolId,
                        determinationId,
                        sectionId: sectionMap.get(String(d.IDSeccion)) || null,
                        healthInsuranceId: osMap.get(String(d.IDObraSocial)) || null,
                        comentarioInterno: d.CometarioInterno || d.ComentarioInterno || null,
                        asignado: !!d.Asignado,
                        etiquetaImpresa: !!d.EtiquetaImpresa,
                        suspender: !!d.Suspender,
                        precio: parseFloat(d.Precio) || 0,
                        debeReceta: !!d.DebeReceta,
                        debeOrden: !!d.DebeOrden,
                        numAutorizacion: d.NumAutorizacion ? String(d.NumAutorizacion) : null,
                        laboratoryId
                    };

                    const existingId = existingMap.get(codigoExt);
                    if (existingId) {
                        if (updateExisting) {
                            toUpdateList.push({ id: existingId as string, data: resultData, recordId: record.id });
                        } else {
                            totalSkipped++;
                            processedInThisLot.push(record.id);
                        }
                    } else {
                        toCreateData.push({ ...resultData, recordId: record.id });
                    }
                } catch (err: any) {
                    totalErrors++;
                    await prisma.externalRecord.update({ 
                        where: { id: record.id }, 
                        data: { error: err.message, intentos: { increment: 1 } } 
                    });
                }
            }

            // Commit insertions
            if (toCreateData.length > 0) {
                const prismaInsertData = toCreateData.map(({ recordId, ...rest }: any) => rest);
                await prisma.result.createMany({ data: prismaInsertData, skipDuplicates: true });
                toCreateData.forEach(item => processedInThisLot.push(item.recordId));
                totalCreated += toCreateData.length;
            }

            // Commit updates
            if (toUpdateList.length > 0) {
                const CONCURRENCY = 75;
                for (let j = 0; j < toUpdateList.length; j += CONCURRENCY) {
                    const subChunk = toUpdateList.slice(j, j + CONCURRENCY);
                    await Promise.all(subChunk.map(async (item: any) => {
                        try {
                            await prisma.result.update({ where: { id: item.id }, data: { ...item.data, updatedAt: new Date() } });
                            processedInThisLot.push(item.recordId);
                            totalUpdated++;
                        } catch (e: any) {
                            totalErrors++;
                            await prisma.externalRecord.update({ where: { id: item.recordId }, data: { error: e.message, intentos: { increment: 1 } } });
                        }
                    }));
                }
            }

            // Commit status updates
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
            action: "SYNC_RESULTS_LOTE_2000", 
            entity: "Procesos", 
            details: `Results sync complete (Lots of 2000): ${processedCount} Success (C:${totalCreated}, U:${totalUpdated}), ${totalErrors} Errors, ${totalSkipped} Skipped`, 
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
        console.error("Critical error in sync-results lot processing:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar resultados por lotes" }, { status: 500 });
    }
}
