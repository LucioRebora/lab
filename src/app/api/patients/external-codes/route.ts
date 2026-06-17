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

        const patients = await prisma.patient.findMany({
            where: { laboratoryId },
            select: { codigoExterno: true }
        });

        const codes = patients
            .map(p => p.codigoExterno)
            .filter(Boolean);

        return NextResponse.json({ codes });
    } catch (error: any) {
        console.error("Error fetching patient codes:", error);
        return NextResponse.json({ error: "Error al obtener códigos de pacientes" }, { status: 500 });
    }
}
