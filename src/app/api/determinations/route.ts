import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { laboratory: true }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const where: any = user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId };
        
        // Si no es admin o si se pide explícitamente, filtrar por activas
        // Para la página de admin usualmente queremos todas, pero para búsquedas solo activas
        const url = new URL(request.url);
        const onlyActive = url.searchParams.get("active") === "true";
        if (onlyActive) {
            where.activa = true;
        }

        const items = await (prisma as any).determination.findMany({
            where,
            include: { section: true, method: true, subDeterminations: true },
            orderBy: { nombre: 'asc' },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining determinations:", error);
        return NextResponse.json({ error: "Failed to fetch determinations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const data = await request.json();

        // Convertir la altura si está
        const alturaWorksheet = data.alturaWorksheet ? parseFloat(data.alturaWorksheet) : null;

        const item = await (prisma as any).determination.create({
            data: {
                nombre: data.nombre,
                abreviatura: data.abreviatura || null,
                codigo: data.codigo || null,
                mensajeIngreso: data.mensajeIngreso || null,
                comentarioFijo: data.comentarioFijo || null,
                aspecto: data.aspecto || null,
                condicionesMuestra: data.condicionesMuestra || null,
                imprimirWorksheet: typeof data.imprimirWorksheet === "boolean" ? data.imprimirWorksheet : true,
                resumirWorksheet: typeof data.resumirWorksheet === "boolean" ? data.resumirWorksheet : false,
                alturaWorksheet,
                sectionId: data.sectionId || null,
                methodId: data.methodId || null,
                aspectId: data.aspectId || null,
                unitId: data.unitId || null,
                informarMetodo: typeof data.informarMetodo === "boolean" ? data.informarMetodo : true,
                laboratoryId: user.laboratoryId,
                activa: typeof data.activa === "boolean" ? data.activa : true,
                codManlab: data.codManlab || null,
                imprimirHistorico: typeof data.imprimirHistorico === "boolean" ? data.imprimirHistorico : false,
            },
            include: { section: true, method: true }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating determination:", error);
        return NextResponse.json({ error: "Failed to create determination" }, { status: 500 });
    }
}
