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
        const { patients, laboratoryId: reqLabId } = body;

        if (!Array.isArray(patients)) {
            return NextResponse.json({ error: "Se esperaba una lista de pacientes" }, { status: 400 });
        }

        let laboratoryId = session?.user?.laboratoryId || reqLabId;

        // Si es por API Key o ADMIN, permitimos usar el reqLabId
        if ((isApiKeyValid || session?.user?.role === 'ADMIN') && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "ID de laboratorio requerido" }, { status: 400 });
        }

        const externalCodes = patients
            .map((p: any) => p.codigoExterno ? String(p.codigoExterno) : null)
            .filter(Boolean);

        // Buscar pacientes existentes con estos códigos externos
        const existingPatients = await prisma.patient.findMany({
            where: {
                codigoExterno: { in: externalCodes as string[] },
                laboratoryId: laboratoryId
            },
            select: { codigoExterno: true }
        });

        const existingCodes = new Set(existingPatients.map(p => p.codigoExterno));

        const toCreate = patients.filter((p: any) => {
            if (!p.codigoExterno) return false;
            return !existingCodes.has(String(p.codigoExterno));
        });

        if (toCreate.length === 0) {
            return NextResponse.json({
                message: "No hay pacientes nuevos para insertar",
                createdCount: 0,
                skippedCount: patients.length
            });
        }

        let createdCount = 0;
        let errors: any[] = [];

        for (const p of toCreate) {
            try {
                await prisma.patient.create({
                    data: {
                        apellido: (p.apellido || p.nombre || "S/D").toUpperCase().trim(),
                        nombre: (p.nombre || "").toUpperCase().trim(),
                        sexo: (p.sexo || "U").toUpperCase(), 
                        tipoDocumento: (p.tipoDocumento || "DNI").toUpperCase(),
                        documento: p.documento ? String(p.documento).trim() : null,
                        fechaNacimiento: p.fechaNacimiento ? new Date(p.fechaNacimiento) : null,
                        edad: p.edad ? parseInt(p.edad) : null,
                        telefono: p.telefono || null,
                        email: p.email || null,
                        direccion: p.direccion || null,
                        ciudad: p.ciudad || null,
                        codigoPostal: p.codigoPostal || null,
                        entreCalles: p.entreCalles || null,
                        provincia: p.provincia || null,
                        codigoExterno: String(p.codigoExterno),
                        claveInforme: p.claveInforme || null,
                        notifiedUserId: p.notifiedUserId || null,
                        laboratory: {
                            connect: { id: laboratoryId }
                        }
                    }
                });
                createdCount++;
            } catch (error: any) {
                console.error(`Error creating patient ${p.codigoExterno}:`, error);
                errors.push({ codigoExterno: p.codigoExterno, error: error.message });
            }
        }

        await createAuditLog({
            userId: session?.user?.id || "EXTERNAL_API",
            userName: session?.user?.name || session?.user?.email || "Sistema Externo",
            action: "IMPORTACION_MASIVA_PACIENTES",
            entity: "Patient",
            details: `Importación de ${createdCount} pacientes.`,
            laboratoryId: laboratoryId || null,
            metadata: { creados: createdCount, errores: errors.length }
        });

        return NextResponse.json({
            message: "Proceso completado",
            createdCount,
            skippedCount: existingCodes.size,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Error in bulk patients API:", error);
        return NextResponse.json({ error: "Error al procesar pacientes" }, { status: 500 });
    }
}
