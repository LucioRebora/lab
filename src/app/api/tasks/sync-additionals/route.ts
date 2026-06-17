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

        const externalRecords = await prisma.externalRecord.findMany({
            where: {
                nombreTabla: 'PRO Adicionales Aplicados',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (externalRecords.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const protocolExtIds = [...new Set(externalRecords.map((r: any) => String((r.datos as any).IDProtocolo)))];
        const additionalExtIds = [...new Set(externalRecords.map((r: any) => String((r.datos as any).IDAdicional)))];
        const osExtIds = [...new Set(externalRecords.map((r: any) => String((r.datos as any).IDObraSocial)).filter((id: string) => id !== 'null'))];
        const addExtIds = externalRecords.map((r: any) => String((r.datos as any).IDAdicionalAplicado || r.codigoExterno));

        const [protocols, additionals, hInsurances, existingApps] = await Promise.all([
            prisma.protocol.findMany({ where: { codigoExterno: { in: protocolExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.additional.findMany({ where: { codigoExterno: { in: additionalExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.healthInsurance.findMany({ where: { codigoExterno: { in: osExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.additionalApplyed.findMany({ where: { codigoExterno: { in: addExtIds } }, select: { id: true, codigoExterno: true } }),
        ]);

        const protMap = new Map(protocols.map((p: any) => [p.codigoExterno, p.id]));
        const addMap = new Map(additionals.map((a: any) => [a.codigoExterno, a.id]));
        const osMap = new Map(hInsurances.map((os: any) => [os.codigoExterno, os.id]));
        const existingMap = new Map(existingApps.map((e: any) => [e.codigoExterno, e.id]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of externalRecords) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDAdicionalAplicado || record.codigoExterno);
                const protId = protMap.get(String(d.IDProtocolo));
                const addId = addMap.get(String(d.IDAdicional));

                if (!protId) throw new Error(`Protocolo IDExterno ${d.IDProtocolo} no encontrado`);
                if (!addId) throw new Error(`Adicional IDExterno ${d.IDAdicional} no encontrado`);

                const data = {
                    codigoExterno: codigoExt,
                    protocolId: protId,
                    additionalId: addId,
                    healthInsuranceId: osMap.get(String(d.IDObraSocial)) || null,
                    montoFijo: parseFloat(d.MontoFijo) || 0,
                    porcentajeSP: parseFloat(d.PorcentajeSP) || 0,
                    laboratoryId
                };

                const existingAddAppId = existingMap.get(codigoExt);
                if (existingAddAppId) {
                    if (updateExisting) {
                        await prisma.additionalApplyed.update({ where: { id: existingAddAppId }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.additionalApplyed.create({ data });
                    createdCount++;
                }

                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing additional applied ${record.id}:`, error.message);
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

        await createAuditLog({ action: "SYNC_ADDITIONALS_TASK", entity: "Procesos", details: `Additionals sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-additionals batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar adicionales" }, { status: 500 });
    }
}
