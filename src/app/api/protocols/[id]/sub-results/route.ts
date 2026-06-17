import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { subResults } = await request.json(); // Array of { id: string, valor: string }

        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!subResults || !Array.isArray(subResults)) {
            return NextResponse.json({ error: "Datos de sub-resultados no válidos" }, { status: 400 });
        }

        // Batch update values
        const updates = subResults.map((sr: any) => 
            (prisma as any).subResult.update({
                where: { id: sr.id },
                data: { valor: sr.valor }
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("PATCH /api/protocols/[id]/sub-results error:", e);
        return NextResponse.json({ error: e.message || "Error al actualizar sub-resultados" }, { status: 500 });
    }
}
