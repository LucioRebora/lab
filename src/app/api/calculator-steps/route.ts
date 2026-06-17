import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { laboratory: true }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const subDeterminationId = searchParams.get("subDeterminationId");
        const laboratoryId = searchParams.get("laboratoryId") || user.laboratoryId;

        if (!subDeterminationId) {
            return NextResponse.json({ error: "subDeterminationId required" }, { status: 400 });
        }

        const items = await prisma.calculatorStep.findMany({
            where: {
                subDeterminationId,
                laboratoryId: laboratoryId || undefined,
            },
            orderBy: { codigoExterno: 'asc' }, // Match our sequence logic
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Error obtaining calculator steps:", error);
        return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const data = await request.json();
        const laboratoryId = data.laboratoryId || user.laboratoryId;

        // Ensure calculation flag is set in parent subdet
        await prisma.subDetermination.update({
            where: { id: data.subDeterminationId },
            data: { calcular: true }
        });

        const item = await (prisma as any).calculatorStep.create({
            data: {
                subDeterminationId: data.subDeterminationId,
                tipoOperacion: data.tipoOperacion,
                callbackNumerico: data.callbackNumerico, // Some use numeric argument
                argumentoNumerico: parseFloat(data.argumentoNumerico || 0),
                argumentoIDSubDete: data.argumentoIDSubDete, // String reference to other subdet codigoExterno
                codigoExterno: data.codigoExterno, // original ID or seq
                laboratoryId,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error creating calculator step:", error);
        return NextResponse.json({ error: "Failed to create step" }, { status: 500 });
    }
}
