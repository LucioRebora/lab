import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        const alturaWorksheet = data.alturaWorksheet ? parseFloat(data.alturaWorksheet) : null;

        const item = await (prisma as any).determination.update({
            where: { id: params.id },
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
                activa: typeof data.activa === "boolean" ? data.activa : true,
                codManlab: data.codManlab || null,
                imprimirHistorico: typeof data.imprimirHistorico === "boolean" ? data.imprimirHistorico : false,
            },
            include: { section: true, method: true }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error updating determination:", error);
        return NextResponse.json({ error: "Failed to update determination" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        await prisma.determination.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Determination deleted successfully" });
    } catch (error) {
        console.error("Error deleting determination:", error);
        return NextResponse.json({ error: "Failed to delete determination" }, { status: 500 });
    }
}
