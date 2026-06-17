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
                nombreTabla: { in: ['Proceso Renglones OS', 'HMB Renglones OS'] },
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (records.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const patientExtIds = [...new Set(records.map((r: any) => String((r.datos as any).IDPaciente)))];
        const osExtIds = [...new Set(records.map((r: any) => String((r.datos as any).IDObraSocial)))];
        const relExtIds = records.map((r: any) => String((r.datos as any).IDRenglonOS || r.codigoExterno));

        const [patients, hInsurances, existingRels] = await Promise.all([
            prisma.patient.findMany({ where: { codigoExterno: { in: patientExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.healthInsurance.findMany({ where: { codigoExterno: { in: osExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.patientHealthInsurance.findMany({ where: { codigoExterno: { in: relExtIds } }, select: { id: true, codigoExterno: true } }),
        ]);

        const patMap = new Map(patients.map((p: any) => [p.codigoExterno, p.id]));
        const osMap = new Map(hInsurances.map((os: any) => [os.codigoExterno, os.id]));
        const existingMap = new Map(existingRels.map((e: any) => [e.codigoExterno, e.id]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of records) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDRenglonOS || record.codigoExterno);
                const patId = patMap.get(String(d.IDPaciente));
                const osId = osMap.get(String(d.IDObraSocial));

                if (!patId) throw new Error(`Paciente IDExterno ${d.IDPaciente} no encontrado`);
                if (!osId) throw new Error(`Obra Social IDExterno ${d.IDObraSocial} no encontrada`);

                const data = {
                    codigoExterno: codigoExt,
                    patientId: patId,
                    healthInsuranceId: osId,
                    nroAfiliado: d.NumAfiliado || null,
                };

                const existingRelId = existingMap.get(codigoExt);
                if (existingRelId) {
                    if (updateExisting) {
                        await prisma.patientHealthInsurance.update({ where: { id: existingRelId }, data });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.patientHealthInsurance.create({ data });
                    createdCount++;
                }
                
                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing health insurance rel ${record.id}:`, error.message);
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

        await createAuditLog({ action: "SYNC_HEALTH_INSURANCES_TASK", entity: "Procesos", details: `HealthInsurances sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-health-insurances batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar obras sociales" }, { status: 500 });
    }
}
