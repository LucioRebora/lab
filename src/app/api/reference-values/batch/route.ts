import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { subDeterminationId, laboratoryId, referenceValues } = await req.json();

        if (!subDeterminationId || !laboratoryId) {
            return NextResponse.json({ error: "IDs are required" }, { status: 400 });
        }

        // Transaction to delete old and insert new
        await prisma.$transaction([
            (prisma as any).referenceValue.deleteMany({
                where: {
                    subDeterminationId,
                    laboratoryId
                }
            }),
            (prisma as any).referenceValue.createMany({
                data: referenceValues.map((rv: any) => ({
                    subDeterminationId,
                    laboratoryId,
                    categoria: rv.categoria,
                    valoresNormales: rv.valoresNormales,
                    informarUnidades: rv.informarUnidades ?? true
                }))
            })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Batch save error:", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
