import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get("x-api-key");
        const systemApiKey = process.env.BIOITIA_API_KEY;
        const isApiKeyValid = apiKey && systemApiKey && apiKey === systemApiKey;

        const session = await getServerSession(authOptions);
        
        if (!session?.user?.id && !isApiKeyValid) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await req.json();
        const { nombreTabla, datos, codigoExterno, laboratoryId: reqLabId } = data;

        if (!nombreTabla || !datos) {
            return NextResponse.json({ error: "Faltan datos requeridos (nombreTabla, datos)" }, { status: 400 });
        }

        let laboratoryId = session?.user?.laboratoryId || reqLabId;

        if ((isApiKeyValid || session?.user?.role === 'ADMIN') && reqLabId) {
            laboratoryId = reqLabId;
        }

        // Apply filter for PRO SubResultados
        if (nombreTabla === "PRO SubResultados") {
            const idSubRes = parseInt(codigoExterno || datos.IDSubResultado);
            if (!isNaN(idSubRes) && idSubRes <= 3251276) {
                return NextResponse.json({ message: "Registro omitido por filtro de IDSubResultado", skipped: true });
            }
        }

        const record = await (prisma as any).externalRecord.create({
            data: {
                nombreTabla,
                datos: datos || {},
                codigoExterno: codigoExterno ? String(codigoExterno) : (datos.IDSubResultado ? String(datos.IDSubResultado) : null),
                laboratoryId: laboratoryId || null,
                procesado: 0
            }
        });

        return NextResponse.json(record);
    } catch (error: any) {
        console.error("Error in envio-datos API:", error);
        return NextResponse.json({ error: error.message || "Error al procesar el registro" }, { status: 500 });
    }
}
