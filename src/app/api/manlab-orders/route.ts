import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { 
            resultId, barcode, rotulo, cliente, codPrestacion, 
            iva, comentario, diuresis, tipoDocumento, numeroDocumento 
        } = data;

        if (!resultId) {
            return NextResponse.json({ error: "Result ID is required" }, { status: 400 });
        }

        // Upsert ManlabOrder
        const order = await prisma.manlabOrder.upsert({
            where: { resultId: resultId },
            update: {
                barcode,
                rotulo,
                cliente,
                codPrestacion,
                iva,
                comentario,
                diuresis,
                tipoDocumento,
                numeroDocumento,
                updatedAt: new Date()
            },
            create: {
                resultId,
                barcode,
                rotulo,
                cliente,
                codPrestacion,
                iva,
                comentario,
                diuresis,
                tipoDocumento,
                numeroDocumento
            }
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error saving ManlabOrder:", error);
        return NextResponse.json({ error: "Failed to save order" }, { status: 500 });
    }
}
