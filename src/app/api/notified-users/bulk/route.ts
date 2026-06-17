import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const systemApiKey = process.env.BIOITIA_API_KEY;
        const isApiKeyValid = apiKey && systemApiKey && apiKey === systemApiKey;

        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id && !isApiKeyValid) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await req.json();
        const { users, laboratoryId: reqLabId } = body;

        if (!Array.isArray(users)) {
            return NextResponse.json({ error: "Se esperaba una lista de usuarios (notified users)" }, { status: 400 });
        }

        let laboratoryId = session?.user?.laboratoryId || reqLabId;
        
        // Si es por API Key o ADMIN, permitimos usar el reqLabId
        if ((isApiKeyValid || session?.user?.role === 'ADMIN') && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });
        }

        const emails = users
            .map((u: any) => u.email ? String(u.email).toLowerCase().trim() : null)
            .filter(Boolean);

        // Buscar usuarios existentes por email en este laboratorio
        const existingUsers = await prisma.notifiedUser.findMany({
            where: {
                email: { in: emails as string[] },
                laboratoryId: laboratoryId
            },
            select: { email: true }
        });

        const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

        const toCreate = users.filter((u: any) => {
            if (!u.email || !u.apellido) return false;
            return !existingEmails.has(u.email.toLowerCase().trim());
        });

        if (toCreate.length === 0) {
            return NextResponse.json({
                message: "No hay usuarios nuevos para insertar",
                createdCount: 0,
                skippedCount: users.length
            });
        }

        let createdCount = 0;
        let errors: any[] = [];

        for (const u of toCreate) {
            try {
                await prisma.notifiedUser.create({
                    data: {
                        email: u.email.toLowerCase().trim(),
                        apellido: u.apellido.toUpperCase().trim(),
                        nombre: u.nombre ? u.nombre.toUpperCase().trim() : null,
                        codigoExterno: u.codigoExterno ? String(u.codigoExterno) : null,
                        enviarUnaCopia: !!u.enviarUnaCopia,
                        laboratory: {
                            connect: { id: laboratoryId }
                        }
                    }
                });
                createdCount++;
            } catch (error: any) {
                console.error(`Error creating notified user ${u.email}:`, error);
                errors.push({ email: u.email, error: error.message });
            }
        }

        await createAuditLog({
            userId: session?.user?.id || "EXTERNAL_API",
            userName: session?.user?.name || session?.user?.email || "Sistema Externo",
            action: "IMPORTACION_MASIVA_USUARIOS_NOTIFICADOS",
            entity: "NotifiedUser",
            details: `Importación de ${createdCount} usuarios de notificación.`,
            laboratoryId: laboratoryId || null,
            metadata: { creados: createdCount, errores: errors.length }
        });

        return NextResponse.json({
            message: "Proceso completado",
            createdCount,
            skippedCount: existingEmails.size,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Error in bulk notified users API:", error);
        return NextResponse.json({ error: "Error al procesar usuarios de notificación" }, { status: 500 });
    }
}
