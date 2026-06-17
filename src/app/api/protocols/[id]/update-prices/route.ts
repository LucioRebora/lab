import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const { prices } = await request.json(); // Array of { determinationId: string, precio: number }

        if (!prices || !Array.isArray(prices)) {
            return NextResponse.json({ error: "Precios no válidos" }, { status: 400 });
        }

        // Actualizar el precio de cada resultado correspondiente
        await Promise.all(prices.map(async (p: any) => {
            await (prisma as any).result.updateMany({
                where: {
                    protocolId: id,
                    determinationId: p.determinationId
                },
                data: {
                    precio: p.precio
                }
            });
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating prices:", error);
        return NextResponse.json({ error: error.message || "Error al actualizar precios" }, { status: 500 });
    }
}
