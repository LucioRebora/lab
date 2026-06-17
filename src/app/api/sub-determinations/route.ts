import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const laboratoryId = searchParams.get("laboratoryId") || (session.user as any).laboratoryId;
        const determinationId = searchParams.get("determinationId");
        const all = searchParams.get("all") === "true";
        const includeCalculator = searchParams.get("includeCalculator") === "true";

        if (!laboratoryId) {
            return NextResponse.json({ error: "Laboratory ID is required" }, { status: 400 });
        }

        const where: any = { laboratoryId };
        if (!all) where.activa = true;
        if (determinationId) where.determinationId = determinationId;

        const subDeterminations = await (prisma as any).subDetermination.findMany({
            where,
            include: {
                determination: {
                    include: {
                        section: true,
                        method: true
                    }
                },
                unit: true,
                referenceValues: true,
                calculatorSteps: includeCalculator
            },
            orderBy: {
                nombre: 'asc'
            }
        });

        return NextResponse.json(subDeterminations);
    } catch (error) {
        console.error("Fetch sub-determinations error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            nombre,
            codigoExterno,
            determinationId,
            unitId,
            formato,
            calcular,
            informar,
            informar2C,
            informarTextoAntes,
            informarCorteDespues,
            informarVR,
            valorMinimo,
            valorMaximo,
            laboratoryId,
            activa,
            codManlab
        } = body;

        const subDetermination = await (prisma as any).subDetermination.create({
            data: {
                nombre,
                codigoExterno,
                determinationId,
                unitId: unitId || null,
                laboratoryId,
                formato,
                calcular: !!calcular,
                informar: !!informar,
                informar2C: !!informar2C,
                informarTextoAntes,
                informarCorteDespues: !!informarCorteDespues,
                informarVR: !!informarVR,
                valorMinimo,
                valorMaximo,
                activa: typeof activa === "boolean" ? activa : true,
                codManlab: codManlab || null,
            },
            include: {
                determination: true
            }
        });

        await createAuditLog({
            userId: session.user.id,
            userName: session.user.name || session.user.email,
            action: "NUEVA_SUBDETERMINACION",
            entity: "SubDetermination",
            entityId: subDetermination.id,
            details: `Se creó la sub-determinación: ${subDetermination.nombre} para ${subDetermination.determination.nombre}`,
            laboratoryId: laboratoryId || null
        });

        return NextResponse.json(subDetermination);
    } catch (error: any) {
        console.error("Create sub-determination error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
