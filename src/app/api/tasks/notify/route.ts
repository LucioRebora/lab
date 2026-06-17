import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

        const data = await req.json();
        const { nombreSistema, detalle, laboratoryId: reqLabId, metadata } = data;

        if (!nombreSistema || !detalle) {
            return NextResponse.json({ error: "Faltan datos requeridos (nombreSistema, detalle)" }, { status: 400 });
        }

        let laboratoryId = session?.user?.laboratoryId || reqLabId;

        if ((isApiKeyValid || session?.user?.role === 'ADMIN') && reqLabId) {
            laboratoryId = reqLabId;
        }

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratorio no especificado" }, { status: 400 });
        }

        const audit = await createAuditLog({
            action: "TASK_EXECUTION",
            entity: nombreSistema,
            details: detalle,
            metadata: metadata || {},
            laboratoryId: laboratoryId,
            userId: session?.user?.id || null,
            userName: session?.user?.name || "System"
        });

        return NextResponse.json({ 
            success: true, 
            message: "Ejecución de tarea notificada y registrada",
            auditId: audit?.id 
        });

    } catch (error: any) {
        console.error("Error in tasks-notify API:", error);
        return NextResponse.json({ error: error.message || "Error al notificar la tarea" }, { status: 500 });
    }
}
