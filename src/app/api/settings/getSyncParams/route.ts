import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const systemApiKey = process.env.BIOITIA_API_KEY;
        const isApiKeyValid = apiKey && systemApiKey && apiKey === systemApiKey;

        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id && !isApiKeyValid) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const url = new URL(req.url);
        let laboratoryId = session?.user?.laboratoryId;
        const reqLabId = url.searchParams.get("laboratoryId");

        if ((isApiKeyValid || session?.user?.role === 'ADMIN') && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const setting = await prisma.setting.findUnique({
            where: {
                key_laboratoryId: {
                    key: 'SYNC_EXTERNA',
                    laboratoryId: laboratoryId
                }
            }
        });

        if (!setting) {
            return NextResponse.json({ error: "No se encontró el parámetro SYNC_EXTERNA" }, { status: 404 });
        }

        let parsedData = null;
        try {
            parsedData = JSON.parse(setting.value);
        } catch (e) {
            console.error("Error parsing SYNC_EXTERNA JSON:", e);
            
            // Intento de reparación para rutas Windows mal escapadas (ej: C:\Users)
            try {
                const fixedValue = setting.value.replace(/\\/g, '\\\\');
                parsedData = JSON.parse(fixedValue);
                console.warn("SYNC_EXTERNA: Se recuperó el JSON tras duplicar las barras inversas. Se recomienda corregir el registro en la base de datos.");
            } catch (err) {
                return NextResponse.json({ 
                    error: "El valor del parámetro SYNC_EXTERNA no es un JSON válido", 
                    details: e instanceof Error ? e.message : "Sintaxis inválida" 
                }, { status: 500 });
            }
        }

        // Actualizar lastSyncedId dinámicamente desde externalRecord
        if (parsedData?.data?.tables && Array.isArray(parsedData.data.tables)) {
            try {
                // Obtenemos los máximos de una sola vez para mayor eficiencia
                const maxIds: any[] = await prisma.$queryRaw`
                    SELECT nombre_tabla as "tableName", MAX(CAST(NULLIF(codigo_externo, '') AS BIGINT)) as "maxId"
                    FROM external_record
                    WHERE laboratory_id = ${laboratoryId}
                    AND codigo_externo ~ '^[0-9]+$'
                    GROUP BY nombre_tabla
                `;

                for (const table of parsedData.data.tables) {
                    const found = maxIds.find(m => m.tableName === table.tableName);
                    if (found && found.maxId !== null) {
                        table.lastSyncedId = Number(found.maxId);
                    }
                }
            } catch (queryError) {
                console.error("Error al calcular maxIds desde externalRecord:", queryError);
                // Fallback: no actualizamos y dejamos los valores que estaban en el JSON
            }
        }

        return NextResponse.json(parsedData);
    } catch (error: any) {
        console.error("Error fetching getSyncParams:", error);
        return NextResponse.json({ error: "Error al obtener parámetros de sincronización" }, { status: 500 });
    }
}
