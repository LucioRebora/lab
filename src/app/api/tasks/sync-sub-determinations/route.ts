import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
export type StringFormatType = 'TEXT' | 'INTEGER' | 'DECIMAL_1' | 'DECIMAL_2';

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
                nombreTabla: 'DET SubDeterminaciones',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (records.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const detExtIds = [...new Set(records.map((r: any) => String((r.datos as any).IDDeterminacion)).filter((id: string) => id && id !== 'null'))];
        const unitExtIds = [...new Set(records.map((r: any) => String((r.datos as any).IDUnidad)).filter((id: string) => id && id !== 'null'))];
        const subDetExtIds = records.map((r: any) => String((r.datos as any).IDSubDeterminacion || r.codigoExterno));

        const [determinations, units, existingSubDets] = await Promise.all([
            prisma.determination.findMany({ where: { codigoExterno: { in: detExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.unit.findMany({ where: { codigoExterno: { in: unitExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.subDetermination.findMany({ where: { codigoExterno: { in: subDetExtIds }, laboratoryId }, select: { id: true, codigoExterno: true, determinationId: true } }),
        ]);

        const detMap = new Map(determinations.map((d: any) => [d.codigoExterno, d.id] as [string, string]));
        const unitMap = new Map(units.map((u: any) => [u.codigoExterno, u.id] as [string, string]));
        
        // Multi-key map for existing subdeterminations (codigoExterno + determinationId for safety, as per schema unique)
        const existingMap = new Map(existingSubDets.map((esd: any) => [`${esd.codigoExterno}-${esd.determinationId}`, esd.id]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of records) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDSubDeterminacion || record.codigoExterno);
                const determinationId = detMap.get(String(d.IDDeterminacion));

                if (!determinationId) {
                    throw new Error(`Determinación IDExterno ${d.IDDeterminacion} no encontrada`);
                }

                // Map format
                let format: StringFormatType = 'TEXT';
                const f = String(d.Formato);
                if (f === "1" || f === "INTEGER") format = 'INTEGER';
                else if (f === "2" || f === "DECIMAL_1") format = 'DECIMAL_1';
                else if (f === "3" || f === "DECIMAL_2") format = 'DECIMAL_2';

                const data: any = {
                    codigoExterno: codigoExt,
                    nombre: d.SubDeterminacion || d.Nombre || "Sin Nombre",
                    determinationId,
                    unitId: unitMap.get(String(d.IDUnidad)) || null,
                    formato: format,
                    calcular: !!d.Calcular,
                    informar: d.Informar !== undefined ? !!d.Informar : true,
                    informar2C: !!d.Informar2C,
                    informarTextoAntes: d.TextoAntes || null,
                    informarCorteDespues: !!d.CorteDespues,
                    informarVR: d.InformarVR !== undefined ? !!d.InformarVR : true,
                    valorMinimo: d.Minimo ? String(d.Minimo) : null,
                    valorMaximo: d.Maximo ? String(d.Maximo) : null,
                    activa: d.Activa !== undefined ? !!d.Activa : true,
                    laboratoryId
                };

                const existingId = existingMap.get(`${codigoExt}-${determinationId}`);
                if (existingId) {
                    if (updateExisting) {
                        await prisma.subDetermination.update({ where: { id: existingId }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.subDetermination.create({ data });
                    createdCount++;
                }

                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing sub-determination ${record.id}:`, error.message);
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

        await createAuditLog({ action: "SYNC_SUB_DETERMINATIONS_TASK", entity: "Procesos", details: `Sub-Determinations sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-sub-determinations batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar sub-determinaciones" }, { status: 500 });
    }
}
