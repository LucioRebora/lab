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

        const records = await prisma.externalRecord.findMany({
            where: {
                nombreTabla: 'DET Determinaciones',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (records.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const detExtIds = records.map(r => String((r.datos as any).IDDeterminacion || r.codigoExterno));
        const sectionExtIds = [...new Set(records.map(r => String((r.datos as any).IDSeccion)).filter(id => id && id !== 'null'))];
        const aspectExtIds = [...new Set(records.map(r => String((r.datos as any).IDAspecto)).filter(id => id && id !== 'null'))];
        const methodExtIds = [...new Set(records.map(r => String((r.datos as any).IDMetodo)).filter(id => id && id !== 'null'))];
        const unitExtIds = [...new Set(records.map(r => String((r.datos as any).IDUnidad)).filter(id => id && id !== 'null'))];

        const [existingDets, sections, aspects, methods, units] = await Promise.all([
            prisma.determination.findMany({ where: { codigoExterno: { in: detExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.section.findMany({ where: { codigoExterno: { in: sectionExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.aspect.findMany({ where: { codigoExterno: { in: aspectExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.method.findMany({ where: { codigoExterno: { in: methodExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.unit.findMany({ where: { codigoExterno: { in: unitExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
        ]);

        const detMap = new Map(existingDets.map(d => [d.codigoExterno, d.id] as [string, string]));
        const sectionMap = new Map(sections.map(s => [s.codigoExterno, s.id] as [string, string]));
        const aspectMap = new Map(aspects.map(a => [a.codigoExterno, a.id] as [string, string]));
        const methodMapping = new Map(methods.map(m => [m.codigoExterno, m.id] as [string, string]));
        const unitMap = new Map(units.map(u => [u.codigoExterno, u.id] as [string, string]));


        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of records) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDDeterminacion || record.codigoExterno);
                
                const data = {
                    codigoExterno: codigoExt,
                    nombre: d.Determinacion || d.Nombre || "Sin Nombre",
                    abreviatura: d.Abreviatura || null,
                    mensajeIngreso: d.MensajeIngreso || null,
                    comentarioFijo: d.ComentarioFijo || null,
                    aspecto: d.Aspecto || null,
                    condicionesMuestra: d.CondicionesMuestra || null,
                    imprimirWorksheet: d.ImprimirWS !== undefined ? !!d.ImprimirWS : true,
                    resumirWorksheet: !!d.ResumirWS,
                    alturaWorksheet: parseFloat(d.AlturaWS) || null,
                    codigo: d.Codigo ? String(d.Codigo) : null,
                    activa: d.Activa !== undefined ? !!d.Activa : true,
                    sectionId: sectionMap.get(String(d.IDSeccion)) || null,
                    aspectId: aspectMap.get(String(d.IDAspecto)) || null,
                    methodId: methodMapping.get(String(d.IDMetodo)) || null,
                    unitId: unitMap.get(String(d.IDUnidad)) || null,
                    laboratoryId
                };

                const existingId = detMap.get(codigoExt);
                if (existingId) {
                    if (updateExisting) {
                        await prisma.determination.update({ where: { id: existingId }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.determination.create({ data });
                    createdCount++;
                }

                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing determination ${record.id}:`, error.message);
                await prisma.externalRecord.update({
                    where: { id: record.id },
                    data: { error: error.message, intentos: { increment: 1 } }
                });
                skippedCount++;
            }
        }

        if (processedIds.length > 0) {
            const CHUNK = 100;
            for (let i = 0; i < processedIds.length; i += CHUNK) {
                await prisma.externalRecord.updateMany({
                    where: { id: { in: processedIds.slice(i, i + CHUNK) } },
                    data: { procesado: 1, error: null }
                });
            }
        }

        await createAuditLog({ action: "SYNC_DETERMINATIONS_TASK", entity: "Procesos", details: `Determinations sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-determinations batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar determinaciones" }, { status: 500 });
    }
}
