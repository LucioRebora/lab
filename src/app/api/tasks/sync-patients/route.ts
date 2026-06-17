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
                nombreTabla: 'HMB Pacientes',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (records.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const userExtIds = [...new Set(records.map(r => String((r.datos as any).IDUsuario)).filter(id => id !== 'null' && id !== 'undefined'))];
        const patExtIds = records.map(r => String((r.datos as any).IDPaciente || r.codigoExterno));

        const [users, existingPats] = await Promise.all([
            prisma.notifiedUser.findMany({ where: { codigoExterno: { in: userExtIds }, laboratoryId }, select: { id: true, codigoExterno: true } }),
            prisma.patient.findMany({ where: { codigoExterno: { in: patExtIds }, laboratoryId }, select: { id: true, codigoExterno: true, documento: true } }),
        ]);

        const userMap = new Map(users.map(u => [u.codigoExterno, u.id]));
        const existingMap = new Map(existingPats.map(e => [e.codigoExterno, e]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of records) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDPaciente || record.codigoExterno);
                const notifiedUserId = userMap.get(String(d.IDUsuario)) || null;

                const baseData = {
                    codigoExterno: codigoExt,
                    nombre: d.Nombre || "Sin Nombre",
                    apellido: d.Apellido || "Sin Apellido",
                    documento: String(d.NumDocumento || ""),
                    tipoDocumento: d.TipoDocumento || "DNI",
                    email: d.Email || null,
                    telefono: d.TelefonoCasa || d.Telefono || null,
                    fechaNacimiento: d.FechaNacimiento ? new Date(d.FechaNacimiento) : null,
                    sexo: d.Sexo || "S/D",
                    ciudad: d.Ciudad || null,
                    codigoPostal: d.CodigoPostal || null,
                    direccion: d.Direccion || null,
                    entreCalles: d.EntreCalles || null,
                    provincia: d.Provincia || null,
                    notifiedUserId,
                    laboratoryId
                };

                // Age calculation
                let age = null;
                if (baseData.fechaNacimiento && baseData.fechaNacimiento instanceof Date && !isNaN(baseData.fechaNacimiento.getTime())) {
                    const today = new Date();
                    age = today.getFullYear() - baseData.fechaNacimiento.getFullYear();
                    const m = today.getMonth() - baseData.fechaNacimiento.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < baseData.fechaNacimiento.getDate())) age--;
                }

                const data = { ...baseData, edad: age };
                const existingPat = existingMap.get(codigoExt);

                if (existingPat) {
                    if (updateExisting) {
                        await prisma.patient.update({ where: { id: existingPat.id }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        // Si decidimos no tocar, igual lo marcamos como procesado para que salga de la cola
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    // Removed duplicate document number validation as requested.

                    await prisma.patient.create({ data });
                    createdCount++;
                }

                // Limpiar errores previos si los hubiera y marcar procesado
                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error sync record ${record.id}:`, error.message);
                // Actualizar registro con error y aumentar intentos
                await prisma.externalRecord.update({
                    where: { id: record.id },
                    data: { 
                        error: error.message,
                        intentos: { increment: 1 }
                    }
                });
                skippedCount++;
            }
        }

        // Marcado de procesados en lote al final
        if (processedIds.length > 0) {
            const CHUNK = 100;
            for (let i = 0; i < processedIds.length; i += CHUNK) {
                await prisma.externalRecord.updateMany({
                    where: { id: { in: processedIds.slice(i, i + CHUNK) } },
                    data: { procesado: 1, error: null }
                });
            }
        }

        await createAuditLog({ action: "SYNC_PATIENTS_TASK", entity: "Procesos", details: `Sync complete: ${processedCount} Success, ${skippedCount} Fail/Skip`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ 
            success: true, 
            summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } 
        });

    } catch (error: any) {
        console.error("Critical error in sync-patients:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar pacientes" }, { status: 500 });
    }
}
