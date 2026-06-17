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
                nombreTabla: 'PAG Pagos',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (externalRecords.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const patientExtIds = [...new Set(externalRecords.map(r => String((r.datos as any).IDPaciente)))];
        const payExtIds = externalRecords.map(r => String((r.datos as any).IDPago || r.codigoExterno));

        const [patients, existingPays] = await Promise.all([
            prisma.patient.findMany({ where: { codigoExterno: { in: patientExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.payment.findMany({ where: { codigoExterno: { in: payExtIds } }, select: { id: true, codigoExterno: true } }),
        ]);

        const patMap = new Map(patients.map(p => [p.codigoExterno, p.id]));
        const existingMap = new Map(existingPays.map(e => [e.codigoExterno, e.id]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of externalRecords) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDPago || record.codigoExterno);
                const patId = patMap.get(String(d.IDPaciente));

                if (!patId) throw new Error(`Paciente IDExterno ${d.IDPaciente} no encontrado`);

                const data = {
                    codigoExterno: codigoExt,
                    patientId: patId,
                    fecha: d.Fecha ? new Date(d.Fecha) : new Date(),
                    concepto: d.Concepto || null,
                    importe: parseFloat(d.Importe) || 0,
                    laboratoryId
                };

                const existingPayId = existingMap.get(codigoExt);
                if (existingPayId) {
                    if (updateExisting) {
                        await prisma.payment.update({ where: { id: existingPayId }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.payment.create({ data });
                    createdCount++;
                }

                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing payment ${record.id}:`, error.message);
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

        await createAuditLog({ action: "SYNC_PAYMENTS_TASK", entity: "Procesos", details: `Payments sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-pagos batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar pagos" }, { status: 500 });
    }
}
