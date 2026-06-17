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
                nombreTabla: 'RLB Usuarios',
                procesado: 0,
                laboratoryId: laboratoryId
            },
            take: limit && limit > 0 ? limit : undefined,
            orderBy: { createdAt: 'asc' }
        });

        if (records.length === 0) {
            return NextResponse.json({ message: "No hay registros pendientes", count: 0 });
        }

        const emails = records.map(r => (r.datos as any).Email || `${(r.datos as any).IDUsuario || r.codigoExterno}@bioitia.com`);
        const existingUsers = await prisma.notifiedUser.findMany({
            where: { email: { in: emails }, laboratoryId },
            select: { id: true, email: true }
        });

        const existingMap = new Map(existingUsers.map(u => [u.email, u.id]));

        let processedCount = 0, createdCount = 0, updatedCount = 0, skippedCount = 0;
        const processedIds: string[] = [];

        for (const record of records) {
            try {
                const d = record.datos as any;
                const codigoExt = String(d.IDUsuario || record.codigoExterno);
                const email = d.Email || `${codigoExt}@bioitia.com`;
                
                const data = {
                    codigoExterno: codigoExt,
                    apellido: d.Apellido || "Sin Apellido",
                    nombre: d.Nombre || "",
                    email,
                    laboratoryId,
                    enviarUnaCopia: d.EnviarUnaCopia === true || d.enciarunacopia === true || d.enviar_una_copia === true,
                    clave: (d.Contrasenia || d.contrasenia || d.Contraseña || d.contraseña) 
                        ? String(d.Contrasenia || d.contrasenia || d.Contraseña || d.contraseña).substring(0, 30) 
                        : null
                };

                const userId = existingMap.get(email);
                if (userId) {
                    if (updateExisting) {
                        await prisma.notifiedUser.update({ where: { id: userId }, data: { ...data, updatedAt: new Date() } });
                        updatedCount++;
                    } else {
                        skippedCount++;
                        processedIds.push(record.id);
                        continue;
                    }
                } else {
                    await prisma.notifiedUser.create({ data });
                    createdCount++;
                }

                processedIds.push(record.id);
                processedCount++;

            } catch (error: any) {
                console.error(`Error syncing user ${record.id}:`, error.message);
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

        await createAuditLog({ action: "SYNC_USERS_TASK", entity: "Procesos", details: `Users sync complete: ${processedCount} Success`, laboratoryId, userId: session.user.id, userName: session.user.name });
        
        return NextResponse.json({ success: true, summary: { processed: processedCount, created: createdCount, updated: updatedCount, skipped: skippedCount } });

    } catch (error: any) {
        console.error("Critical error in sync-users batch:", error);
        return NextResponse.json({ error: error.message || "Error al sincronizar usuarios" }, { status: 500 });
    }
}
